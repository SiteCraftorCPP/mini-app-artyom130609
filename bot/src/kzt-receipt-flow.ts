import type { Bot, Context } from "grammy";
import { InlineKeyboard } from "grammy";

import {
  deleteKztSession,
  getKztSession,
  updateKztSession,
  type KztSession,
} from "./kzt-receipt-store.js";
import { deliverPaidPendingOrder } from "./order-notify.js";
import { BTN_WRITE_MANAGER } from "./texts.js";

const userAwaitingPhoto = new Map<number, string>();

const MGR_URL = process.env.MANAGER_TELEGRAM_URL?.trim() || "https://t.me/artshopvirts_man";

function buyerLinePlain(p: KztSession["pending"]): string {
  const u = p.telegramUsername?.trim();
  if (u) {
    return `@${u} (ID: ${p.telegramUserId})`;
  }
  const fn = p.telegramFirstName?.trim();
  if (fn) {
    return `${fn} (ID: ${p.telegramUserId})`;
  }
  return `ID: ${p.telegramUserId}`;
}

function adminCaptionPlain(s: KztSession): string {
  const p = s.pending;
  const amt = p.amountRub != null ? `${p.amountRub.toFixed(2)} RUB` : "—";
  return [
    "❗ Подтверждение оплаты ❗",
    "",
    `Заказ: ${p.orderNumber}`,
    `Создан: ${new Date(s.createdAt).toLocaleString("ru-RU")}`,
    `Пользователь: ${buyerLinePlain(p)}`,
    `Сумма: ${amt}`,
    "Тип подтверждения: photo",
  ].join("\n");
}

async function handleKztPhoto(
  ctx: Context,
  bot: Bot,
  adminIds: Set<number>,
  token: string,
): Promise<boolean> {
  const session = getKztSession(token);
  if (!session || session.state !== "await_photo" || ctx.from?.id !== session.telegramUserId) {
    userAwaitingPhoto.delete(ctx.from?.id ?? 0);
    return false;
  }
  const photos = ctx.message?.photo;
  if (!photos?.length) {
    return false;
  }
  const best = photos[photos.length - 1];
  const fileId = best.file_id;
  updateKztSession(token, { state: "await_admin", receiptFileId: fileId });
  userAwaitingPhoto.delete(session.telegramUserId);

  const cap = adminCaptionPlain(session);
  const kb = new InlineKeyboard()
    .text("✅ Подтвердить", `kztok:${token}`)
    .text("❌ Отклонить", `kztno:${token}`);

  for (const aid of adminIds) {
    try {
      await bot.api.sendPhoto(aid, fileId, {
        caption: cap,
        reply_markup: kb,
      });
    } catch (e) {
      console.error("[kzt] sendPhoto admin", aid, e);
    }
  }

  await ctx.reply(
    [
      "✅ Чек получен.",
      "",
      "Ожидайте проверки администратором. После подтверждения вам придёт уведомление об оформлении заказа.",
    ].join("\n"),
  );
  return true;
}

export async function handleKztReceiptDeepLink(ctx: Context, payload: string): Promise<void> {
  if (ctx.chat?.type !== "private" || !ctx.from) {
    return;
  }
  const token = payload.startsWith("kzt_") ? payload.slice(4) : "";
  if (!token || !/^[a-f0-9]+$/.test(token)) {
    await ctx.reply("Некорректная ссылка. Откройте магазин из бота и снова нажмите «Я оплатил».");
    return;
  }
  const session = getKztSession(token);
  if (!session) {
    await ctx.reply("Сессия оплаты устарела. Оформите заказ в магазине заново.");
    return;
  }
  if (session.telegramUserId !== ctx.from.id) {
    await ctx.reply("Откройте эту ссылку с того же аккаунта Telegram, с которого оформляли заказ.");
    return;
  }
  if (session.state === "await_admin") {
    await ctx.reply("Чек уже отправлен. Ожидайте проверки администратором.");
    return;
  }
  userAwaitingPhoto.set(ctx.from.id, token);
  await ctx.reply(
    [
      "📎 Отправьте сюда фото чека перевода в тенге (одним сообщением, чтобы текст на чеке был читаемым).",
      "",
      `Заказ: ${session.pending.orderNumber}`,
      "",
      "После отправки фото дождитесь проверки.",
    ].join("\n"),
  );
}

export function installKztReceiptFlow(bot: Bot, adminIds: Set<number>, miniAppUrl: string): void {
  bot.use(async (ctx, next) => {
    if (ctx.chat?.type !== "private" || !ctx.from) {
      return next();
    }
    if (ctx.message?.web_app_data) {
      return next();
    }
    if (ctx.message?.photo) {
      const token = userAwaitingPhoto.get(ctx.from.id);
      if (token) {
        const done = await handleKztPhoto(ctx, bot, adminIds, token);
        if (done) {
          return;
        }
      }
      return next();
    }
    if (ctx.message?.text && userAwaitingPhoto.has(ctx.from.id)) {
      const t = ctx.message.text.trim();
      if (t.startsWith("/")) {
        return next();
      }
      await ctx.reply("Нужно отправить фото чека (снимок или скрин), не текстовое сообщение.");
      return;
    }
    return next();
  });

  bot.callbackQuery(/^kztok:([a-f0-9]+)$/, async (ctx) => {
    const token = ctx.match![1];
    const uid = ctx.from?.id;
    if (uid === undefined || !adminIds.has(uid)) {
      await ctx.answerCallbackQuery({ text: "Недоступно", show_alert: true });
      return;
    }
    const session = getKztSession(token);
    if (!session || session.state !== "await_admin") {
      await ctx.answerCallbackQuery({ text: "Сессия не найдена или уже обработана", show_alert: true });
      return;
    }
    await ctx.answerCallbackQuery();
    try {
      await deliverPaidPendingOrder(bot, miniAppUrl, session.pending, {
        skipAdminBroadcast: true,
      });
      deleteKztSession(token);
      userAwaitingPhoto.delete(session.telegramUserId);
      const prev = ctx.callbackQuery.message;
      if (prev && "caption" in prev && prev.caption) {
        await ctx.editMessageCaption({
          caption: `${prev.caption}\n\n✅ Подтверждено администратором`,
          reply_markup: { inline_keyboard: [] },
        });
      }
    } catch (e) {
      console.error("[kzt] approve", e);
      await ctx.reply("Ошибка при подтверждении — см. логи бота.");
    }
  });

  bot.callbackQuery(/^kztno:([a-f0-9]+)$/, async (ctx) => {
    const token = ctx.match![1];
    const uid = ctx.from?.id;
    if (uid === undefined || !adminIds.has(uid)) {
      await ctx.answerCallbackQuery({ text: "Недоступно", show_alert: true });
      return;
    }
    const session = getKztSession(token);
    if (!session || session.state !== "await_admin") {
      await ctx.answerCallbackQuery({ text: "Сессия не найдена или уже обработана", show_alert: true });
      return;
    }
    await ctx.answerCallbackQuery();
    deleteKztSession(token);
    userAwaitingPhoto.delete(session.telegramUserId);
    const kb = new InlineKeyboard().url(BTN_WRITE_MANAGER, MGR_URL);
    const n = session.pending.orderNumber;
    try {
      await bot.api.sendMessage(
        session.telegramUserId,
        [
          `❌ Чек по заказу ${n} не подтверждён.`,
          "",
          "Свяжитесь с менеджером — мы уточним детали перевода.",
        ].join("\n"),
        { reply_markup: kb },
      );
    } catch (e) {
      console.error("[kzt] reject notify user", e);
    }
    const prev = ctx.callbackQuery.message;
    if (prev && "caption" in prev && prev.caption) {
      try {
        await ctx.editMessageCaption({
          caption: `${prev.caption}\n\n❌ Отклонено администратором`,
          reply_markup: { inline_keyboard: [] },
        });
      } catch {
        /* ok */
      }
    }
  });
}
