import { createServer } from "node:http";
import { randomInt } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

import type { Bot } from "grammy";
import { InputFile } from "grammy";
import { InlineKeyboard } from "grammy";

import { getTelegramUserIdFromWebAppInitData } from "./telegram-webapp-init-data.js";
import {
  BTN_WRITE_MANAGER,
  BTN_WRITE_REVIEW,
  REVIEW_POST_URL,
  buildOrderCompletedBuyerCaption,
  buildSellVirtCaption,
} from "./texts.js";
import {
  addOrUpdateActiveOrder,
  type AdminOrderRow,
} from "./orders-store.js";
import { parseRublesAmountFromUserText } from "./money-input.js";

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
  const caption = buildSellVirtCaption(orderRef);
  const photo = resolveOrderSuccessPhoto();
  const managerUrl =
    process.env.MANAGER_TELEGRAM_URL?.trim() || "https://t.me/artshopvirts_man";
  const reply_markup = new InlineKeyboard().url(BTN_WRITE_MANAGER, managerUrl);

  const sendTextOnly = async () => {
    await bot.api.sendMessage(telegramUserId, caption, {
      reply_markup,
    });
  };

  try {
    if (photo?.type === "file") {
      console.info("[sell] sendPhoto", photo.path, "ref=", orderRef);
      const buffer = readFileSync(photo.path);
      await bot.api.sendPhoto(
        telegramUserId,
        new InputFile(buffer, basename(photo.path)),
        {
          caption,
          reply_markup,
        },
      );
    } else if (photo?.type === "url") {
      await bot.api.sendPhoto(telegramUserId, photo.url, {
        caption,
        reply_markup,
      });
    } else {
      console.warn(
        "[sell] нет ORDER_SUCCESS фото — только текст (ORDER_SUCCESS_IMAGE_PATH / ORDER_SUCCESS_PHOTO_URL).",
      );
      await sendTextOnly();
    }
  } catch (e) {
    console.error("[sell] sendSellVirtMessage", e);
    try {
      await sendTextOnly();
    } catch {
      /* ignore */
    }
  }
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

/** Покупка аккаунта — связь с менеджером (без webApp-кнопки заказа). */
function buildAccountManagerOrderCaption(orderNumber: string): string {
  const n = formatOrderNumberForCaption(orderNumber);
  return [
    `✅ Заказ ${n} успешно оформлен!`,
    "",
    "💬 Следующие действия:",
    "Скопируйте номер заказ и отпишите нашему менеджеру, нажав на кнопку ниже 🔽",
  ].join("\n");
}

/**
 * Кнопка только типа web_app — иначе Telegram показывает обычную ссылку, а не открытие мини-аппа.
 * URL должен совпадать с доменом Mini App в @BotFather.
 */
function buildOrderDetailsKeyboard(miniAppUrl: string, orderId: string) {
  const base = miniAppUrl.replace(/\/$/, "");
  const url = `${base}/profile?open=currentOrders&orderId=${encodeURIComponent(orderId)}`;
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
  const { caption, reply_markup } = resolveVirtOrderCaptionAndKeyboard(
    payload,
    miniAppUrl,
  );
  const photo = resolveOrderSuccessPhoto();

  const sendTextOnly = async () => {
    await bot.api.sendMessage(payload.telegramUserId, caption, {
      reply_markup,
    });
  };

  if (!photo) {
    console.warn(
      "ORDER_SUCCESS: нет фото на диске и нет рабочего URL — только текст.",
    );
    await sendTextOnly();
  } else {
    try {
      if (photo.type === "url") {
        console.info("[virt-order] sendPhoto по URL", photo.url.slice(0, 72));
        await bot.api.sendPhoto(payload.telegramUserId, photo.url, {
          caption,
          reply_markup,
        });
      } else {
        console.info("[virt-order] sendPhoto заказа с диска", photo.path);
        const buffer = readFileSync(photo.path);
        await bot.api.sendPhoto(
          payload.telegramUserId,
          new InputFile(buffer, basename(photo.path)),
          { caption, reply_markup },
        );
      }
    } catch (e) {
      console.error("[virt-order] sendPhoto не удался — отправляю текст", e);
      try {
        await sendTextOnly();
      } catch (err2) {
        console.error("[virt-order] sendTextOnly тоже упал", err2);
      }
    }
  }

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

/**
 * Сообщение покупателю: заказ выполнен, отзыв, кнопка на пост + фото `photo_3` при наличии.
 */
export async function sendOrderCompletedToBuyer(
  bot: Bot,
  payload: { telegramUserId: number; orderNumber: string; isAccount?: boolean; accountData?: string },
): Promise<void> {
  const caption = buildOrderCompletedBuyerCaption(payload.orderNumber, payload.isAccount, payload.accountData);
  const reply_markup = new InlineKeyboard().url(BTN_WRITE_REVIEW, REVIEW_POST_URL);

  const sendTextOnly = async () => {
    await bot.api.sendMessage(payload.telegramUserId, caption, {
      reply_markup,
    });
  };

  const photo = resolveCompletedOrderReviewPhoto();
  if (!photo) {
    await sendTextOnly();
    return;
  }

  try {
    if (photo.type === "url") {
      await bot.api.sendPhoto(payload.telegramUserId, photo.url, {
        caption,
        reply_markup,
      });
    } else {
      const buffer = readFileSync(photo.path);
      await bot.api.sendPhoto(
        payload.telegramUserId,
        new InputFile(buffer, basename(photo.path)),
        { caption, reply_markup },
      );
    }
  } catch (e) {
    console.error("[order-complete] sendPhoto", e);
    try {
      await sendTextOnly();
    } catch (err2) {
      console.error("[order-complete] sendTextOnly тоже упал", err2);
    }
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
  return {
    ...(game !== undefined ? { game } : {}),
    ...(server !== undefined ? { server } : {}),
    ...(virtAmountLabel !== undefined ? { virtAmountLabel } : {}),
    ...(transferMethod !== undefined ? { transferMethod } : {}),
    ...(bankAccount !== undefined ? { bankAccount } : {}),
    ...(amountRub !== undefined ? { amountRub } : {}),
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

const corsNotifyHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

  const server = createServer(async (req, res) => {
    const url = req.url?.split("?")[0] ?? "";

    if (
      req.method === "OPTIONS" &&
      (url === "/notify/virt-order-webapp" ||
        url === "/notify/sell-virt-webapp" ||
        url === "/notify/virt-order-success")
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
        const body = await readJsonBody<{ initData: string }>(req);
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
    }
    if (secret) {
      console.log(
        `HTTP бэкенд → заказ: POST http://${bind}:${port}/notify/virt-order-success (Bearer)`,
      );
    }
  });
}
