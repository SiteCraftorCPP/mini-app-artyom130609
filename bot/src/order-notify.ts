import { createServer } from "node:http";
import { getReferralUser } from "./referrals-store.js";
import { randomInt, randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

import type { Bot } from "grammy";
import { InputFile } from "grammy";
import { InlineKeyboard } from "grammy";
import { Freekassa } from "@boarteam/freekassa-sdk";

import {
  getTelegramUserIdFromWebAppInitData,
  parseValidatedWebAppUser,
} from "./telegram-webapp-init-data.js";
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
  buildOrderCompletedOtherServiceBuyerCaptionHtml,
  buildSellVirtCaptionHtml,
  buildVirtOrderCaptionHtml,
  getOrderCompletedReviewLineText,
} from "./texts.js";
import { bumpAdminOrderSequence } from "./admin-order-sequence.js";
import {
  addOrUpdateActiveOrder,
  getActiveOrders,
  getAdminOrderByIdFromStore,
  getClosedOrders,
  type AdminOrderRow,
} from "./orders-store.js";
import { findOtherServiceItem } from "./other-services-store.js";
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
import {
  STREAMPAY_DEFAULT_API_BASE,
  streamPayBuildCreatePaymentJson,
  streamPayExtractCallbackFields,
  streamPayIsPaidStatus,
  streamPayParseExtraCreateFieldsJson,
  streamPayPayUrlWithOptionalFiatParam,
  streamPayPostCreate,
  streamPaySanitizeExtraForMerge,
  streamPaySortedQueryString,
  streamPayVerifySignedPayload,
} from "./streampay.js";
import {
  streamPayAutoFiatRatesEnabled,
  streamPayConvertRubToFiatAmount,
} from "./streampay-cbr-rates.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export type OrderNotifyKind = "virt" | "account" | "other_service";

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
  /** Из initData / ctx при создании заказа — для строки покупателя в админке. */
  telegramUsername?: string;
  telegramFirstName?: string;
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

  const stripAtLocal = (s: string) => s.replace(/^@/, "").trim();

  let telegramUsername = "";
  const fromPayloadUser = payload.telegramUsername?.trim()
    ? stripAtLocal(payload.telegramUsername)
    : "";
  const fromPayloadFirst = payload.telegramFirstName?.trim() ?? "";
  if (fromPayloadUser) {
    telegramUsername = fromPayloadUser;
  } else if (fromPayloadFirst) {
    telegramUsername = fromPayloadFirst;
  }

  if (!telegramUsername) {
    try {
      const chat = await bot.api.getChat(payload.telegramUserId);
      if (chat.type === "private" && "username" in chat && chat.username) {
        telegramUsername = stripAtLocal(chat.username);
      } else {
        console.warn(
          "[virt-order] getChat: нет username для",
          payload.telegramUserId,
        );
      }
    } catch (e) {
      console.error("[virt-order] getChat failed for", payload.telegramUserId, e);
    }
  }

  if (!telegramUsername) {
    telegramUsername = "";
  }

  return {
    id,
    publicOrderId,
    categoryLabel:
      kind === "account"
        ? "Аккаунт"
        : kind === "other_service"
          ? "Другие услуги"
          : "Вирты",
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
 * Раздел «Актуальные заказы»; при orderId — сразу карточка заказа.
 */
function buildOrderDetailsKeyboard(miniAppUrl: string, orderId?: string) {
  const base = miniAppUrl.replace(/\/$/, "");
  const q = new URLSearchParams({ open: "currentOrders" });
  const id = orderId?.trim();
  if (id) {
    q.set("orderId", id);
  }
  const url = `${base}/profile?${q.toString()}`;
  return new InlineKeyboard().webApp("Узнать детали", url).success();
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
      reply_markup: buildOrderDetailsKeyboard(miniAppUrl, payload.orderId),
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
    reply_markup: buildOrderDetailsKeyboard(miniAppUrl, payload.orderId),
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

async function notifyBuyerPhotoOrPlainText(
  bot: Bot,
  logPrefix: string,
  chatId: number,
  text: string,
  reply_markup: InlineKeyboard | undefined,
  photo: OrderSuccessPhoto | null,
  caption_entities?: import("@grammyjs/types").MessageEntity[],
): Promise<void> {
  const withEntities = caption_entities && caption_entities.length > 0;
  const sendPlain = async (reason: string) => {
    console.warn(`[${logPrefix}] отправка текста без фото (${reason})`);
    if (withEntities) {
      await bot.api.sendMessage(chatId, text, {
        entities: caption_entities,
        ...(reply_markup ? { reply_markup } : {}),
        link_preview_options: { is_disabled: true },
      });
    } else {
      await bot.api.sendMessage(chatId, text, {
        parse_mode: "HTML",
        ...(reply_markup ? { reply_markup } : {}),
        link_preview_options: { is_disabled: true },
      });
    }
  };

  if (!photo) {
    await sendPlain("нет изображения");
    return;
  }

  const sendPhotoOpts = {
    caption: text,
    ...(reply_markup ? { reply_markup } : {}),
    ...(withEntities
      ? { caption_entities: caption_entities! }
      : { parse_mode: "HTML" as const }),
  };

  try {
    await retrySendPhoto(async () => {
      if (photo.type === "url") {
        await bot.api.sendPhoto(chatId, photo.url, sendPhotoOpts);
      } else {
        const buffer = readFileSync(photo.path);
        await bot.api.sendPhoto(
          chatId,
          new InputFile(buffer, `${Date.now()}_${basename(photo.path)}`),
          sendPhotoOpts,
        );
      }
    });
  } catch (e) {
    console.error(`[${logPrefix}] sendPhoto не удался после повторов`, e);
    await sendPlain("sendPhoto failed");
  }
}

/** DTO для мини-аппа «Аккаунт» — совпадает с `AccountOrderMock` во фронте. */
function adminRowToMiniappOrderJson(row: AdminOrderRow): Record<string, unknown> {
  const pid = (row.publicOrderId || row.id || "").trim();
  const num = pid.startsWith("#") ? pid : pid ? `#${pid}` : `#${row.id}`;
  const parts = row.openedAtLine?.trim().split(/\s+/) ?? [];
  const title = parts[0] ?? "—";
  const time = parts.slice(1).join(" ") || "—";
  let completedAt = "";
  if (row.closedAtLine?.trim()) {
    completedAt = row.closedAtLine.split(" · ")[0]?.trim() ?? row.closedAtLine;
  }
  return {
    id: row.id,
    publicOrderId: row.publicOrderId,
    number: num,
    categoryLabel: row.categoryLabel,
    telegramUsername: row.telegramUsername,
    telegramUserId: row.telegramUserId,
    game: row.game || "—",
    server: row.server || "—",
    virtAmountLabel: row.virtAmountLabel,
    transferMethod: row.transferMethod,
    bankAccount: row.bankAccount,
    accountNumber: row.bankAccount || row.virtAmountLabel || "—",
    amountRub: row.amountRub,
    openedAtLine: row.openedAtLine,
    closedAtLine: row.closedAtLine,
    title,
    time,
    paidAt: time,
    completedAt,
    promoCode: row.promoCode ?? "",
    price: 0,
    logo: "",
  };
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
    console.warn(
      "[admin-notify] TELEGRAM_ADMIN_ID / TELEGRAM_ADMIN_IDS не заданы — админы не получат уведомление о новом заказе.",
    );
    return;
  }
  const seq = bumpAdminOrderSequence();
  const kind =
    payload.orderKind === "account"
      ? "покупка аккаунта"
      : payload.orderKind === "other_service"
        ? "другие услуги"
        : "покупка виртов";
  const lines: string[] = [
    `🆕 Новый заказ #${seq}`,
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
    lines.push(
      payload.orderKind === "other_service"
        ? `Услуга: ${payload.virtAmountLabel}`
        : `Вирты: ${payload.virtAmountLabel}`,
    );
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
  options?: { skipAdminBroadcast?: boolean },
): Promise<void> {
  console.info("[virt-order] sendVirtOrderSuccess", {
    telegramUserId: payload.telegramUserId,
    orderNumber: payload.orderNumber,
    orderId: payload.orderId,
    orderKind: payload.orderKind ?? "virt",
  });
  if (!options?.skipAdminBroadcast) {
    try {
      await notifyAdminsNewOrder(bot, payload);
    } catch (e) {
      console.error("[virt-order] notifyAdminsNewOrder:", e);
    }
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

  try {
    await notifyBuyerPhotoOrPlainText(
      bot,
      "virt-order",
      payload.telegramUserId,
      caption,
      reply_markup,
      photo,
      caption_entities,
    );
  } catch (e) {
    console.error("[virt-order] не удалось доставить уведомление покупателю:", e);
  }

  try {
    const row = await buildActiveOrderRow(bot, payload);
    addOrUpdateActiveOrder(row);
  } catch (e) {
    console.error("[virt-order] addOrUpdateActiveOrder:", e);
  }
}

/**
 * «Другие услуги» · ручная выдача: после оплаты — то же фото/текст/кнопка, что у заказа аккаунта (мини-апп).
 * Без повторного уведомления админам и без записи в активные заказы (уже сделано при webhook).
 */
export async function sendOtherServiceManualOrderPlaced(
  bot: Bot,
  miniAppUrl: string,
  payload: { telegramUserId: number; orderId: string; orderNumber: string },
): Promise<void> {
  const orderKind: OrderKindForSuccessParts = "account";
  const parts = getOrderSuccessThreeEmojisTextParts(payload.orderNumber, orderKind);
  const ids = getOrderSuccessStickerIdsFromEnv();
  const withEntities = await buildOrderSuccessThreeEmojisCaption(bot.api, ids, parts);

  let caption: string;
  let caption_entities: import("@grammyjs/types").MessageEntity[] | undefined;

  if (withEntities) {
    caption = withEntities.text;
    caption_entities = captionEntitiesAllBoldExcludingCustomEmoji(
      withEntities.text,
      withEntities.entities,
    );
  } else {
    caption = buildAccountAppOrderCaptionHtml(payload.orderNumber);
  }

  const reply_markup = buildOrderDetailsKeyboard(miniAppUrl, payload.orderId);
  const photo = resolveOrderSuccessPhoto();

  await notifyBuyerPhotoOrPlainText(
    bot,
    "other-service",
    payload.telegramUserId,
    caption,
    reply_markup,
    photo,
    caption_entities,
  );
}

const COMPLETED_ORDER_REVIEW_PHOTO_NAMES = [
  "photo_3.jpg",
  "photo_3.png",
  "photo_3.jpeg",
  "photo_3.webp",
] as const;

export type CompletedOrderPhotoDiag = {
  runtimeDirname: string;
  botRoot: string;
  repoRoot: string;
  cwd: string;
  installRoots: string[];
  env_ORDER_COMPLETED_REVIEW_PHOTO_URL: string | undefined;
  env_ORDER_COMPLETED_REVIEW_IMAGE_PATH: string | undefined;
  env_ORDER_COMPLETED_REVIEW_PHOTO_PATH: string | undefined;
  candidates: string[];
  firstExistingPath: string | null;
  urlFallback: string | null;
};

/** Те же кандидаты, что `resolveCompletedOrderReviewPhoto`, для проверки на сервере. */
export function diagnoseCompletedOrderReviewPhoto(): CompletedOrderPhotoDiag {
  const runtimeDirname = __dirname;
  const botRoot = resolve(__dirname, "..");
  const repoRoot = resolve(__dirname, "../..");
  const installRoots = orderPhotoInstallRoots();
  const fileCandidates: string[] = [];
  const push = (p: string | null | undefined) => {
    if (p && !fileCandidates.includes(p)) {
      fileCandidates.push(p);
    }
  };

  const orderUrl = process.env.ORDER_COMPLETED_REVIEW_PHOTO_URL?.trim();
  const urlFallback =
    orderUrl && /^https?:\/\//i.test(orderUrl) ? orderUrl : null;

  const fromEnv = (
    process.env.ORDER_COMPLETED_REVIEW_IMAGE_PATH ||
    process.env.ORDER_COMPLETED_REVIEW_PHOTO_PATH
  )?.trim();
  if (fromEnv) {
    const p = fromEnv.startsWith("/") ? fromEnv : resolve(botRoot, fromEnv);
    push(p);
    push(resolve(repoRoot, "images", basename(p)));
  }
  for (const root of installRoots) {
    for (const name of COMPLETED_ORDER_REVIEW_PHOTO_NAMES) {
      push(resolve(root, "images", name));
    }
  }
  for (const name of COMPLETED_ORDER_REVIEW_PHOTO_NAMES) {
    push(resolve(repoRoot, "images", name));
  }

  const firstExistingPath =
    fileCandidates.find((p) => existsSync(p)) ?? null;

  return {
    runtimeDirname,
    botRoot,
    repoRoot,
    cwd: process.cwd(),
    installRoots,
    env_ORDER_COMPLETED_REVIEW_PHOTO_URL: process.env.ORDER_COMPLETED_REVIEW_PHOTO_URL,
    env_ORDER_COMPLETED_REVIEW_IMAGE_PATH:
      process.env.ORDER_COMPLETED_REVIEW_IMAGE_PATH,
    env_ORDER_COMPLETED_REVIEW_PHOTO_PATH:
      process.env.ORDER_COMPLETED_REVIEW_PHOTO_PATH,
    candidates: fileCandidates,
    firstExistingPath,
    urlFallback,
  };
}

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
    "[order-complete] нет images/photo_3.* — покупателю уйдёт только текст. Задайте ORDER_COMPLETED_REVIEW_PHOTO_URL или положите photo_3.* в images/.",
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
  payload: {
    telegramUserId: number;
    orderNumber: string;
    isAccount?: boolean;
    accountData?: string;
    /** «Другие услуги»: текст выдачи без префикса «Данные для входа в аккаунт» */
    otherServiceBody?: string;
  },
): Promise<void> {
  const ref = formatCompletedOrderRef(payload.orderNumber);
  const line1 = `Заказ ${ref} успешно выполнен!`;
  const line3 = getOrderCompletedReviewLineText();
  const ids = getOrderCompletedStickerIdsFromEnv();
  const otherBody = payload.otherServiceBody?.trim();
  const useAccountLayout = Boolean(payload.isAccount && payload.accountData?.trim());

  const withEm = otherBody
    ? await buildOrderCompletedThreeEmojisCaption(bot.api, ids, {
        kind: "other_service",
        line1,
        bodyText: otherBody,
        line3,
      })
    : useAccountLayout
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
    caption = otherBody
      ? buildOrderCompletedOtherServiceBuyerCaptionHtml(payload.orderNumber, otherBody)
      : buildOrderCompletedBuyerCaptionHtml(
          payload.orderNumber,
          payload.isAccount,
          payload.accountData,
        );
  }

  const reply_markup = new InlineKeyboard().url(BTN_WRITE_REVIEW, REVIEW_POST_URL);

  const photo = resolveCompletedOrderReviewPhoto();
  const withOrderDoneCapEntities = caption_entities && caption_entities.length > 0;

  try {
    await notifyBuyerPhotoOrPlainText(
      bot,
      "order-complete",
      payload.telegramUserId,
      caption,
      reply_markup,
      photo,
      withOrderDoneCapEntities ? caption_entities : undefined,
    );
  } catch (e) {
    console.error("[order-complete] не удалось уведомить покупателя:", e);
    throw e;
  }
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
  if (raw === "virt" || raw === "account" || raw === "other_service") {
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

function readRequestBodyBuffer(req: import("node:http").IncomingMessage): Promise<Buffer> {
  return new Promise((resolvePromise, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => {
      chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
    });
    req.on("end", () => {
      resolvePromise(Buffer.concat(chunks));
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

/**
 * Сколько единиц system_currency («системной валюты» счёта, напр. USDT) на 1 ₽ заказа.
 * Мини-апп шлёт amountRub. Пусто — amount в API = amountRub (как число).
 * Алиас для ясности: STREAMPAY_ORDER_RUB_TO_INVOICE_RATE (если задан — он приоритетнее UAH_*).
 */
function streamPayInvoiceUnitsPerRubFromEnv(): number | null {
  const raw =
    process.env.STREAMPAY_ORDER_RUB_TO_INVOICE_RATE?.trim() ||
    process.env.STREAMPAY_UAH_PER_RUB?.trim();
  if (!raw) {
    return null;
  }
  const n = Number(raw.replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }
  return n;
}

/** Подпись в заказе / лог: какая кнопка в мини-аппе (API всегда по ЛК: USDT + payment_type из env). */
const STREAMPAY_UI_PRESET_LABEL: Record<string, string> = {
  tenge: "KZT",
  uah: "UAH",
  byn: "BYN",
  azn: "AZN",
};

/**
 * USDT + type 2: StreamPay часто отклоняет дробные суммы (406 amount_is_invalid).
 * По умолчанию — округление вверх до следующего целого USDT (1.33 → 2), без искусственного «минимума 5».
 * Дробная сумма как у ЦБ: STREAMPAY_INVOICE_USDT_ALLOW_FRACTION=1
 * Жёсткий минимум счёта: только STREAMPAY_MIN_INVOICE_USDT=…
 */
function streamPayNormalizeUsdtInvoiceAmount(
  paymentType: number,
  systemCurrencyRaw: string,
  amount: number,
  source: string,
): { amount: number; source: string } {
  if (paymentType !== 2 || !Number.isFinite(amount) || amount <= 0) {
    return { amount, source };
  }
  const sys = systemCurrencyRaw.replace(/^\ufeff/, "").trim().toUpperCase();
  if (!sys.includes("USDT")) {
    return { amount, source };
  }
  let a = Math.round(amount * 100) / 100;
  let src = source;
  const allowFraction =
    process.env.STREAMPAY_INVOICE_USDT_ALLOW_FRACTION === "1" ||
    process.env.STREAMPAY_INVOICE_USDT_ALLOW_FRACTION === "true";
  if (!allowFraction) {
    const ceiled = Math.max(1, Math.ceil(a - 1e-12));
    if (ceiled !== a) {
      a = ceiled;
      src = `${src}+usdt_ceil_int`;
    }
  }
  const minRaw = process.env.STREAMPAY_MIN_INVOICE_USDT?.trim().toLowerCase();
  if (
    !minRaw ||
    minRaw === "" ||
    minRaw === "0" ||
    minRaw === "off" ||
    minRaw === "false"
  ) {
    return { amount: a, source: src };
  }
  const minUsdt = Number(String(process.env.STREAMPAY_MIN_INVOICE_USDT).replace(",", "."));
  if (!Number.isFinite(minUsdt) || minUsdt <= 0) {
    return { amount: a, source: src };
  }
  if (a < minUsdt) {
    console.warn(
      `[streampay] amount ${a} USDT поднят до минимума ${minUsdt} (STREAMPAY_MIN_INVOICE_USDT)`,
    );
    return { amount: minUsdt, source: `${src}+min_${minUsdt}_usdt` };
  }
  return { amount: a, source: src };
}

/** BOM/пробелы/кавычки в .env (частая причина «invalid_system_currency» при видимом USD). */
function streamPayNormalizeToken(raw: string): string {
  let s = raw.replace(/^\ufeff/, "").trim();
  if (
    (s.startsWith('"') && s.endsWith('"') && s.length >= 2) ||
    (s.startsWith("'") && s.endsWith("'") && s.length >= 2)
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

function streamPayPickStr(
  envName: string,
  extraKey: string,
  extra: Record<string, unknown> | null,
): string {
  const eRaw = process.env[envName];
  if (eRaw !== undefined && String(eRaw).trim() !== "") {
    return streamPayNormalizeToken(String(eRaw));
  }
  if (!extra) {
    return "";
  }
  const v = extra[extraKey];
  if (v == null) {
    return "";
  }
  return streamPayNormalizeToken(String(v));
}

function streamPayPickPaymentType(extra: Record<string, unknown> | null): number | null {
  const eRaw = process.env.STREAMPAY_PAYMENT_TYPE;
  if (eRaw !== undefined && String(eRaw).trim() !== "") {
    const n = Number(streamPayNormalizeToken(String(eRaw)));
    return Number.isFinite(n) ? n : null;
  }
  if (!extra || extra.payment_type === undefined || extra.payment_type === null) {
    return null;
  }
  const x = extra.payment_type;
  const n = typeof x === "number" ? x : Number(String(x).trim());
  return Number.isFinite(n) ? n : null;
}

type PaymentPrepareJson = {
  initData: string;
  orderKind: "virt" | "account" | "other_service";
  method: "sbp" | "mir" | "card_rub" | "streampay";
  amountRub: number;
  /** Фиксированная фиатная ветка StreamPay (см. кнопки в мини-аппе). */
  streampayPreset?: "tenge" | "uah" | "byn" | "azn";
  game?: string;
  server?: string;
  bankAccount?: string;
  virtAmountLabel?: string;
  transferMethod?: string;
  promoCode?: string;
  accountMode?: string;
  accountOptionLabel?: string;
  /** Заказ услуги из каталога «Другие услуги» */
  otherService?: {
    itemId: string;
    gameId: string;
    /** Пустая строка / отсутствует — позиция на уровне раздела */
    mainId?: string | null;
    mode: "auto" | "manual";
  };
};

function fkMethodId(m: "sbp" | "mir" | "card_rub"): number {
  return resolveFreeKassaMethodId(m);
}

/** Тело prepare без поля method */
export type PaymentPrepareBodyBase = Omit<PaymentPrepareJson, "method">;

type BuildPendingFail = { ok: false; status: number; error: string };
type BuildPendingOk = {
  ok: true;
  payload: PendingPaymentOrder;
  amountNum: number;
};
type BuildPendingResult = BuildPendingOk | BuildPendingFail;

/**
 * Общая сборка pending-заказа для оплаты (FK или KZT с чеком).
 * Не создаёт merchant id и не вызывает FreeKassa.
 */
export function buildPendingPayloadForPaymentBody(
  body: PaymentPrepareBodyBase,
  botToken: string,
): BuildPendingResult {
  if (typeof body.initData !== "string" || !body.initData.length) {
    return { ok: false, status: 400, error: "initData" };
  }
  if (
    body.orderKind !== "virt" &&
    body.orderKind !== "account" &&
    body.orderKind !== "other_service"
  ) {
    return { ok: false, status: 400, error: "orderKind" };
  }
  const amountNum = Number(body.amountRub);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return { ok: false, status: 400, error: "amount" };
  }
  const webUser = parseValidatedWebAppUser(body.initData, botToken);
  if (!webUser) {
    return { ok: false, status: 401, error: "bad initData" };
  }
  const telegramUserId = webUser.id;
  const pendingTgUsername = webUser.username ?? undefined;
  const pendingTgFirst = webUser.firstName ?? undefined;
  const orderId = `o-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const suffix = Date.now().toString(36).toUpperCase().slice(-6);
  const orderNumber = `#${suffix}`;
  const oa = formatAmountForFk(amountNum);

  if (body.orderKind === "other_service") {
    const osIn = body.otherService;
    if (
      !osIn ||
      typeof osIn.itemId !== "string" ||
      typeof osIn.gameId !== "string" ||
      (osIn.mode !== "auto" && osIn.mode !== "manual")
    ) {
      return { ok: false, status: 400, error: "otherService" };
    }
    const mainIdNorm =
      osIn.mainId === undefined ||
      osIn.mainId === null ||
      String(osIn.mainId).trim() === ""
        ? null
        : String(osIn.mainId).trim();
    const found = findOtherServiceItem(osIn.gameId, mainIdNorm, osIn.itemId);
    if (!found) {
      return { ok: false, status: 404, error: "catalog item" };
    }
    const { item, game, main } = found;
    if (osIn.mode === "auto") {
      if (item.paymentMode !== "auto") {
        return { ok: false, status: 400, error: "mode item" };
      }
      if (!item.deliverText?.trim()) {
        return { ok: false, status: 400, error: "deliver" };
      }
    } else if (item.paymentMode !== "manual") {
      return { ok: false, status: 400, error: "mode item" };
    }
    const expectedRub = item.amountRub;
    if (
      expectedRub == null ||
      !Number.isFinite(expectedRub) ||
      Math.abs(expectedRub - amountNum) > 0.009
    ) {
      return { ok: false, status: 400, error: "amount mismatch" };
    }
    const transferOs =
      osIn.mode === "auto"
        ? "Другие услуги · автовыдача"
        : "Другие услуги · ручная выдача";
    const payload: PendingPaymentOrder = {
      amountExpected: oa,
      sent: false,
      telegramUserId,
      telegramUsername: pendingTgUsername,
      telegramFirstName: pendingTgFirst,
      orderId,
      orderNumber,
      orderKind: "other_service",
      game: game.name,
      server: main?.name ?? "—",
      bankAccount: "",
      amountRub: amountNum,
      virtAmountLabel: item.description.slice(0, 400),
      transferMethod: transferOs,
      otherService: {
        mode: osIn.mode,
        deliverText: item.deliverText,
        itemId: item.id,
        gameId: game.id,
        mainId: main?.id ?? null,
        gameName: game.name,
        mainName: main?.name ?? null,
        cardSummary: item.description.slice(0, 300),
      },
    };
    return { ok: true, payload, amountNum };
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
    telegramUsername: pendingTgUsername,
    telegramFirstName: pendingTgFirst,
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
  return { ok: true, payload, amountNum };
}

/** После подтверждения оплаты (FK webhook или ручное «чек ОК» для KZT). */
export async function deliverPaidPendingOrder(
  bot: Bot,
  miniAppUrl: string,
  pending: PendingPaymentOrder,
  options?: { skipAdminBroadcast?: boolean },
): Promise<void> {
  const skipAdmin = options?.skipAdminBroadcast === true;
  if (pending.promoCode) {
    consumePromoCode(pending.promoCode);
  }
  if (pending.orderKind === "other_service" && pending.otherService) {
    const os = pending.otherService;
    try {
      if (os.mode === "auto") {
        const txt = os.deliverText?.trim() || "Спасибо за оплату!";
        await sendOrderCompletedToBuyer(bot, {
          telegramUserId: pending.telegramUserId,
          orderNumber: pending.orderNumber,
          otherServiceBody: txt,
        });
        if (!skipAdmin) {
          try {
            await notifyAdminsNewOrder(bot, {
              telegramUserId: pending.telegramUserId,
              orderId: pending.orderId,
              orderNumber: pending.orderNumber,
              orderKind: "other_service",
              game: pending.game,
              server: pending.server,
              amountRub: pending.amountRub,
              virtAmountLabel: pending.virtAmountLabel,
              transferMethod: pending.transferMethod ?? "Другие услуги · автовыдача",
              promoCode: pending.promoCode,
            });
          } catch (e) {
            console.error("[order] notifyAdmins other_service auto", e);
          }
        }
      } else {
        let telegramUsername = pending.telegramUsername?.trim() || "";
        if (!telegramUsername) {
          try {
            const chat = await bot.api.getChat(pending.telegramUserId);
            if (chat.type === "private" && "username" in chat && chat.username) {
              telegramUsername = chat.username;
            }
          } catch {
            /* ok */
          }
        }
        if (!telegramUsername && pending.telegramFirstName?.trim()) {
          telegramUsername = pending.telegramFirstName.trim();
        }
        if (!telegramUsername) {
          telegramUsername = "";
        }
        addOrUpdateActiveOrder({
          id: pending.orderId.trim(),
          publicOrderId: formatOrderNumberForCaption(pending.orderNumber),
          categoryLabel: "Другие услуги",
          telegramUsername,
          telegramUserId: String(pending.telegramUserId),
          game: os.gameName,
          server: os.mainName ?? "—",
          virtAmountLabel: os.cardSummary,
          transferMethod: pending.transferMethod ?? "FreeKassa",
          bankAccount: "",
          amountRub: pending.amountRub ?? 0,
          openedAtLine: formatOpenedAtLine(),
        });
        if (!skipAdmin) {
          try {
            await notifyAdminsNewOrder(bot, {
              telegramUserId: pending.telegramUserId,
              orderId: pending.orderId.trim(),
              orderNumber: pending.orderNumber,
              orderKind: "other_service",
              game: pending.game ?? os.gameName,
              server: pending.server ?? os.mainName ?? "—",
              amountRub: pending.amountRub,
              virtAmountLabel: os.cardSummary.slice(0, 400),
              transferMethod: pending.transferMethod ?? "Другие услуги · ручная выдача",
              promoCode: pending.promoCode,
            });
          } catch (e) {
            console.error("[order] notifyAdmins other_service manual", e);
          }
        }
        await sendOtherServiceManualOrderPlaced(bot, miniAppUrl, {
          telegramUserId: pending.telegramUserId,
          orderId: pending.orderId.trim(),
          orderNumber: pending.orderNumber,
        });
      }
    } catch (e) {
      console.error("[order] deliverPaid other_service", e);
    }
    return;
  }
  const ok = parseOrderKind(pending.orderKind);
  if (ok !== "virt" && ok !== "account") {
    return;
  }
  await sendVirtOrderSuccess(
    bot,
    miniAppUrl,
    {
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
      ...(pending.telegramUsername ? { telegramUsername: pending.telegramUsername } : {}),
      ...(pending.telegramFirstName ? { telegramFirstName: pending.telegramFirstName } : {}),
    },
    skipAdmin ? { skipAdminBroadcast: true } : undefined,
  );
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

  /**
   * Реф-ссылка в мини-аппе. Не используем getMe(): токен в .env может быть от «старого» бота,
   * тогда getMe() вернёт неверный username. VITE_* из фронта тоже не читаем — на сервере часто устаревает.
   * Явно: REFERRAL_BOT_USERNAME → TELEGRAM_BOT_USERNAME → artshopvirts_bot.
   */
  function resolveReferralBotHandle(): string {
    const raw =
      process.env.REFERRAL_BOT_USERNAME?.trim() ||
      process.env.TELEGRAM_BOT_USERNAME?.trim();
    const s = (raw || "artshopvirts_bot").replace(/^@/, "").trim();
    return s || "artshopvirts_bot";
  }

  const server = createServer(async (req, res) => {
    const rawPath = req.url?.split("?")[0] ?? "";
    const url =
      rawPath.length > 1 && rawPath.endsWith("/") ? rawPath.slice(0, -1) : rawPath;

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
      try {
        const body = await readJsonBody<PaymentPrepareJson>(req);
        const built = buildPendingPayloadForPaymentBody(body, botToken);
        if (!built.ok) {
          res.writeHead(built.status, { "Content-Type": "application/json", ...corsNotifyHeaders });
          res.end(JSON.stringify({ error: built.error }));
          return;
        }
        const { payload, amountNum } = built;
        const telegramUserId = payload.telegramUserId;

        if (body.method === "streampay") {
          const presetRaw = body.streampayPreset;
          const allowedPreset = new Set(["tenge", "uah", "byn", "azn"]);
          if (presetRaw != null && typeof presetRaw !== "string") {
            res.writeHead(400, { "Content-Type": "application/json", ...corsNotifyHeaders });
            res.end(JSON.stringify({ error: "streampay preset" }));
            return;
          }
          if (presetRaw != null && !allowedPreset.has(presetRaw)) {
            res.writeHead(400, { "Content-Type": "application/json", ...corsNotifyHeaders });
            res.end(JSON.stringify({ error: "streampay preset" }));
            return;
          }
          const presetLabel =
            presetRaw && typeof presetRaw === "string"
              ? STREAMPAY_UI_PRESET_LABEL[presetRaw] ?? presetRaw
              : null;
          const apiBase =
            process.env.STREAMPAY_API_BASE_URL?.trim() || STREAMPAY_DEFAULT_API_BASE;
          const storeRaw = process.env.STREAMPAY_STORE_ID?.trim();
          const seed = process.env.STREAMPAY_PRIVATE_KEY_HEX?.trim();
          if (!storeRaw || !/^\d+$/.test(storeRaw)) {
            console.warn("[streampay] STREAMPAY_STORE_ID не задан или не число");
            res.writeHead(503, { "Content-Type": "application/json", ...corsNotifyHeaders });
            res.end(JSON.stringify({ error: "streampay store" }));
            return;
          }
          if (!seed) {
            console.warn("[streampay] STREAMPAY_PRIVATE_KEY_HEX не задан");
            res.writeHead(503, { "Content-Type": "application/json", ...corsNotifyHeaders });
            res.end(JSON.stringify({ error: "streampay private key" }));
            return;
          }
          let extraRaw: Record<string, unknown> | null = null;
          try {
            extraRaw = streamPayParseExtraCreateFieldsJson(process.env.STREAMPAY_EXTRA_CREATE_FIELDS);
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.warn("[streampay] STREAMPAY_EXTRA_CREATE_FIELDS", msg);
            res.writeHead(503, { "Content-Type": "application/json", ...corsNotifyHeaders });
            res.end(JSON.stringify({ error: "streampay extra fields", detail: msg }));
            return;
          }
          let systemCurrency = streamPayPickStr(
            "STREAMPAY_SYSTEM_CURRENCY",
            "system_currency",
            extraRaw,
          );
          let paymentTypeVal = streamPayPickPaymentType(extraRaw);
          let currencyOpt = streamPayPickStr("STREAMPAY_CURRENCY", "currency", extraRaw);

          if (
            process.env.STREAMPAY_FORCE_ISO4217_LOWER === "1" ||
            process.env.STREAMPAY_FORCE_ISO4217_LOWER === "true"
          ) {
            systemCurrency = systemCurrency.toLowerCase();
            if (currencyOpt) {
              currencyOpt = currencyOpt.toLowerCase();
            }
          }
          if (!systemCurrency) {
            console.warn(
              "[streampay] нет system_currency — задайте STREAMPAY_SYSTEM_CURRENCY или JSON в STREAMPAY_EXTRA_CREATE_FIELDS (как в ЛК → Payment Create)",
            );
            res.writeHead(503, { "Content-Type": "application/json", ...corsNotifyHeaders });
            res.end(
              JSON.stringify({
                error: "streampay system_currency",
                detail:
                  "Скопируйте поле system_currency из примера JSON в ЛК (Integration → Payment Create) в STREAMPAY_SYSTEM_CURRENCY или в объект STREAMPAY_EXTRA_CREATE_FIELDS.",
              }),
            );
            return;
          }
          if (paymentTypeVal == null || !Number.isFinite(paymentTypeVal)) {
            console.warn(
              "[streampay] нет payment_type — STREAMPAY_PAYMENT_TYPE или поле в STREAMPAY_EXTRA_CREATE_FIELDS",
            );
            res.writeHead(503, { "Content-Type": "application/json", ...corsNotifyHeaders });
            res.end(
              JSON.stringify({
                error: "streampay payment_type",
                detail:
                  "Скопируйте payment_type из примера Payment Create в ЛК в STREAMPAY_PAYMENT_TYPE (число) или в STREAMPAY_EXTRA_CREATE_FIELDS.",
              }),
            );
            return;
          }
          const paymentType = paymentTypeVal;
          if (paymentType === 1 && !currencyOpt) {
            console.warn("[streampay] payment_type=1 нужен currency (STREAMPAY_CURRENCY или EXTRA.currency)");
            res.writeHead(503, { "Content-Type": "application/json", ...corsNotifyHeaders });
            res.end(
              JSON.stringify({
                error: "streampay currency",
                detail:
                  "При payment_type=1 задайте STREAMPAY_CURRENCY или поле currency в STREAMPAY_EXTRA_CREATE_FIELDS — как в примере ЛК.",
              }),
            );
            return;
          }
          const storeId = Number(storeRaw);
          const merchantOrderId = buildMerchantOrderId();

          let streamPayAmount: number;
          let amountSource: string;
          try {
            const legacy = streamPayInvoiceUnitsPerRubFromEnv();
            if (legacy != null) {
              streamPayAmount = Math.round(amountNum * legacy * 100) / 100;
              amountSource = "env_ORDER_RUB_TO_INVOICE_RATE";
            } else if (streamPayAutoFiatRatesEnabled()) {
              streamPayAmount = await streamPayConvertRubToFiatAmount(
                amountNum,
                systemCurrency.replace(/^\ufeff/, "").trim(),
              );
              amountSource = "cbr_" + systemCurrency.replace(/^\ufeff/, "").trim().toUpperCase();
            } else {
              streamPayAmount = amountNum;
              amountSource = "rub_as_invoice_units";
            }
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.warn("[streampay] сумма/курсы", msg);
            res.writeHead(503, { "Content-Type": "application/json", ...corsNotifyHeaders });
            res.end(
              JSON.stringify({
                error: "streampay rates",
                detail: msg.slice(0, 500),
              }),
            );
            return;
          }
          const normalized = streamPayNormalizeUsdtInvoiceAmount(
            paymentType,
            systemCurrency,
            streamPayAmount,
            amountSource,
          );
          streamPayAmount = normalized.amount;
          amountSource = normalized.source;

          let payloadSp: PendingPaymentOrder = {
            ...payload,
            transferMethod: presetLabel
              ? `Оплата · StreamPay (${presetLabel})`
              : "Оплата · StreamPay",
            amountExpected: formatAmountForFk(streamPayAmount),
          };
          const descParts = [payloadSp.orderNumber, payloadSp.game, payloadSp.server].filter(
            Boolean,
          ) as string[];
          const description =
            descParts.join(" ").trim().slice(0, 480) || payloadSp.orderNumber;
          const extraMerge = streamPaySanitizeExtraForMerge(extraRaw);

          const maxAmountTriesRaw = process.env.STREAMPAY_AMOUNT_INVALID_MAX_TRIES?.trim();
          const maxAmountTries = Math.min(
            40,
            Math.max(
              1,
              maxAmountTriesRaw && /^\d+$/.test(maxAmountTriesRaw)
                ? Number(maxAmountTriesRaw)
                : 15,
            ),
          );

          console.error(
            "[streampay] payment/create resolved fields",
            JSON.stringify({
              streampayPreset: presetRaw ?? null,
              presetLabel,
              systemCurrency,
              paymentType,
              currencyForApi: paymentType === 1 ? currencyOpt : null,
              storeId,
              amount: streamPayAmount,
              amountSource,
              amountInvalidMaxTries: maxAmountTries,
              apiBase:
                process.env.STREAMPAY_API_BASE_URL?.trim() || STREAMPAY_DEFAULT_API_BASE,
              extraSupplementaryOnlyKeys: extraMerge ? Object.keys(extraMerge) : [],
            }),
          );

          let payUrl: string | undefined;
          let lastCreateErr: Error | null = null;
          for (let t = 0; t < maxAmountTries; t++) {
            const bodyJson = streamPayBuildCreatePaymentJson(
              {
                storeId,
                customer: String(telegramUserId),
                externalId: merchantOrderId,
                description,
                systemCurrency,
                paymentType,
                ...(paymentType === 1 && currencyOpt ? { currency: currencyOpt } : {}),
                amount: streamPayAmount,
                successUrl: process.env.STREAMPAY_SUCCESS_URL?.trim() || undefined,
                failUrl: process.env.STREAMPAY_FAIL_URL?.trim() || undefined,
                cancelUrl: process.env.STREAMPAY_CANCEL_URL?.trim() || undefined,
                lang: process.env.STREAMPAY_LANG?.trim() || undefined,
              },
              extraMerge,
            );
            console.error(
              `[streampay] payment/create bodyJson try ${t + 1}/${maxAmountTries}`,
              bodyJson,
            );
            try {
              payUrl = (
                await streamPayPostCreate(apiBase, bodyJson, seed, {
                  storeId,
                  orderHint: payloadSp.orderNumber,
                })
              ).payUrl;
              payUrl = streamPayPayUrlWithOptionalFiatParam(payUrl, presetLabel);
              lastCreateErr = null;
              if (t > 0) {
                console.warn(
                  `[streampay] create ok после ${t + 1} попыток, amount=${streamPayAmount} USDT`,
                );
              }
              break;
            } catch (e) {
              lastCreateErr = e instanceof Error ? e : new Error(String(e));
              const msg = lastCreateErr.message;
              const isUsdtType2 =
                paymentType === 2 &&
                systemCurrency.replace(/^\ufeff/, "").trim().toUpperCase().includes("USDT");
              const invalidAmt =
                msg.includes("amount_is_invalid") || msg.includes('"amount_is_invalid"');
              if (isUsdtType2 && invalidAmt && t + 1 < maxAmountTries) {
                streamPayAmount += 1;
                amountSource = `${amountSource}+bump_${streamPayAmount}`;
                payloadSp = {
                  ...payloadSp,
                  amountExpected: formatAmountForFk(streamPayAmount),
                };
                console.warn(
                  `[streampay] amount_is_invalid → bump amount=${streamPayAmount} USDT (попытка ${t + 2}/${maxAmountTries})`,
                );
                continue;
              }
              break;
            }
          }

          if (!payUrl) {
            const msg = lastCreateErr instanceof Error ? lastCreateErr.message : String(lastCreateErr);
            console.error("[streampay] create", msg);
            res.writeHead(502, { "Content-Type": "application/json", ...corsNotifyHeaders });
            res.end(JSON.stringify({ error: "streampay api", detail: msg.slice(0, 800) }));
            return;
          }
          putPendingPayment(merchantOrderId, payloadSp);
          res.writeHead(200, { "Content-Type": "application/json", ...corsNotifyHeaders });
          res.end(
            JSON.stringify({
              payUrl,
              merchantOrderId,
              orderId: payloadSp.orderId,
              orderNumber: payloadSp.orderNumber,
            }),
          );
          return;
        }

        if (body.method !== "sbp" && body.method !== "mir" && body.method !== "card_rub") {
          res.writeHead(400, { "Content-Type": "application/json", ...corsNotifyHeaders });
          res.end(JSON.stringify({ error: "method" }));
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

        const oa = payload.amountExpected;
        const merchantOrderId = buildMerchantOrderId();
        const sign = signPaymentForm(merchantId, oa, secret1, "RUB", merchantOrderId);
        const i = fkMethodId(body.method);
        const apiKey = process.env.FREEKASSA_API_KEY?.trim();
        const secret2 = process.env.FREEKASSA_SECRET2?.trim() || process.env.FREEKASSA_SECRET?.trim();
        const clientIp = getClientIp(req).trim() || "0.0.0.0";
        const payerEmail = `tg${telegramUserId}@example.com`;
        const orderTelOptional = process.env.FREEKASSA_ORDER_TEL?.trim();

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
        putPendingPayment(merchantOrderId, payload);
        res.writeHead(200, { "Content-Type": "application/json", ...corsNotifyHeaders });
        res.end(
          JSON.stringify({
            payUrl,
            merchantOrderId,
            orderId: payload.orderId,
            orderNumber: payload.orderNumber,
          }),
        );
      } catch (e) {
        console.error("[payment] /notify/payment/prepare", e);
        res.writeHead(500, { "Content-Type": "application/json", ...corsNotifyHeaders });
        res.end(JSON.stringify({ error: "server" }));
      }
      return;
    }

    if ((req.method === "GET" || req.method === "POST") && url === "/notify/streampay") {
      const pubHex = process.env.STREAMPAY_PUBLIC_KEY_HEX?.trim();
      if (!pubHex) {
        res.writeHead(503, corsNotifyHeaders).end("no streampay public key");
        return;
      }
      const sigRaw = req.headers["signature"] ?? req.headers["Signature"];
      const signatureHex =
        typeof sigRaw === "string" ? sigRaw : Array.isArray(sigRaw) ? (sigRaw[0] ?? "") : "";
      if (!signatureHex) {
        res.writeHead(400, corsNotifyHeaders).end("no signature");
        return;
      }
      try {
        if (req.method === "GET") {
          const fullUrl = req.url ?? "/";
          const u = new URL(fullUrl, "http://streampay.callback");
          const rec: Record<string, string> = {};
          u.searchParams.forEach((v, k) => {
            if (!(k in rec)) {
              rec[k] = v;
            }
          });
          const sorted = streamPaySortedQueryString(rec);
          const paramsBuf = Buffer.from(sorted, "utf8");
          if (!streamPayVerifySignedPayload(paramsBuf, signatureHex, pubHex)) {
            console.warn("[streampay] неверная подпись (GET)");
            res.writeHead(403, corsNotifyHeaders).end("sign");
            return;
          }
          const fields = streamPayExtractCallbackFields(rec as unknown as Record<string, unknown>);
          if (!fields) {
            res.writeHead(200, corsNotifyHeaders).end();
            return;
          }
          if (!streamPayIsPaidStatus(fields.status)) {
            res.writeHead(200, corsNotifyHeaders).end();
            return;
          }
          if (isIntidProcessed(fields.invoice)) {
            res.writeHead(200, corsNotifyHeaders).end();
            return;
          }
          const pending = getPendingPayment(fields.externalId);
          if (!pending) {
            console.warn("[streampay] нет pending", fields.externalId);
            res.writeHead(200, corsNotifyHeaders).end();
            return;
          }
          if (pending.sent) {
            markIntidProcessed(fields.invoice);
            res.writeHead(200, corsNotifyHeaders).end();
            return;
          }
          if (!amountsMatchFreekassa(pending.amountExpected, fields.amount)) {
            console.warn(
              "[streampay] сумма не совпала, обновляем заказ",
              fields.externalId,
              "ожидалось:", pending.amountExpected,
              "фактически:", fields.amount,
            );
            const expectedNum = parseFloat(pending.amountExpected);
            const actualNum = parseFloat(fields.amount);
            if (!isNaN(expectedNum) && !isNaN(actualNum) && expectedNum > 0) {
              const ratio = actualNum / expectedNum;
              pending.amountRub = Math.round((pending.amountRub ?? 0) * ratio * 100) / 100;
              pending.amountExpected = fields.amount;
              pending.transferMethod = `${pending.transferMethod} (Сумма изменена: ${actualNum} вместо ${expectedNum})`;
              putPendingPayment(fields.externalId, pending);
            }
          }
          markIntidProcessed(fields.invoice);
          await deliverPaidPendingOrder(bot, miniAppUrl, pending);
          markPendingSent(fields.externalId);
          res.writeHead(200, corsNotifyHeaders).end();
          return;
        }

        const rawBuf = await readRequestBodyBuffer(req);
        if (!streamPayVerifySignedPayload(rawBuf, signatureHex, pubHex)) {
          console.warn("[streampay] неверная подпись (POST)");
          res.writeHead(403, corsNotifyHeaders).end("sign");
          return;
        }
        let j: Record<string, unknown>;
        try {
          j = JSON.parse(rawBuf.toString("utf8")) as Record<string, unknown>;
        } catch {
          res.writeHead(400, corsNotifyHeaders).end("bad json");
          return;
        }
        const fields = streamPayExtractCallbackFields(j);
        if (!fields) {
          res.writeHead(200, corsNotifyHeaders).end();
          return;
        }
        if (!streamPayIsPaidStatus(fields.status)) {
          res.writeHead(200, corsNotifyHeaders).end();
          return;
        }
        if (isIntidProcessed(fields.invoice)) {
          res.writeHead(200, corsNotifyHeaders).end();
          return;
        }
        const pending = getPendingPayment(fields.externalId);
        if (!pending) {
          console.warn("[streampay] нет pending", fields.externalId);
          res.writeHead(200, corsNotifyHeaders).end();
          return;
        }
        if (pending.sent) {
          markIntidProcessed(fields.invoice);
          res.writeHead(200, corsNotifyHeaders).end();
          return;
        }
        if (!amountsMatchFreekassa(pending.amountExpected, fields.amount)) {
          console.warn(
            "[streampay] сумма не совпала, обновляем заказ",
            fields.externalId,
            "ожидалось:", pending.amountExpected,
            "фактически:", fields.amount,
          );
          const expectedNum = parseFloat(pending.amountExpected);
          const actualNum = parseFloat(fields.amount);
          if (!isNaN(expectedNum) && !isNaN(actualNum) && expectedNum > 0) {
            const ratio = actualNum / expectedNum;
            pending.amountRub = Math.round((pending.amountRub ?? 0) * ratio * 100) / 100;
            pending.amountExpected = fields.amount;
            pending.transferMethod = `${pending.transferMethod} (Сумма изменена: ${actualNum} вместо ${expectedNum})`;
            putPendingPayment(fields.externalId, pending);
          }
        }
        markIntidProcessed(fields.invoice);
        await deliverPaidPendingOrder(bot, miniAppUrl, pending);
        markPendingSent(fields.externalId);
        res.writeHead(200, corsNotifyHeaders).end();
      } catch (e) {
        console.error("[streampay] handler", e);
        res.writeHead(500, corsNotifyHeaders).end("error");
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
        await deliverPaidPendingOrder(bot, miniAppUrl, pending);
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
        url === "/notify/streampay" ||
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
        const webUserInit = parseValidatedWebAppUser(body.initData, botToken);
        if (!webUserInit) {
          console.warn("[virt-order] /notify/virt-order-webapp: initData невалиден");
          res.writeHead(401, corsNotifyHeaders).end("bad initData");
          return;
        }
        const telegramUserId = webUserInit.id;
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
          ...(webUserInit.username ? { telegramUsername: webUserInit.username } : {}),
          ...(webUserInit.firstName ? { telegramFirstName: webUserInit.firstName } : {}),
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
        const body = await readJsonBody<{
          initData: string;
          action?: string;
          orderId?: string;
        }>(req);
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
          const botUsername = resolveReferralBotHandle();
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

        if (body.action === "get_other_services") {
          const { getOtherServicesV1 } = await import("./other-services-store.js");
          const catalog = getOtherServicesV1();
          res.writeHead(200, { "Content-Type": "application/json", ...corsNotifyHeaders });
          res.end(JSON.stringify({ ok: true, catalog }));
          return;
        }

        if (body.action === "get_my_orders") {
          const admins = resolveAdminTelegramIdsFromEnv();
          const isElevated = admins.includes(telegramUserId);
          const activeAll = getActiveOrders();
          const closedAll = getClosedOrders();
          const uidStr = String(telegramUserId);
          const active = isElevated
            ? activeAll
            : activeAll.filter((r) => String(r.telegramUserId) === uidStr);
          const closed = isElevated
            ? closedAll
            : closedAll.filter((r) => String(r.telegramUserId) === uidStr);
          res.writeHead(200, {
            "Content-Type": "application/json",
            ...corsNotifyHeaders,
          });
          res.end(
            JSON.stringify({
              ok: true,
              isAdminView: isElevated,
              active: active.map(adminRowToMiniappOrderJson),
              closed: closed.map(adminRowToMiniappOrderJson),
            }),
          );
          return;
        }

        if (body.action === "get_my_order") {
          const orderId = body.orderId;
          if (typeof orderId !== "string" || !orderId.trim()) {
            res.writeHead(400, corsNotifyHeaders).end("bad body");
            return;
          }
          const row = getAdminOrderByIdFromStore(orderId.trim());
          if (!row) {
            res.writeHead(404, {
              "Content-Type": "application/json",
              ...corsNotifyHeaders,
            });
            res.end(JSON.stringify({ ok: false, error: "not_found" }));
            return;
          }
          const admins = resolveAdminTelegramIdsFromEnv();
          const isElevated = admins.includes(telegramUserId);
          if (!isElevated && String(row.telegramUserId) !== String(telegramUserId)) {
            res.writeHead(403, {
              "Content-Type": "application/json",
              ...corsNotifyHeaders,
            });
            res.end(JSON.stringify({ ok: false, error: "forbidden" }));
            return;
          }
          res.writeHead(200, {
            "Content-Type": "application/json",
            ...corsNotifyHeaders,
          });
          res.end(
            JSON.stringify({
              ok: true,
              order: adminRowToMiniappOrderJson(row),
            }),
          );
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
      console.log(
        `StreamPay: prepare через POST /notify/payment/prepare с method streampay; callback GET|POST /notify/streampay (URL в ЛК StreamPay — как в интеграции магазина)`,
      );
    }
    if (secret) {
      console.log(
        `HTTP бэкенд → заказ: POST http://${bind}:${port}/notify/virt-order-success (Bearer)`,
      );
    }
  });
}
