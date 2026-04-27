import { createServer } from "node:http";
import { getReferralUser } from "./referrals-store.js";
import { randomInt } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

import type { Bot } from "grammy";
import { InputFile } from "grammy";
import { InlineKeyboard } from "grammy";
import { Freekassa } from "@boarteam/freekassa-sdk";

import { getTelegramUserIdFromWebAppInitData } from "./telegram-webapp-init-data.js";
import { captionEntitiesAllBoldExcludingCustomEmoji } from "./caption-bold-helpers.js";
import {
  buildOrderCompletedThreeEmojisCaption,
  buildOrderManagerSuccessTwoEmojisCaption,
  buildOrderSuccessThreeEmojisCaption,
  type OrderManagerSuccessTwoEmojisParts,
  type OrderSuccessThreeEmojisParts,
} from "./custom-emoji-stickers.js";
import {
  getOrderCompletedStickerIdsFromEnv,
  getOrderSuccessManagerStickerIdsFromEnv,
  getOrderSuccessStickerIdsFromEnv,
} from "./sticker-env.js";
import {
  BTN_WRITE_MANAGER,
  BTN_WRITE_REVIEW,
  REVIEW_POST_URL,
  buildAccountAppOrderCaptionHtml,
  buildAccountManagerOrderCaptionHtml,
  buildOrderCompletedBuyerCaptionHtml,
  buildSellVirtCaptionHtml,
  buildVirtOrderCaptionHtml,
  getOrderCompletedReviewLineText,
} from "./texts.js";
import { addOrUpdateActiveOrder, type AdminOrderRow } from "./orders-store.js";
import { consumePromoCode, getAllPromoCodes } from "./promo-codes-store.js";
import { parseRublesAmountFromUserText } from "./money-input.js";
import {
  buildPaymentUrl,
  formatAmountForFk,
  isFreeKassaNotifyIp,
  parseFreeKassaFormBody,
  readRequestBodyString,
  resolveFreeKassaMethodId,
  signNotification,
  signPaymentForm,
} from "./freekassa.js";
import {
  buildMerchantOrderId,
  getPendingPayment,
  isIntidProcessed,
  markIntidProcessed,
  markPendingSent,
  putPendingPayment,
  type PendingPaymentOrder,
} from "./payment-pending-store.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export type OrderNotifyKind = "virt" | "account";

export type VirtOrderSuccessPayload = {
  /** Номер заказа для текста (#JDHDH или JDHDH) */
  orderNumber: string;
  /** Внутренний id заказа для deep link в мини-апп */
  orderId: string;
  /** chat_id = telegram user id (личка с ботом) */
  telegramUserId: number;
  /**
   * По умолчанию `virt`. Для покупки аккаунта — `account` (шаблон см. ACCOUNT_ORDER_TEMPLATE).
   */
  orderKind?: OrderNotifyKind;
  // Дополнительные поля, которые должны приходить из мини-аппа
  game?: string;
  server?: string;
  virtAmountLabel?: string;
  transferMethod?: string;
  bankAccount?: string;
  amountRub?: number;
  promoCode?: string;
};

/**
 * Только картинка для «заказ оформлен» — без welcome и без баннера /start.
 * __dirname у собранного бота = …/bot/dist → файлы ищем в …/bot/images/ (не в src/).
 */
type OrderSuccessPhoto =
  | { type: "url"; url: string }
  | { type: "file"; path: string };

function resolvePathFromEnv(raw: string | undefined, botRoot: string): string | null {
  const t = raw?.trim();
  if (!t) return null;
  if (t.startsWith("/")) {
    return t;
  }
  return resolve(botRoot, t);
}

/** Имена файлов в images/ — только эти строки (ASCII), без других вариантов. */
export const ORDER_SUCCESS_FILE_NAMES = [
  "order-success.jpg",
  "order-success.png",
  "photo_2.jpg",
  "photo_2.png",
  "photo_2026-04-07_20-21-21.jpg",
  "photo_2026-04-07_20-21-21.png",
  /** как в экспорте с телефона (секунды в имени могут отличаться) */
  "photo_2026-04-07_20-21-06.jpg",
  "photo_2026-04-07_20-21-06.png",
  "order.jpg",
  "order.png",
] as const;

/** Корни, где ищем images/ (на сервере cwd systemd часто = папка bot, а __dirname = …/bot/dist). */
function orderPhotoInstallRoots(): string[] {
  const seen = new Set<string>();
  const add = (p: string) => {
    const n = resolve(p);
    if (!seen.has(n)) {
      seen.add(n);
    }
  };
  add(resolve(__dirname, ".."));
  add(process.cwd());
  const extra = process.env.BOT_INSTALL_ROOT?.trim();
  if (extra) {
    add(extra);
  }
  return [...seen];
}

export type OrderSuccessPhotoDiag = {
  runtimeDirname: string;
  botRoot: string;
  repoRoot: string;
  cwd: string;
  installRoots: string[];
  env_ORDER_SUCCESS_IMAGE_PATH: string | undefined;
  env_ORDER_SUCCESS_PHOTO_URL: string | undefined;
  env_BOT_INSTALL_ROOT: string | undefined;
  candidates: string[];
  firstExistingPath: string | null;
  urlFallback: string | null;
};

/** Для отладки на сервере: те же пути, что при отправке заказа. */
export function diagnoseOrderSuccessPhoto(): OrderSuccessPhotoDiag {
  const runtimeDirname = __dirname;
  const botRoot = resolve(__dirname, "..");
  const repoRoot = resolve(__dirname, "../..");
  const installRoots = orderPhotoInstallRoots();

  const fileCandidates: string[] = [];
  const push = (p: string | null) => {
    if (p && !fileCandidates.includes(p)) {
      fileCandidates.push(p);
    }
  };

  push(resolvePathFromEnv(process.env.ORDER_SUCCESS_IMAGE_PATH, botRoot));

  for (const root of installRoots) {
    for (const name of ORDER_SUCCESS_FILE_NAMES) {
      push(resolve(root, "images", name));
    }
  }

  for (const name of ORDER_SUCCESS_FILE_NAMES) {
    push(resolve(repoRoot, "images", name));
  }

  const firstExistingPath =
    fileCandidates.find((p) => existsSync(p)) ?? null;

  const orderUrl = process.env.ORDER_SUCCESS_PHOTO_URL?.trim();
  const urlFallback =
    orderUrl && /^https?:\/\//i.test(orderUrl) ? orderUrl : null;

  return {
    runtimeDirname,
    botRoot,
    repoRoot,
    cwd: process.cwd(),
    installRoots,
    env_ORDER_SUCCESS_IMAGE_PATH: process.env.ORDER_SUCCESS_IMAGE_PATH,
    env_ORDER_SUCCESS_PHOTO_URL: process.env.ORDER_SUCCESS_PHOTO_URL,
    env_BOT_INSTALL_ROOT: process.env.BOT_INSTALL_ROOT,
    candidates: fileCandidates,
    firstExistingPath,
    urlFallback,
  };
}

function resolveOrderSuccessPhoto(): OrderSuccessPhoto | null {
  const fromEnv = process.env.ORDER_SUCCESS_IMAGE_PATH?.trim();
  const botRoot = resolve(__dirname, "..");

  if (fromEnv) {
    const p = fromEnv.startsWith("/") ? fromEnv : resolve(botRoot, fromEnv);
    if (existsSync(p)) {
      console.info("[virt-order] фото заказа из env (найдено):", p);
      return { type: "file", path: p };
    } else {
      console.error("[virt-order] фото заказа из env НЕ НАЙДЕНО по пути:", p);
    }
  }

  const diag = diagnoseOrderSuccessPhoto();
  if (diag.firstExistingPath) {
    console.info("[virt-order] фото заказа (авто-поиск):", diag.firstExistingPath);
    return { type: "file", path: diag.firstExistingPath };
  }

  if (diag.urlFallback) {
    return { type: "url", url: diag.urlFallback };
  }

  return null;
}

const SELL_ORDER_REF_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomSellOrderRef(): string {
  let s = "";
  for (let i = 0; i < 5; i++) {
    s += SELL_ORDER_REF_CHARS[randomInt(SELL_ORDER_REF_CHARS.length)];
  }
  return s;
}

/**
 * «Продать вирты» — фото + текст в личку (HTTP из мини-аппа, без переходов по t.me).
 */
export async function sendSellVirtMessage(
  bot: Bot,
  telegramUserId: number,
): Promise<void> {
  const orderRef = randomSellOrderRef();
  const parts = getOrderManagerSuccessTextParts(orderRef);
  const managerIds = getOrderSuccessManagerStickerIdsFromEnv();
  const withEm = await buildOrderManagerSuccessTwoEmojisCaption(
    bot.api,
    managerIds,
    parts,
  );
  let caption: string;
  let caption_entities: import("@grammyjs/types").MessageEntity[] | undefined;
  if (withEm) {
    caption = withEm.text;
    caption_entities = captionEntitiesAllBoldExcludingCustomEmoji(
      withEm.text,
      withEm.entities,
    );
  } else {
    caption = buildSellVirtCaptionHtml(orderRef);
  }
  const photo = resolveOrderSuccessPhoto();
  const managerUrl =
    process.env.MANAGER_TELEGRAM_URL?.trim() || "https://t.me/artshopvirts_man";
  const reply_markup = new InlineKeyboard().url(BTN_WRITE_MANAGER, managerUrl);

  if (!photo) {
    console.warn(
      "[sell] нет ORDER_SUCCESS фото — сообщение не отправлено.",
    );
    return;
  }

  const withCapEntities = caption_entities && caption_entities.length > 0;
  const sendPhotoOptions = {
    caption,
    reply_markup,
    ...(withCapEntities ? { caption_entities } : { parse_mode: "HTML" as const }),
  };

  await retrySendPhoto(async () => {
    if (photo.type === "url") {
      await bot.api.sendPhoto(telegramUserId, photo.url, sendPhotoOptions);
    } else {
      const buffer = readFileSync(photo.path);
      await bot.api.sendPhoto(
        telegramUserId,
        new InputFile(buffer, `${Date.now()}_${basename(photo.path)}`),
        sendPhotoOptions,
      );
    }
  }).catch((e) => {
    console.error("[sell] Фото так и не отправилось", e);
    throw e;
  });
}

function formatOrderNumberForCaption(orderNumber: string): string {
  const t = orderNumber.trim();
  return t.startsWith("#") ? t : `#${t}`;
}

function formatOpenedAtLine(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function buildActiveOrderRow(
  bot: Bot,
  payload: VirtOrderSuccessPayload,
): Promise<AdminOrderRow> {
  const id = payload.orderId.trim();
  const publicOrderId = formatOrderNumberForCaption(payload.orderNumber);
  const kind = payload.orderKind ?? "virt";
  let telegramUsername = "user";
  try {
    const chat = await bot.api.getChat(payload.telegramUserId);
    if (chat.type === "private" && "username" in chat && chat.username) {
      telegramUsername = chat.username;
    } else {
      console.warn(
        "[virt-order] getChat не вернул username для",
        payload.telegramUserId,
        chat,
      );
    }
  } catch (e) {
    console.error("[virt-order] getChat failed for", payload.telegramUserId, e);
    /* getChat may fail; stub ok */
  }
  return {
    id,
    publicOrderId,
    categoryLabel: kind === "account" ? "Аккаунт" : "Вирты",
    telegramUsername,
    telegramUserId: String(payload.telegramUserId),
    game: payload.game ?? "—",
    server: payload.server ?? "—",
    virtAmountLabel: payload.virtAmountLabel ?? "—",
    transferMethod: payload.transferMethod ?? "—",
    bankAccount: payload.bankAccount ?? "—",
    amountRub: payload.amountRub ?? 0,
    promoCode: payload.promoCode,
    openedAtLine: formatOpenedAtLine(),
  };
}

/** Покупка виртов — кнопка «Узнать детали» в мини-апп. */
function buildVirtOrderCaption(orderNumber: string): string {
  const n = formatOrderNumberForCaption(orderNumber);
  return [
    `✅ Заказ ${n} успешно оформлен!`,
    "",
    "🕔 Срок выдачи: от 5 минут до 24 часов",
    "(среднее время — ~20 минут)",
    "",
    "После зачисления виртов на ваш счёт вы получите уведомление в этом чате.",
    "",
    "Чтобы узнать детали заказа, нажмите кнопку ниже 👇",
  ].join("\n");
}

/** Покупка аккаунта — срок + WebApp «Узнать детали» (то же фото ORDER_SUCCESS_*). */
function buildAccountAppOrderCaption(orderNumber: string): string {
  const n = formatOrderNumberForCaption(orderNumber);
  return [
    `✅ Заказ ${n} успешно оформлен!`,
    "",
    "🕔 Срок выдачи: от 5 минут до 24 часов",
    "(среднее время — ~20 минут)",
    "",
    "Информация по заказу будет отправлена в этот чат.",
    "",
    "Чтобы узнать детали заказа, нажмите кнопку ниже 👇",
  ].join("\n");
}

type OrderKindForSuccessParts = "virt" | "account";

function getOrderSuccessThreeEmojisTextParts(
  orderNumber: string,
  kind: OrderKindForSuccessParts,
): OrderSuccessThreeEmojisParts {
  const n = formatOrderNumberForCaption(orderNumber);
  return {
    line1: `Заказ ${n} успешно оформлен!`,
    delivery: "Срок выдачи: от 5 минут до 24 часов",
    paren: "(среднее время — ~20 минут)",
    body:
      kind === "virt"
        ? "После зачисления виртов на ваш счёт вы получите уведомление в этом чате."
        : "Информация по заказу будет отправлена в этот чат.",
    lastBeforePointer: "Чтобы узнать детали заказа, нажмите кнопку ниже",
  };
}

/** Покупка аккаунта — связь с менеджером (без webApp-кнопки заказа), без custom_emoji. */
function buildAccountManagerOrderCaption(orderNumber: string): string {
  const n = formatOrderNumberForCaption(orderNumber);
  return [
    `✅ Заказ ${n} успешно оформлен!`,
    "",
    "Что нужно сделать:",
    "Скопируйте номер заказа и напишите менеджеру через кнопку ниже 👇",
  ].join("\n");
}

function getOrderManagerSuccessTextParts(
  orderNumber: string,
): OrderManagerSuccessTwoEmojisParts {
  const n = formatOrderNumberForCaption(orderNumber);
  return {
    line1: `Заказ ${n} успешно оформлен!`,
    whatToDo: "Что нужно сделать:",
    lineLast: "Скопируйте номер заказа и напишите менеджеру через кнопку ниже",
  };
}

/**
 * Кнопка только типа web_app — иначе Telegram показывает обычную ссылку, а не открытие мини-аппа.
 * URL должен совпадать с доменом Mini App в @BotFather.
 */
/** Только раздел «История заказов» без orderId — карточка по id часто пуста до синхронизации. */
function buildOrderDetailsKeyboard(miniAppUrl: string) {
  const base = miniAppUrl.replace(/\/$/, "");
  const url = `${base}/profile?open=orderHistory`;
  return new InlineKeyboard().webApp("🟢 Узнать детали", url);
}

function buildManagerOrderKeyboard(): InlineKeyboard {
  const url =
    process.env.MANAGER_TELEGRAM_URL?.trim() || "https://t.me/artshopvirts_man";
  return new InlineKeyboard().url(BTN_WRITE_MANAGER, url);
}

type CaptionAndKeyboard = { caption: string; reply_markup: InlineKeyboard };

function resolveVirtOrderCaptionAndKeyboard(
  payload: VirtOrderSuccessPayload,
  miniAppUrl: string,
): CaptionAndKeyboard {
  const kind = payload.orderKind ?? "virt";
  if (kind === "virt") {
    return {
      caption: buildVirtOrderCaption(payload.orderNumber),
      reply_markup: buildOrderDetailsKeyboard(miniAppUrl),
    };
  }

  /** По умолчанию — WebApp «Узнать детали». Режим manager — только если явно ACCOUNT_ORDER_TEMPLATE=manager. */
  const mode = process.env.ACCOUNT_ORDER_TEMPLATE?.trim().toLowerCase();
  if (mode === "manager") {
    return {
      caption: buildAccountManagerOrderCaption(payload.orderNumber),
      reply_markup: buildManagerOrderKeyboard(),
    };
  }

  return {
    caption: buildAccountAppOrderCaption(payload.orderNumber),
    reply_markup: buildOrderDetailsKeyboard(miniAppUrl),
  };
}

/**
 * Уведомление после успешной покупки виртов (мини-апп → бэкенд вызывает HTTP, см. startOrderNotifyHttpServer).
 */

async function retrySendPhoto(fn: () => Promise<void>, maxRetries = 10) {
  let attempt = 0;
  while (true) {
    try {
      await fn();
      return;
    } catch (err) {
      attempt++;
      if (attempt >= maxRetries) {
        console.error(`[photo-retry] All ${maxRetries} attempts failed.`, err);
        throw err;
      }
      console.warn(`[photo-retry] sendPhoto failed, retrying (${attempt}/${maxRetries})...`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

/** Как `resolveBotAdminIdSet` в index.ts — дублируем, чтобы не плодить циклы. */
function resolveAdminTelegramIdsFromEnv(): number[] {
  const out: number[] = [];
  const single = process.env.TELEGRAM_ADMIN_ID?.trim();
  if (single && /^\d+$/.test(single)) {
    out.push(Number(single));
  }
  const list =
    process.env.TELEGRAM_ADMIN_IDS?.trim() || process.env.VITE_ADMIN_TELEGRAM_IDS?.trim();
  if (list) {
    for (const part of list.split(/[\s,;]+/)) {
      const s = part.trim();
      if (/^\d+$/.test(s)) {
        out.push(Number(s));
      }
    }
  }
  return [...new Set(out)];
}

/** Рассылка админам (TELEGRAM_ADMIN_ID / TELEGRAM_ADMIN_IDS) о новом оформлении заказа. */
export async function notifyAdminsNewOrder(
  bot: Bot,
  payload: VirtOrderSuccessPayload,
): Promise<void> {
  const admins = resolveAdminTelegramIdsFromEnv();
  if (admins.length === 0) {
    return;
  }
  const kind =
    payload.orderKind === "account" ? "покупка аккаунта" : "покупка виртов";
  const lines: string[] = [
    "🆕 Новый заказ",
    "",
    `Тип: ${kind}`,
    `Номер: ${payload.orderNumber}`,
    `ID: ${payload.orderId}`,
  ];
  if (payload.game) {
    lines.push(`Игра: ${payload.game}`);
  }
  if (payload.server) {
    lines.push(`Сервер: ${payload.server}`);
  }
  if (payload.amountRub != null && Number.isFinite(payload.amountRub)) {
    lines.push(`Сумма: ${payload.amountRub} ₽`);
  }
  if (payload.virtAmountLabel) {
    lines.push(`Вирты: ${payload.virtAmountLabel}`);
  }
  if (payload.bankAccount) {
    lines.push(`Счёт: ${payload.bankAccount}`);
  }
  if (payload.transferMethod) {
    lines.push(`Оформление: ${payload.transferMethod}`);
  }
  if (payload.promoCode) {
    lines.push(`Промо: ${payload.promoCode}`);
  }
  lines.push("", `Покупатель (Telegram id): ${payload.telegramUserId}`);

  const text = lines.join("\n");
  for (const aid of admins) {
    try {
      await bot.api.sendMessage(aid, text, {
        link_preview_options: { is_disabled: true },
      });
    } catch (e) {
      console.warn(`[admin-notify] не удалось отправить админу ${aid}:`, e);
    }
  }
}

export async function sendVirtOrderSuccess(
  bot: Bot,
  miniAppUrl: string,
  payload: VirtOrderSuccessPayload,
): Promise<void> {
  console.info("[virt-order] sendVirtOrderSuccess", {
    telegramUserId: payload.telegramUserId,
    orderNumber: payload.orderNumber,
    orderId: payload.orderId,
    orderKind: payload.orderKind ?? "virt",
  });
  try {
    await notifyAdminsNewOrder(bot, payload);
  } catch (e) {
    console.error("[virt-order] notifyAdminsNewOrder:", e);
  }
  const { reply_markup } = resolveVirtOrderCaptionAndKeyboard(payload, miniAppUrl);
  const orderKind: OrderKindForSuccessParts = payload.orderKind === "account" ? "account" : "virt";
  const isAccountManagerMode =
    orderKind === "account" && process.env.ACCOUNT_ORDER_TEMPLATE?.trim().toLowerCase() === "manager";

  let caption: string;
  let caption_entities: import("@grammyjs/types").MessageEntity[] | undefined;

  if (isAccountManagerMode) {
    const mgrParts = getOrderManagerSuccessTextParts(payload.orderNumber);
    const mgrIds = getOrderSuccessManagerStickerIdsFromEnv();
    const withMgr = await buildOrderManagerSuccessTwoEmojisCaption(bot.api, mgrIds, mgrParts);
    if (withMgr) {
      caption = withMgr.text;
      caption_entities = captionEntitiesAllBoldExcludingCustomEmoji(
        withMgr.text,
        withMgr.entities,
      );
    } else {
      caption = buildAccountManagerOrderCaptionHtml(payload.orderNumber);
    }
  } else {
    const parts = getOrderSuccessThreeEmojisTextParts(payload.orderNumber, orderKind);
    const ids = getOrderSuccessStickerIdsFromEnv();
    const withEntities = await buildOrderSuccessThreeEmojisCaption(bot.api, ids, parts);
    if (withEntities) {
      caption = withEntities.text;
      caption_entities = captionEntitiesAllBoldExcludingCustomEmoji(
        withEntities.text,
        withEntities.entities,
      );
    } else {
      caption =
        orderKind === "virt"
          ? buildVirtOrderCaptionHtml(payload.orderNumber)
          : buildAccountAppOrderCaptionHtml(payload.orderNumber);
    }
  }

  const photo = resolveOrderSuccessPhoto();

  if (!photo) {
    console.warn(
      "ORDER_SUCCESS: нет фото на диске и нет рабочего URL — сообщение не отправлено по вашему требованию.",
    );
    return;
  }

  const sendPhotoOptions = {
    caption,
    reply_markup,
    ...(caption_entities && caption_entities.length > 0 ? { caption_entities } : { parse_mode: "HTML" as const }),
  };

  await retrySendPhoto(async () => {
      if (photo.type === "url") {
        console.info("[virt-order] sendPhoto по URL", photo.url.slice(0, 72));
        await bot.api.sendPhoto(payload.telegramUserId, photo.url, sendPhotoOptions);
      } else {
        console.info("[virt-order] sendPhoto заказа с диска", photo.path);
        const buffer = readFileSync(photo.path);
        await bot.api.sendPhoto(
          payload.telegramUserId,
          new InputFile(buffer, `${Date.now()}_${basename(photo.path)}`),
          sendPhotoOptions,
        );
      }
    }).catch((e) => {
      console.error("[virt-order] Фото так и не отправилось", e);
      throw e;
    });

  try {
    const row = await buildActiveOrderRow(bot, payload);
    addOrUpdateActiveOrder(row);
  } catch (e) {
    console.error("[virt-order] addOrUpdateActiveOrder:", e);
  }
}

const COMPLETED_ORDER_REVIEW_PHOTO_NAMES = [
  "photo_3.jpg",
  "photo_3.png",
  "photo_3.jpeg",
  "photo_3.webp",
] as const;

/**
 * Уведомление покупателю после завершения заказа в админке (положите `bot/images/photo_3.*`).
 * Переопределение: `ORDER_COMPLETED_REVIEW_PHOTO_URL` (https) или `ORDER_COMPLETED_REVIEW_IMAGE_PATH` (от корня бота).
 */
function resolveCompletedOrderReviewPhoto(): OrderSuccessPhoto | null {
  const fromUrl = process.env.ORDER_COMPLETED_REVIEW_PHOTO_URL?.trim();
  if (fromUrl && /^https?:\/\//i.test(fromUrl)) {
    return { type: "url", url: fromUrl };
  }
  const botRoot = resolve(__dirname, "..");
  const fromEnv = (process.env.ORDER_COMPLETED_REVIEW_IMAGE_PATH || process.env.ORDER_COMPLETED_REVIEW_PHOTO_PATH)?.trim();
  if (fromEnv) {
    const p = fromEnv.startsWith("/")
      ? fromEnv
      : resolve(botRoot, fromEnv);
    if (existsSync(p)) {
      console.info("[order-complete] фото из env (найдено):", p);
      return { type: "file", path: p };
    } else {
      console.error("[order-complete] фото из env НЕ НАЙДЕНО по пути:", p);
      // Попробуем поискать в папке images рядом с этим путем
      const fileName = basename(p);
      const repoRoot = resolve(__dirname, "../..");
      const altPath = resolve(repoRoot, "images", fileName);
      if (existsSync(altPath)) {
        console.info("[order-complete] фото найдено по альтернативному пути:", altPath);
        return { type: "file", path: altPath };
      }
    }
  }
  for (const root of orderPhotoInstallRoots()) {
    for (const name of COMPLETED_ORDER_REVIEW_PHOTO_NAMES) {
      const p = resolve(root, "images", name);
      if (existsSync(p)) {
        console.info("[order-complete] фото (файл):", p);
        return { type: "file", path: p };
      }
    }
  }
  const repoRoot = resolve(__dirname, "../..");
  for (const name of COMPLETED_ORDER_REVIEW_PHOTO_NAMES) {
    const p = resolve(repoRoot, "images", name);
    if (existsSync(p)) {
      console.info("[order-complete] фото (корень репо):", p);
      return { type: "file", path: p };
    }
  }
  console.warn(
    "[order-complete] нет images/photo_3.* — уведомление о выполнении уйдёт без фото. Задайте ORDER_COMPLETED_REVIEW_PHOTO_URL.",
  );
  return null;
}

function formatCompletedOrderRef(orderNumber: string): string {
  const t = orderNumber.trim().replace(/^#+/, "");
  return `#${t}`;
}

/**
 * Сообщение покупателю: заказ выполнен, отзыв, кнопка на пост + фото `photo_3` при наличии.
 */
export async function sendOrderCompletedToBuyer(
  bot: Bot,
  payload: { telegramUserId: number; orderNumber: string; isAccount?: boolean; accountData?: string },
): Promise<void> {
  const ref = formatCompletedOrderRef(payload.orderNumber);
  const line1 = `Заказ ${ref} успешно выполнен!`;
  const line3 = getOrderCompletedReviewLineText();
  const ids = getOrderCompletedStickerIdsFromEnv();
  const useAccountLayout = Boolean(payload.isAccount && payload.accountData?.trim());

  const withEm = useAccountLayout
    ? await buildOrderCompletedThreeEmojisCaption(bot.api, ids, {
        kind: "account",
        line1,
        accountData: payload.accountData!.trim(),
        line3,
      })
    : await buildOrderCompletedThreeEmojisCaption(bot.api, ids, {
        kind: "virt",
        line1,
        line2: "Вирты успешно зачислены на ваш банковский счёт.",
        line3,
      });

  let caption: string;
  let caption_entities: import("@grammyjs/types").MessageEntity[] | undefined;
  if (withEm) {
    caption = withEm.text;
    caption_entities = captionEntitiesAllBoldExcludingCustomEmoji(
      withEm.text,
      withEm.entities,
    );
  } else {
    caption = buildOrderCompletedBuyerCaptionHtml(
      payload.orderNumber,
      payload.isAccount,
      payload.accountData,
    );
  }

  const reply_markup = new InlineKeyboard().url(BTN_WRITE_REVIEW, REVIEW_POST_URL);

  const photo = resolveCompletedOrderReviewPhoto();
  if (!photo) {
    console.warn("ORDER_COMPLETE: нет фото на диске — сообщение не отправлено.");
    return;
  }

  const withOrderDoneCapEntities = caption_entities && caption_entities.length > 0;
  const sendPhotoOptions = {
    caption,
    reply_markup,
    ...(withOrderDoneCapEntities
      ? { caption_entities }
      : { parse_mode: "HTML" as const }),
  };

  await retrySendPhoto(async () => {
    if (photo.type === "url") {
      await bot.api.sendPhoto(payload.telegramUserId, photo.url, sendPhotoOptions);
    } else {
      const buffer = readFileSync(photo.path);
      await bot.api.sendPhoto(
        payload.telegramUserId,
        new InputFile(buffer, `${Date.now()}_${basename(photo.path)}`),
        sendPhotoOptions,
      );
    }
  }).catch((e) => {
    console.error("[order-complete] Фото так и не отправилось", e);
    throw e;
  });
}

type NotifyBody = {
  orderId: string;
  orderNumber: string;
  telegramUserId: number;
  orderKind?: OrderNotifyKind;
  game?: string;
  server?: string;
  virtAmountLabel?: string;
  transferMethod?: string;
  bankAccount?: string;
  amountRub?: number;
  promoCode?: string;
};

type WebAppNotifyBody = {
  initData: string;
  orderId: string;
  orderNumber: string;
  orderKind?: OrderNotifyKind;
  game?: string;
  server?: string;
  virtAmountLabel?: string;
  transferMethod?: string;
  bankAccount?: string;
  amountRub?: number;
  promoCode?: string;
};

export function pickVirtOrderDetailsFromRecord(
  r: Record<string, unknown>,
): Pick<
  VirtOrderSuccessPayload,
  | "game"
  | "server"
  | "virtAmountLabel"
  | "transferMethod"
  | "bankAccount"
  | "amountRub"
  | "promoCode"
> {
  const game = typeof r.game === "string" ? r.game : undefined;
  const server = typeof r.server === "string" ? r.server : undefined;
  const virtAmountLabel =
    typeof r.virtAmountLabel === "string" ? r.virtAmountLabel : undefined;
  const transferMethod =
    typeof r.transferMethod === "string" ? r.transferMethod : undefined;
  const bankAccount =
    typeof r.bankAccount === "string" ? r.bankAccount : undefined;
  let amountRub: number | undefined;
  if (typeof r.amountRub === "number" && Number.isFinite(r.amountRub)) {
    amountRub = r.amountRub;
  } else if (typeof r.amountRub === "string" && r.amountRub.trim() !== "") {
    const n = parseRublesAmountFromUserText(r.amountRub);
    if (n !== null) {
      amountRub = n;
    }
  }
  const promoCode = typeof r.promoCode === "string" ? r.promoCode : undefined;
  return {
    ...(game !== undefined ? { game } : {}),
    ...(server !== undefined ? { server } : {}),
    ...(virtAmountLabel !== undefined ? { virtAmountLabel } : {}),
    ...(transferMethod !== undefined ? { transferMethod } : {}),
    ...(bankAccount !== undefined ? { bankAccount } : {}),
    ...(amountRub !== undefined ? { amountRub } : {}),
    ...(promoCode !== undefined ? { promoCode } : {}),
  };
}

function parseOrderKind(raw: unknown): OrderNotifyKind | undefined {
  if (raw === "virt" || raw === "account") {
    return raw;
  }
  return undefined;
}

function readJsonBody<T>(req: import("node:http").IncomingMessage): Promise<T> {
  return new Promise((resolvePromise, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        const data = JSON.parse(raw) as T;
        resolvePromise(data);
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function getClientIp(req: import("node:http").IncomingMessage): string {
  const ff = req.headers["x-forwarded-for"];
  if (typeof ff === "string" && ff.length > 0) {
    return ff.split(",")[0]!.trim();
  }
  const ri = req.headers["x-real-ip"];
  if (typeof ri === "string") {
    return ri.trim();
  }
  return req.socket?.remoteAddress ?? "";
}

function amountsMatchFreekassa(expected: string, got: string): boolean {
  const a = parseFloat(String(expected).replace(",", "."));
  const b = parseFloat(String(got).replace(",", "."));
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return false;
  }
  return Math.abs(a - b) < 0.01;
}

type PaymentPrepareJson = {
  initData: string;
  orderKind: "virt" | "account";
  method: "sbp" | "mir" | "card_rub";
  amountRub: number;
  game?: string;
  server?: string;
  bankAccount?: string;
  virtAmountLabel?: string;
  transferMethod?: string;
  promoCode?: string;
  accountMode?: string;
  accountOptionLabel?: string;
};

function fkMethodId(m: PaymentPrepareJson["method"]): number {
  return resolveFreeKassaMethodId(m);
}

/** GET query + x-www-form-urlencoded body */
async function collectFreeKassaFormFields(
  req: import("node:http").IncomingMessage,
  rawUrl: string,
): Promise<Record<string, string>> {
  const u = new URL(rawUrl, "http://x");
  const o: Record<string, string> = {};
  u.searchParams.forEach((v, k) => {
    o[k] = v;
  });
  if (req.method === "POST") {
    const body = await readRequestBodyString(req);
    if (body.length > 0) {
      Object.assign(o, parseFreeKassaFormBody(body));
    }
  }
  return o;
}

const corsNotifyHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/**
 * HTTP-сервер уведомлений:
 * - POST /notify/virt-order-webapp — тело { initData, orderId, orderNumber, orderKind?: "virt"|"account" }; подпись initData по TELEGRAM_BOT_TOKEN.
 * - POST /notify/sell-virt-webapp — тело { initData }; кнопка «Продать» в мини-аппе → сообщение в личку бота без переходов.
 * - POST /notify/virt-order-success — Authorization: Bearer ORDER_NOTIFY_SECRET (бэкенд на том же хосте).
 */
export function startOrderNotifyHttpServer(
  bot: Bot,
  miniAppUrl: string,
): void {
  const secret = process.env.ORDER_NOTIFY_SECRET?.trim();
  const port = Number(process.env.ORDER_NOTIFY_HTTP_PORT || "8788");
  const bind = process.env.ORDER_NOTIFY_HTTP_BIND?.trim() || "127.0.0.1";
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();

  if (!botToken) {
    console.warn(
      "TELEGRAM_BOT_TOKEN не задан — /notify/virt-order-webapp недоступен.",
    );
  }

  if (!secret) {
    console.warn(
      "ORDER_NOTIFY_SECRET не задан — POST /notify/virt-order-success (Bearer) отключён.",
    );
  }

  let cachedBotUsername: string | null = null;
  let botUsernameResolvePromise: Promise<string> | null = null;

  async function resolveReferralBotUsername(): Promise<string> {
    if (cachedBotUsername) {
      return cachedBotUsername;
    }

    const fromEnvRaw =
      process.env.TELEGRAM_BOT_USERNAME?.trim() ||
      process.env.VITE_BOT_ADDRESS?.trim();
    const fromEnv = fromEnvRaw?.replace(/^@/, "");
    if (fromEnv) {
      cachedBotUsername = fromEnv;
      return fromEnv;
    }

    if (!botUsernameResolvePromise) {
      botUsernameResolvePromise = bot.api
        .getMe()
        .then((me) => {
          const username = me.username?.trim().replace(/^@/, "") || "";
          if (!username) {
            throw new Error("Bot username is empty in getMe()");
          }
          cachedBotUsername = username;
          return username;
        })
        .catch((e) => {
          console.error("[referral] failed to resolve bot username:", e);
          return "MiniAppArtyom130609_BOT";
        })
        .finally(() => {
          botUsernameResolvePromise = null;
        });
    }

    return botUsernameResolvePromise;
  }

  const server = createServer(async (req, res) => {
    const url = req.url?.split("?")[0] ?? "";

    if (req.method === "GET" && url === "/api/promo-codes") {
      try {
        const codes = getAllPromoCodes();
        res.writeHead(200, { "Content-Type": "application/json", ...corsNotifyHeaders });
        res.end(JSON.stringify(codes));
      } catch (e) {
        console.error("[promo-codes] /api/promo-codes GET error:", e);
        res.writeHead(500, corsNotifyHeaders).end("error");
      }
      return;
    }

    if (req.method === "POST" && url === "/notify/payment/prepare") {
      if (!botToken) {
        res.writeHead(503, corsNotifyHeaders).end(JSON.stringify({ error: "no bot token" }));
        return;
      }
      const merchantId = process.env.FREEKASSA_MERCHANT_ID?.trim() || "68224";
      const secret1 = process.env.FREEKASSA_SECRET1?.trim() || process.env.FREEKASSA_SECRET?.trim();
      if (!secret1) {
        console.warn("[payment] FREEKASSA_SECRET1 не задан");
        res.writeHead(503, {
          "Content-Type": "application/json",
          ...corsNotifyHeaders,
        });
        res.end(JSON.stringify({ error: "freekassa not configured" }));
        return;
      }
      try {
        const body = await readJsonBody<PaymentPrepareJson>(req);
        if (typeof body.initData !== "string" || !body.initData.length) {
          res.writeHead(400, { "Content-Type": "application/json", ...corsNotifyHeaders });
          res.end(JSON.stringify({ error: "initData" }));
          return;
        }
        if (body.orderKind !== "virt" && body.orderKind !== "account") {
          res.writeHead(400, { "Content-Type": "application/json", ...corsNotifyHeaders });
          res.end(JSON.stringify({ error: "orderKind" }));
          return;
        }
        if (body.method !== "sbp" && body.method !== "mir" && body.method !== "card_rub") {
          res.writeHead(400, { "Content-Type": "application/json", ...corsNotifyHeaders });
          res.end(JSON.stringify({ error: "method" }));
          return;
        }
        const amountNum = Number(body.amountRub);
        if (!Number.isFinite(amountNum) || amountNum <= 0) {
          res.writeHead(400, { "Content-Type": "application/json", ...corsNotifyHeaders });
          res.end(JSON.stringify({ error: "amount" }));
          return;
        }
        const telegramUserId = getTelegramUserIdFromWebAppInitData(body.initData, botToken);
        if (telegramUserId === null) {
          res.writeHead(401, { "Content-Type": "application/json", ...corsNotifyHeaders });
          res.end(JSON.stringify({ error: "bad initData" }));
          return;
        }
        const orderId = `o-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        const suffix = Date.now().toString(36).toUpperCase().slice(-6);
        const orderNumber = `#${suffix}`;
        const merchantOrderId = buildMerchantOrderId();
        const oa = formatAmountForFk(amountNum);
        const sign = signPaymentForm(merchantId, oa, secret1, "RUB", merchantOrderId);
        const i = fkMethodId(body.method);
        const apiKey = process.env.FREEKASSA_API_KEY?.trim();
        const secret2 = process.env.FREEKASSA_SECRET2?.trim() || process.env.FREEKASSA_SECRET?.trim();
        const clientIp = getClientIp(req).trim() || "0.0.0.0";
        /** Домен example.com зарезервирован (RFC), подходит как технический email для FK. */
        const payerEmail = `tg${telegramUserId}@example.com`;
        const orderTelOptional = process.env.FREEKASSA_ORDER_TEL?.trim();

        /** Карта RUB / СБП в кабинете FK — только API; GET pay.fk.money с i= даёт страницу «только по API». */
        const needsFkApi = body.method === "card_rub" || body.method === "sbp";

        let payUrl: string;
        if (needsFkApi && !apiKey) {
          res.writeHead(503, { "Content-Type": "application/json", ...corsNotifyHeaders });
          res.end(
            JSON.stringify({
              error: "freekassa api key required",
              detail:
                "Укажите FREEKASSA_API_KEY в окружении бота (systemd EnvironmentFile → bot/.env) и перезапустите сервис. Без API ключа СБП/карта не создают ссылку.",
            }),
          );
          return;
        }

        if (apiKey) {
          const shopIdNum = Number.parseInt(merchantId, 10);
          if (!Number.isFinite(shopIdNum) || shopIdNum <= 0) {
            res.writeHead(500, { "Content-Type": "application/json", ...corsNotifyHeaders });
            res.end(JSON.stringify({ error: "freekassa merchant id" }));
            return;
          }
          if (!secret2) {
            console.warn("[payment] задан FREEKASSA_API_KEY, но нет FREEKASSA_SECRET2 (нужен для @boarteam/freekassa-sdk)");
            res.writeHead(503, { "Content-Type": "application/json", ...corsNotifyHeaders });
            res.end(JSON.stringify({ error: "freekassa secret2" }));
            return;
          }
          try {
            const fk = new Freekassa({
              key: apiKey,
              secretWord1: secret1,
              secretWord2: secret2,
              shopId: shopIdNum,
              lang: "ru",
              currency: "RUB",
              payUrl: "https://pay.fk.money/",
              apiUrl: "https://api.fk.life/v1/",
            });
            const orderDto: {
              methodId: number;
              email: string;
              ip: string;
              amount: number;
              paymentId: string;
              currency: "RUB";
              phone?: string;
            } = {
              methodId: i,
              email: payerEmail,
              ip: clientIp,
              amount: amountNum,
              paymentId: merchantOrderId,
              currency: "RUB",
            };
            if (orderTelOptional) {
              orderDto.phone = orderTelOptional;
            }
            const orderRes = await fk.createOrder(orderDto);
            if (orderRes.type !== "success" || !orderRes.location?.trim()) {
              const detail = JSON.stringify(orderRes).slice(0, 900);
              console.error("[payment] FK createOrder ответ", detail);
              res.writeHead(502, { "Content-Type": "application/json", ...corsNotifyHeaders });
              res.end(JSON.stringify({ error: "freekassa api", detail }));
              return;
            }
            payUrl = orderRes.location.trim();
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            const ext = e as Error & { body?: string };
            const logBody = typeof ext.body === "string" ? ext.body : "";
            const detail = [msg, logBody].filter(Boolean).join(" | ").slice(0, 1200);
            console.error("[payment] FK createOrder", detail);
            res.writeHead(502, { "Content-Type": "application/json", ...corsNotifyHeaders });
            res.end(JSON.stringify({ error: "freekassa api", detail }));
            return;
          }
        } else {
          payUrl = buildPaymentUrl({
            m: merchantId,
            oa,
            o: merchantOrderId,
            currency: "RUB",
            s: sign,
            i,
          });
        }
        const kind = parseOrderKind(body.orderKind) ?? "virt";
        const transfer =
          body.transferMethod?.trim() ||
          (kind === "account" && body.accountOptionLabel
            ? `Аккаунт: ${body.accountMode ?? ""} ${body.accountOptionLabel}`.trim()
            : "Оплата FreeKassa");
        const payload: PendingPaymentOrder = {
          amountExpected: oa,
          sent: false,
          telegramUserId,
          orderId,
          orderNumber,
          orderKind: kind,
          game: body.game,
          server: body.server,
          bankAccount: body.bankAccount,
          amountRub: amountNum,
          virtAmountLabel: body.virtAmountLabel,
          transferMethod: transfer,
          promoCode: body.promoCode?.trim() || undefined,
        };
        putPendingPayment(merchantOrderId, payload);
        res.writeHead(200, { "Content-Type": "application/json", ...corsNotifyHeaders });
        res.end(
          JSON.stringify({
            payUrl,
            merchantOrderId,
            orderId,
            orderNumber,
          }),
        );
      } catch (e) {
        console.error("[payment] /notify/payment/prepare", e);
        res.writeHead(500, { "Content-Type": "application/json", ...corsNotifyHeaders });
        res.end(JSON.stringify({ error: "server" }));
      }
      return;
    }

    if ((req.method === "GET" || req.method === "POST") && url === "/notify/freekassa") {
      const secret2 = process.env.FREEKASSA_SECRET2?.trim() || process.env.FREEKASSA_SECRET?.trim();
      if (!secret2) {
        res.writeHead(503, corsNotifyHeaders).end("no secret2");
        return;
      }
      const ip = getClientIp(req);
      const ipOk =
        process.env.FREEKASSA_SKIP_IP_CHECK === "1" || isFreeKassaNotifyIp(ip);
      if (!ipOk) {
        console.warn("[freekassa] IP не в списке:", ip);
        res.writeHead(403, corsNotifyHeaders).end("forbidden");
        return;
      }
      try {
        const fields = await collectFreeKassaFormFields(req, req.url ?? "/");
        const amount = fields.AMOUNT ?? "";
        const mId = fields.MERCHANT_ID ?? "";
        const mOrder = fields.MERCHANT_ORDER_ID ?? "";
        const sign = fields.SIGN ?? "";
        const intid = fields.intid ?? "";
        if (!mOrder) {
          res.writeHead(400, corsNotifyHeaders).end("no order");
          return;
        }
        const mySign = signNotification(mId, amount, secret2, mOrder);
        if (sign.toLowerCase() !== mySign.toLowerCase()) {
          console.warn("[freekassa] неверная подпись", mOrder);
          res.writeHead(400, corsNotifyHeaders).end("sign");
          return;
        }
        if (intid && isIntidProcessed(intid)) {
          res.writeHead(200, { "Content-Type": "text/plain" }).end("YES");
          return;
        }
        const pending = getPendingPayment(mOrder);
        if (!pending) {
          console.warn("[freekassa] нет pending", mOrder);
          res.writeHead(200, { "Content-Type": "text/plain" }).end("YES");
          return;
        }
        if (pending.sent) {
          if (intid) {
            markIntidProcessed(intid);
          }
          res.writeHead(200, { "Content-Type": "text/plain" }).end("YES");
          return;
        }
        if (!amountsMatchFreekassa(pending.amountExpected, amount)) {
          console.warn(
            "[freekassa] сумма не совпала",
            mOrder,
            pending.amountExpected,
            amount,
          );
          res.writeHead(200, { "Content-Type": "text/plain" }).end("NO");
          return;
        }
        if (intid) {
          markIntidProcessed(intid);
        }
        if (pending.promoCode) {
          consumePromoCode(pending.promoCode);
        }
        const ok = parseOrderKind(pending.orderKind) ?? "virt";
        await sendVirtOrderSuccess(bot, miniAppUrl, {
          telegramUserId: pending.telegramUserId,
          orderId: pending.orderId,
          orderNumber: pending.orderNumber,
          orderKind: ok,
          game: pending.game,
          server: pending.server,
          bankAccount: pending.bankAccount,
          amountRub: pending.amountRub,
          virtAmountLabel: pending.virtAmountLabel,
          transferMethod: pending.transferMethod,
          promoCode: pending.promoCode,
        });
        markPendingSent(mOrder);
        res.writeHead(200, { "Content-Type": "text/plain" }).end("YES");
      } catch (e) {
        console.error("[freekassa] handler", e);
        res.writeHead(500, corsNotifyHeaders).end("error");
      }
      return;
    }

    if (
      req.method === "OPTIONS" &&
      (url === "/notify/virt-order-webapp" ||
        url === "/notify/sell-virt-webapp" ||
        url === "/notify/virt-order-success" ||
        url === "/notify/payment/prepare" ||
        url === "/notify/freekassa" ||
        url === "/notify/referral" ||
        url === "/api/promo-codes")
    ) {
      res.writeHead(204, corsNotifyHeaders).end();
      return;
    }

    if (req.method === "POST" && url === "/notify/virt-order-webapp") {
      if (!botToken) {
        res.writeHead(503, corsNotifyHeaders).end("no bot token");
        return;
      }
      try {
        const body = await readJsonBody<WebAppNotifyBody>(req);
        if (
          typeof body.initData !== "string" ||
          typeof body.orderId !== "string" ||
          typeof body.orderNumber !== "string"
        ) {
          res.writeHead(400, corsNotifyHeaders).end("bad body");
          return;
        }
        const orderKind = parseOrderKind(body.orderKind);
        const telegramUserId = getTelegramUserIdFromWebAppInitData(
          body.initData,
          botToken,
        );
        if (telegramUserId === null) {
          console.warn("[virt-order] /notify/virt-order-webapp: initData невалиден");
          res.writeHead(401, corsNotifyHeaders).end("bad initData");
          return;
        }
        const details = pickVirtOrderDetailsFromRecord(
          body as unknown as Record<string, unknown>,
        );
        console.info("[virt-order] HTTP /notify/virt-order-webapp", {
          telegramUserId,
          orderNumber: body.orderNumber,
          orderId: body.orderId,
          ...details,
        });
        if (body.promoCode) {
          consumePromoCode(body.promoCode);
        }
        await sendVirtOrderSuccess(bot, miniAppUrl, {
          telegramUserId,
          orderId: body.orderId,
          orderNumber: body.orderNumber,
          ...(orderKind ? { orderKind } : {}),
          ...details,
        });
        res.writeHead(200, {
          "Content-Type": "application/json",
          ...corsNotifyHeaders,
        });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        console.error("[virt-order] /notify/virt-order-webapp:", e);
        res.writeHead(500, corsNotifyHeaders).end("error");
      }
      return;
    }


    if (req.method === "POST" && url === "/notify/sell-virt-webapp") {
      if (!botToken) {
        res.writeHead(503, corsNotifyHeaders).end("no bot token");
        return;
      }
      try {
        const body = await readJsonBody<{ initData: string; action?: string }>(req);
        if (typeof body.initData !== "string") {
          res.writeHead(400, corsNotifyHeaders).end("bad body");
          return;
        }
        const telegramUserId = getTelegramUserIdFromWebAppInitData(
          body.initData,
          botToken,
        );
        if (telegramUserId === null) {
          console.warn("[sell] /notify/sell-virt-webapp: initData невалиден");
          res.writeHead(401, corsNotifyHeaders).end("bad initData");
          return;
        }

        if (body.action === "get_referral") {
          const refUser = getReferralUser(telegramUserId);
          const botUsername = await resolveReferralBotUsername();
          const refLink = `https://t.me/${botUsername}?start=ref_${telegramUserId}`;

          res.writeHead(200, { "Content-Type": "application/json", ...corsNotifyHeaders });
          res.end(JSON.stringify({ 
            ok: true, 
            balance: refUser.balance, 
            earned: refUser.earned, 
            invitedCount: refUser.invitedCount,
            link: refLink
          }));
          return;
        }

        console.info("[sell] HTTP /notify/sell-virt-webapp", { telegramUserId });
        await sendSellVirtMessage(bot, telegramUserId);
        res.writeHead(200, {
          "Content-Type": "application/json",
          ...corsNotifyHeaders,
        });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        console.error("[sell] /notify/sell-virt-webapp:", e);
        res.writeHead(500, corsNotifyHeaders).end("error");
      }
      return;
    }

    if (req.method === "POST" && url === "/notify/virt-order-success") {
      if (!secret) {
        res.writeHead(503).end("bearer disabled");
        return;
      }
      const auth = req.headers.authorization;
      if (auth !== `Bearer ${secret}`) {
        res.writeHead(401).end("unauthorized");
        return;
      }

      try {
        const body = await readJsonBody<NotifyBody>(req);
        if (
          typeof body.telegramUserId !== "number" ||
          typeof body.orderNumber !== "string" ||
          typeof body.orderId !== "string"
        ) {
          res.writeHead(400).end("bad body");
          return;
        }

        const orderKind = parseOrderKind(body.orderKind);
        const details = pickVirtOrderDetailsFromRecord(
          body as unknown as Record<string, unknown>,
        );
        const payload: VirtOrderSuccessPayload = {
          telegramUserId: body.telegramUserId,
          orderNumber: body.orderNumber,
          orderId: body.orderId,
          ...(orderKind ? { orderKind } : {}),
          ...details,
        };

        console.info("[virt-order] HTTP /notify/virt-order-success", payload);
        await sendVirtOrderSuccess(bot, miniAppUrl, payload);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        console.error("notify/virt-order-success:", e);
        res.writeHead(500).end("error");
      }
      return;
    }

    res.writeHead(404).end();
  });

  server.listen(port, bind, () => {
    if (botToken) {
      console.log(
        `HTTP мини-апп → заказ: POST http://${bind}:${port}/notify/virt-order-webapp (initData + nginx → сюда)`,
      );
      console.log(
        `HTTP мини-апп → продать: POST http://${bind}:${port}/notify/sell-virt-webapp { initData }`,
      );
      console.log(
        `FreeKassa: prepare POST http://${bind}:${port}/notify/payment/prepare (при FREEKASSA_API_KEY — @boarteam/freekassa-sdk createOrder); callback GET|POST /notify/freekassa (URL оповещения в ЛК)`,
      );
    }
    if (secret) {
      console.log(
        `HTTP бэкенд → заказ: POST http://${bind}:${port}/notify/virt-order-success (Bearer)`,
      );
    }
  });
}
