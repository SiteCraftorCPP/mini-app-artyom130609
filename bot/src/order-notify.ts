import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { Bot } from "grammy";
import { InputFile } from "grammy";
import { InlineKeyboard } from "grammy";

import { getTelegramUserIdFromWebAppInitData } from "./telegram-webapp-init-data.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export type VirtOrderSuccessPayload = {
  /** Номер заказа для текста (#JDHDH) */
  orderNumber: string;
  /** Внутренний id заказа для deep link в мини-апп */
  orderId: string;
  /** chat_id = telegram user id (личка с ботом) */
  telegramUserId: number;
};

/**
 * Как resolveWelcomePhoto в index.ts: сначала файлы на диске (надёжно, как /start),
 * потом URL — иначе ORDER_SUCCESS_PHOTO_URL с 404 ломал всю отправку.
 */
type OrderSuccessPhoto =
  | { type: "url"; url: string }
  | { type: "file"; path: string };

function resolveOrderSuccessPhoto(): OrderSuccessPhoto | null {
  const botRoot = resolve(__dirname, "..");
  const repoRoot = resolve(__dirname, "../..");
  const fromEnv = process.env.ORDER_SUCCESS_IMAGE_PATH?.trim();
  const fileCandidates = [
    fromEnv && resolve(botRoot, fromEnv),
    resolve(botRoot, "images", "photo_2026-04-07_20-21-21.jpg"),
    resolve(botRoot, "images", "photo_2026-04-07_20-21-21.png"),
    resolve(repoRoot, "images", "photo_2026-04-07_20-21-21.jpg"),
    resolve(repoRoot, "images", "photo_2026-04-07_20-21-21.png"),
    resolve(botRoot, "images", "welcome.jpg"),
    resolve(botRoot, "images", "welcome.png"),
    resolve(botRoot, "images", "photo_2026-04-07_20-21-06.jpg"),
    resolve(repoRoot, "images", "photo_2026-04-07_20-21-06.jpg"),
  ].filter((p): p is string => Boolean(p));

  for (const p of fileCandidates) {
    if (existsSync(p)) {
      return { type: "file", path: p };
    }
  }

  const orderUrl = process.env.ORDER_SUCCESS_PHOTO_URL?.trim();
  if (orderUrl && /^https?:\/\//i.test(orderUrl)) {
    return { type: "url", url: orderUrl };
  }

  const welcomeUrl = process.env.WELCOME_PHOTO_URL?.trim();
  if (welcomeUrl && /^https?:\/\//i.test(welcomeUrl)) {
    return { type: "url", url: welcomeUrl };
  }

  return null;
}

function buildVirtOrderSuccessCaption(orderNumber: string): string {
  return [
    `✅ Заказ #${orderNumber} успешно оформлен!`,
    "",
    "🕔 Время выдачи виртов: от 5 минут до 24 часов. (Среднее время выдачи ~20 минут)",
    "",
    "💬 Когда вирты будут зачислены на ваш банковский счёт, мы вас обязательно уведомим прямо здесь в чате.",
    "",
    "Чтобы узнать детали заказа, нажмите кнопку ниже 👇",
  ].join("\n");
}

function buildOrderDetailsKeyboard(miniAppUrl: string, orderId: string) {
  const base = miniAppUrl.replace(/\/$/, "");
  const url = `${base}/profile?open=currentOrders&orderId=${encodeURIComponent(orderId)}`;
  return new InlineKeyboard().webApp("🟢 Узнать детали", url);
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
  });
  const caption = buildVirtOrderSuccessCaption(payload.orderNumber);
  const reply_markup = buildOrderDetailsKeyboard(miniAppUrl, payload.orderId);
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
    return;
  }

  try {
    if (photo.type === "url") {
      console.info("[virt-order] sendPhoto по URL", photo.url.slice(0, 72));
      await bot.api.sendPhoto(payload.telegramUserId, photo.url, {
        caption,
        reply_markup,
      });
    } else {
      console.info("[virt-order] sendPhoto с диска (как /start)", photo.path);
      await bot.api.sendPhoto(payload.telegramUserId, new InputFile(photo.path), {
        caption,
        reply_markup,
      });
    }
  } catch (e) {
    console.error("[virt-order] sendPhoto не удался — отправляю текст", e);
    await sendTextOnly();
  }
}

type NotifyBody = {
  orderId: string;
  orderNumber: string;
  telegramUserId: number;
};

type WebAppNotifyBody = {
  initData: string;
  orderId: string;
  orderNumber: string;
};

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
 * - POST /notify/virt-order-webapp — тело { initData, orderId, orderNumber }; подпись initData проверяется по TELEGRAM_BOT_TOKEN (для мини-аппа с inline-кнопки; sendData там часто недоступен).
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
        const telegramUserId = getTelegramUserIdFromWebAppInitData(
          body.initData,
          botToken,
        );
        if (telegramUserId === null) {
          console.warn("[virt-order] /notify/virt-order-webapp: initData невалиден");
          res.writeHead(401, corsNotifyHeaders).end("bad initData");
          return;
        }
        console.info("[virt-order] HTTP /notify/virt-order-webapp", {
          telegramUserId,
          orderNumber: body.orderNumber,
          orderId: body.orderId,
        });
        await sendVirtOrderSuccess(bot, miniAppUrl, {
          telegramUserId,
          orderId: body.orderId,
          orderNumber: body.orderNumber,
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

        console.info("[virt-order] HTTP /notify/virt-order-success", body);
        await sendVirtOrderSuccess(bot, miniAppUrl, body);
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
    }
    if (secret) {
      console.log(
        `HTTP бэкенд → заказ: POST http://${bind}:${port}/notify/virt-order-success (Bearer)`,
      );
    }
  });
}
