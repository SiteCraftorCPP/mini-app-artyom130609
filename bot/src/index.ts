import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "dotenv";
import { Bot, InputFile, type Context, InlineKeyboard } from "grammy";

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

import { aboutBackKeyboard, mainMenuInlineKeyboard } from "./keyboards.js";
import {
  buildCustomEmojiPrefixCaption,
  buildMultilineCustomEmojiLinesCaption,
  buildWelcomeHandPointerCaption,
  isLikelyCustomEmojiIdString,
  joinCaptionWithBody,
  sendVisualTokensInOrder,
} from "./custom-emoji-stickers.js";
import {
  getAboutStickerFileIdsFromEnv,
  getHowStickerFileIdFromEnv,
  getWelcomeStickerFileIdsFromEnv,
} from "./sticker-env.js";
import { ABOUT_CUSTOM_EMOJI_ORDER, CUSTOM_EMOJI_IDS, WELCOME_HAND_POINTER_IDS } from "./sticker-ids.js";
import { installAdminModule } from "./admin.js";
import {
  pickVirtOrderDetailsFromRecord,
  sendSellVirtMessage,
  sendVirtOrderSuccess,
  startOrderNotifyHttpServer,
} from "./order-notify.js";
import {
  ABOUT_SHOP_HTML,
  ABOUT_SHOP_LINES,
  BTN_MENU_SHOP,
  VIDEO_CAPTION,
  VIDEO_CAPTION_HTML,
  WELCOME_HTML,
  WELCOME_LINE_1,
  WELCOME_LINE_2,
} from "./texts.js";
import { touchUserUsage } from "./user-usage-store.js";
import { setReferrer } from "./referrals-store.js";
import { captionEntitiesAllBoldExcludingCustomEmoji } from "./caption-bold-helpers.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Подгружаем все существующие .env по очереди (нижележащие переопределяют верхние).
 * Раньше брался только первый файл — если был bot/.env без ORDER_SUCCESS, корневой .env игнорировался.
 * Порядок: BOT_ENV_FILE → корень репо → bot/.env (типичные секреты бота перекрывают общий файл).
 */
function loadEnv() {
  const explicit = process.env.BOT_ENV_FILE?.trim();
  const candidates = [
    explicit,
    resolve(__dirname, "../../.env"),
    resolve(__dirname, "../.env"),
  ].filter((p): p is string => Boolean(p));
  for (const p of candidates) {
    if (existsSync(p)) {
      config({ path: p, override: true });
    }
  }
}

loadEnv();

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN не задан в .env");
  process.exit(1);
}

const bot = new Bot<Context>(token, {
  client: {
    apiRoot: process.env.TELEGRAM_API_ROOT || "https://api.telegram.org",
  },
});

const miniAppUrl =
  process.env.MINI_APP_URL?.trim() ||
  process.env.APP_DOMAIN?.trim() ||
  "https://artshopvirts.space";

function resolveBotAdminIdSet(): Set<number> {
  const ids = new Set<number>();
  const single = process.env.TELEGRAM_ADMIN_ID?.trim();
  if (single && /^\d+$/.test(single)) {
    ids.add(Number(single));
  }
  const list = process.env.TELEGRAM_ADMIN_IDS?.trim() || process.env.VITE_ADMIN_TELEGRAM_IDS?.trim();
  if (list) {
    for (const part of list.split(/[\s,;]+/).map((s) => s.trim())) {
      if (/^\d+$/.test(part)) {
        ids.add(Number(part));
      }
    }
  }
  return ids;
}

const BOT_ADMIN_IDS = resolveBotAdminIdSet();

type WelcomePhoto =
  | { type: "url"; url: string }
  | { type: "file"; path: string };

function resolveWelcomePhoto(): WelcomePhoto | null {
  const url = process.env.WELCOME_PHOTO_URL?.trim();
  if (url && /^https?:\/\//i.test(url)) {
    return { type: "url", url };
  }
  const fromEnv = process.env.WELCOME_PHOTO_PATH?.trim();
  const botRoot = resolve(__dirname, "..");
  const repoRoot = resolve(__dirname, "../..");
  /**
   * Только /start. Уведомление о заказе — отдельно (order-notify: photo_2, order-success…).
   * Fallback photo_2026… — старый баннер, если нет welcome.jpg/png.
   */
  const candidates = [
    fromEnv && resolve(botRoot, fromEnv),
    resolve(botRoot, "images", "photo_1.jpg"),
    resolve(botRoot, "images", "photo_1.png"),
    resolve(botRoot, "images", "photo_2026-04-07_20-21-06.jpg"),
    resolve(repoRoot, "images", "photo_2026-04-07_20-21-06.jpg"),
  ].filter((p): p is string => Boolean(p));

  for (const p of candidates) {
    if (existsSync(p)) return { type: "file", path: p };
  }
  return null;
}

function resolveInstructionVideoPath(): string | null {
  const fromEnv = process.env.INSTRUCTION_VIDEO_PATH?.trim();
  const base = resolve(__dirname, "..");
  const candidates = [
    fromEnv && fromEnv.length > 0 ? resolve(base, fromEnv) : null,
    resolve(base, "images", "photo_2026-04-07_20-21-06.mp4"),
    resolve(base, "images", "photo_2026-04-07_20-21-06.mov"),
    resolve(base, "images", "photo_2026-04-07_20-21-06"),
  ].filter((p): p is string => Boolean(p));

  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

/** Старая reply-клавиатура «залипает» у клиента, пока не придёт remove_keyboard (в одном сообщении с inline её нельзя совместить). */
async function clearReplyKeyboard(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (chatId === undefined) return;
  const m = await ctx.reply("\u2060", {
    reply_markup: { remove_keyboard: true },
  });
  try {
    await ctx.api.deleteMessage(chatId, m.message_id);
  } catch {
    /* не критично */
  }
}

async function sendWelcome(ctx: Context) {
  await clearReplyKeyboard(ctx);

  const markup = mainMenuInlineKeyboard(miniAppUrl);
  const fromEnv = getWelcomeStickerFileIdsFromEnv();
  if (fromEnv && fromEnv.length !== 2) {
    console.warn(
      "[welcome] WELCOME_STICKER_FILE_IDS: нужно ровно 2 id (рука, указатель) — взяты значения из кода (sticker-ids).",
    );
  }
  const handPointerPair: [string, string] =
    fromEnv?.length === 2 ? [fromEnv[0]!.trim(), fromEnv[1]!.trim()] : [...WELCOME_HAND_POINTER_IDS];
  const allCustomVisual =
    handPointerPair.length === 2 &&
    handPointerPair.every((t) => isLikelyCustomEmojiIdString(t));

  if (!allCustomVisual) {
    await sendVisualTokensInOrder(ctx, handPointerPair);
    const photoPlain = resolveWelcomePhoto();
    if (photoPlain) {
      const extra = {
        caption: WELCOME_HTML,
        parse_mode: "HTML" as const,
        reply_markup: markup,
      };
      if (photoPlain.type === "url") {
        await ctx.replyWithPhoto(photoPlain.url, extra);
      } else {
        const buffer = readFileSync(photoPlain.path);
        await ctx.replyWithPhoto(new InputFile(buffer, basename(photoPlain.path)), extra);
      }
    } else {
      await ctx.reply(WELCOME_HTML, { parse_mode: "HTML", reply_markup: markup });
    }
    return;
  }

  const withIcons = await buildWelcomeHandPointerCaption(
    ctx,
    handPointerPair[0],
    handPointerPair[1],
    WELCOME_LINE_1,
    WELCOME_LINE_2,
  );
  const caption = withIcons?.text ?? WELCOME_HTML;
  const capEntities = withIcons?.entities;
  const capEntitiesFinal =
    capEntities && capEntities.length > 0
      ? captionEntitiesAllBoldExcludingCustomEmoji(caption, capEntities)
      : undefined;
  const withEntities = Boolean(capEntities?.length);

  const photo = resolveWelcomePhoto();
  if (photo) {
    if (photo.type === "url") {
      await ctx.replyWithPhoto(photo.url, {
        caption,
        reply_markup: markup,
        ...(withEntities
          ? { caption_entities: capEntitiesFinal }
          : { parse_mode: "HTML" as const }),
      });
    } else {
      const buffer = readFileSync(photo.path);
      await ctx.replyWithPhoto(new InputFile(buffer, basename(photo.path)), {
        caption,
        reply_markup: markup,
        ...(withEntities
          ? { caption_entities: capEntitiesFinal }
          : { parse_mode: "HTML" as const }),
      });
    }
  } else {
    console.warn(
      "Баннер не найден: WELCOME_PHOTO_URL / WELCOME_PHOTO_PATH — иконки в одном сообщении с текстом.",
    );
    await ctx.reply(caption, {
      reply_markup: markup,
      ...(withEntities
        ? { entities: capEntitiesFinal }
        : { parse_mode: "HTML" as const }),
    });
  }
}

/** Параметр после /start (t.me/bot?start=sell → в чате часто «/start sell»). */
function getStartPayload(ctx: Context): string {
  const t = ctx.message?.text?.trim();
  if (!t?.startsWith("/start")) {
    return "";
  }
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length < 2) {
    return "";
  }
  return parts.slice(1).join(" ").trim();
}

/** Deep link /start sell — тот же контент, что и при нажатии «Продать» в мини-аппе (HTTP). */
async function sendSellVirtGuidance(ctx: Context) {
  if (ctx.chat?.type !== "private") {
    return;
  }
  const uid = ctx.from?.id;
  if (uid === undefined) {
    return;
  }
  await clearReplyKeyboard(ctx);
  await sendSellVirtMessage(bot, uid);
}


const requiredChannelId = process.env.REQUIRED_CHANNEL_ID?.trim();
const requiredChannelUrl = process.env.REQUIRED_CHANNEL_URL?.trim();

bot.use(async (ctx, next) => {
  if (!requiredChannelId || !requiredChannelUrl) return next();
  if (ctx.from?.id === undefined) return next();
  if (ctx.chat?.type !== "private") return next();

  if (ctx.callbackQuery?.data === "check_sub") {
    try {
      const member = await ctx.api.getChatMember(requiredChannelId, ctx.from.id);
      const isSubscribed = ["creator", "administrator", "member"].includes(member.status);
      if (isSubscribed) {
        await ctx.answerCallbackQuery({ text: "✅ Подписка подтверждена!", show_alert: true });
        await ctx.deleteMessage().catch(() => {});
        return sendWelcome(ctx);
      } else {
        await ctx.answerCallbackQuery({ text: "❌ Вы еще не подписались на канал.", show_alert: true });
        return;
      }
    } catch (e) {
      console.error("Check sub error:", e);
      return next();
    }
  }

  try {
    const member = await ctx.api.getChatMember(requiredChannelId, ctx.from.id);
    const isSubscribed = ["creator", "administrator", "member"].includes(member.status);
    if (!isSubscribed) {
      const text = "❗️ Для использования бота необходимо подписаться на канал.";
      const kb = new InlineKeyboard()
        .url("Подписаться", requiredChannelUrl)
        .row()
        .text("Проверить", "check_sub");
      
      if (ctx.callbackQuery) {
        await ctx.answerCallbackQuery();
        await ctx.editMessageText(text, { reply_markup: kb }).catch(() => {});
      } else {
        await ctx.reply(text, { reply_markup: kb });
      }
      return;
    }
  } catch (e) {
    console.error("GetChatMember error:", e);
  }

  return next();
});

/** Кнопка «Магазин» у поля ввода: для кэша клиента — повторяем на /start (не путать с «Меню» = команды). */
async function setWebAppMenuButtonForPrivateChat(
  ctx: Context,
  chatId: number,
): Promise<void> {
  const shopUrl = miniAppUrl.replace(/\/$/, "");
  try {
    await ctx.api.setChatMenuButton({
      chat_id: chatId,
      menu_button: {
        type: "web_app",
        text: BTN_MENU_SHOP,
        web_app: { url: shopUrl },
      },
    });
  } catch (e) {
    console.warn("[start] setChatMenuButton (Web App) для чата", chatId, e);
  }
}

bot.command("start", async (ctx) => {
  if (ctx.chat?.type === "private" && ctx.chat.id != null) {
    await setWebAppMenuButtonForPrivateChat(ctx, ctx.chat.id);
  }
  if (ctx.chat?.type === "private" && ctx.from?.id != null) {
    touchUserUsage(ctx.from.id);
  }
  const payload = getStartPayload(ctx);
  if (payload === "sell") {
    await sendSellVirtGuidance(ctx);
    return;
  }
  
  if (payload.startsWith("ref_")) {
    const refIdStr = payload.replace("ref_", "");
    const refId = parseInt(refIdStr, 10);
    if (!isNaN(refId) && ctx.from) {
      setReferrer(ctx.from.id, refId, ctx.from.username);
    }
  }

  await sendWelcome(ctx);
});

installAdminModule(bot, BOT_ADMIN_IDS);

async function sendHowToVideo(ctx: Context) {
  const howToken = (getHowStickerFileIdFromEnv() ?? CUSTOM_EMOJI_IDS.lightning).trim();
  const path = resolveInstructionVideoPath();
  if (!path) {
    await ctx.reply(
      "Видео «Как оформить заказ» пока не загружено: bot/images/ или задайте INSTRUCTION_VIDEO_PATH в .env.",
    );
    return;
  }
  if (isLikelyCustomEmojiIdString(howToken)) {
    const pr = await buildCustomEmojiPrefixCaption(ctx, [howToken]);
    const cap = pr ? joinCaptionWithBody(pr, VIDEO_CAPTION, "\n\n") : null;
    if (!cap) {
      await ctx.replyWithVideo(new InputFile(path), {
        caption: VIDEO_CAPTION_HTML,
        parse_mode: "HTML" as const,
      });
    } else {
      const videoEntities = captionEntitiesAllBoldExcludingCustomEmoji(
        cap.text,
        cap.entities,
      );
      await ctx.replyWithVideo(new InputFile(path), {
        caption: cap.text,
        caption_entities: videoEntities,
      });
    }
  } else {
    await sendVisualTokensInOrder(ctx, [howToken]);
    await ctx.replyWithVideo(new InputFile(path), {
      caption: VIDEO_CAPTION_HTML,
      parse_mode: "HTML" as const,
    });
  }
}

bot.callbackQuery("menu:how", async (ctx) => {
  await ctx.answerCallbackQuery();
  await sendHowToVideo(ctx);
});

bot.callbackQuery("menu:about", async (ctx) => {
  await ctx.answerCallbackQuery();
  const aboutFromEnv = getAboutStickerFileIdsFromEnv();
  const aboutTokens: readonly string[] = aboutFromEnv?.length
    ? aboutFromEnv
    : ABOUT_CUSTOM_EMOJI_ORDER;
  const allCustom =
    aboutTokens.length > 0 &&
    aboutTokens.every((t) => isLikelyCustomEmojiIdString(t.trim()));

  if (allCustom) {
    const cap = await buildMultilineCustomEmojiLinesCaption(
      ctx,
      aboutTokens,
      ABOUT_SHOP_LINES,
    );
    if (cap) {
      await ctx.reply(cap.text, {
        reply_markup: aboutBackKeyboard(),
        entities: captionEntitiesAllBoldExcludingCustomEmoji(cap.text, cap.entities),
      });
      return;
    }
  }
  await sendVisualTokensInOrder(ctx, aboutTokens);
  await ctx.reply(ABOUT_SHOP_HTML, { parse_mode: "HTML", reply_markup: aboutBackKeyboard() });
});

bot.callbackQuery("about:back", async (ctx) => {
  await ctx.answerCallbackQuery();
  try {
    await ctx.deleteMessage();
  } catch {
    /* сообщение уже удалено или недоступно */
  }
});

const VIRT_ORDER_LOG = "[virt-order]";

/** Мини-апп после «успешной» заявки вызывает WebApp.sendData — без отдельного бэкенда. */
bot.on("message", async (ctx, next) => {
  if (ctx.chat?.type === "private" && ctx.from?.id != null) {
    touchUserUsage(ctx.from.id);
  }
  const raw = ctx.message?.web_app_data?.data;
  if (raw === undefined) {
    return next();
  }
  console.info(
    VIRT_ORDER_LOG,
    "web_app_data получен",
    "from=",
    ctx.from?.id,
    "len=",
    raw.length,
  );
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown> & {
      v?: unknown;
      t?: unknown;
    };
    if (
      parsed.v !== 1 ||
      parsed.t !== "virt_order_success" ||
      typeof parsed.orderId !== "string" ||
      typeof parsed.orderNumber !== "string"
    ) {
      console.warn(
        VIRT_ORDER_LOG,
        "пропуск: неверный JSON или не virt_order_success",
        parsed,
      );
      return next();
    }
    const uid = ctx.from?.id;
    if (uid === undefined) {
      console.warn(VIRT_ORDER_LOG, "пропуск: нет ctx.from.id");
      return next();
    }
    console.info(
      VIRT_ORDER_LOG,
      "отправка sendVirtOrderSuccess",
      "telegramUserId=",
      uid,
      "orderNumber=",
      parsed.orderNumber,
      "orderId=",
      parsed.orderId,
    );
    const orderKind =
      parsed.orderKind === "account" || parsed.orderKind === "virt"
        ? parsed.orderKind
        : undefined;
    const details = pickVirtOrderDetailsFromRecord(parsed);
    await sendVirtOrderSuccess(bot, miniAppUrl, {
      telegramUserId: uid,
      orderId: parsed.orderId,
      orderNumber: parsed.orderNumber,
      ...(orderKind ? { orderKind } : {}),
      ...details,
    });
    console.info(VIRT_ORDER_LOG, "сообщение пользователю отправлено ok", uid);
  } catch (e) {
    console.error(VIRT_ORDER_LOG, "ошибка обработки web_app_data:", e);
    await next();
  }
});

bot.catch((err) => {
  console.error("Bot error:", err);
});

startOrderNotifyHttpServer(bot, miniAppUrl);

await bot.start({
  onStart: async (botInfo) => {
    console.log(`Бот @${botInfo.username} запущен (long polling)`);
    console.log(`Mini App URL: ${miniAppUrl}`);
    const shopUrl = miniAppUrl.replace(/\/$/, "");
    try {
      await bot.api.setChatMenuButton({
        menu_button: {
          type: "web_app",
          text: BTN_MENU_SHOP,
          web_app: { url: shopUrl },
        },
      });
      console.log(`Кнопка «${BTN_MENU_SHOP}» в поле ввода (Web App) установлена.`);
    } catch (e) {
      console.warn("setChatMenuButton (кнопка магазина в поле ввода) не удался:", e);
    }
  },
});
