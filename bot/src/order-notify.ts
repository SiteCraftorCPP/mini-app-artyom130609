import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { Bot } from "grammy";
import { InputFile } from "grammy";
import { InlineKeyboard } from "grammy";

const __dirname = dirname(fileURLToPath(import.meta.url));

export type VirtOrderSuccessPayload = {
  /** Номер заказа для текста (#JDHDH) */
  orderNumber: string;
  /** Внутренний id заказа для deep link в мини-апп */
  orderId: string;
  /** chat_id = telegram user id (личка с ботом) */
  telegramUserId: number;
};

function resolveOrderSuccessImagePath(): string | null {
  const botRoot = resolve(__dirname, "..");
  const repoRoot = resolve(__dirname, "../..");
  const fromEnv = process.env.ORDER_SUCCESS_IMAGE_PATH?.trim();
  const candidates = [
    fromEnv && resolve(botRoot, fromEnv),
    resolve(botRoot, "images", "photo_2026-04-07_20-21-21.jpg"),
    resolve(botRoot, "images", "photo_2026-04-07_20-21-21.png"),
    resolve(repoRoot, "images", "photo_2026-04-07_20-21-21.jpg"),
    resolve(repoRoot, "images", "photo_2026-04-07_20-21-21.png"),
  ].filter((p): p is string => Boolean(p));

  for (const p of candidates) {
    if (existsSync(p)) return p;
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
  const caption = buildVirtOrderSuccessCaption(payload.orderNumber);
  const reply_markup = buildOrderDetailsKeyboard(miniAppUrl, payload.orderId);
  const imagePath = resolveOrderSuccessImagePath();

  if (imagePath) {
    await bot.api.sendPhoto(payload.telegramUserId, new InputFile(imagePath), {
      caption,
      reply_markup,
    });
  } else {
    console.warn(
      "ORDER_SUCCESS: фото не найдено (ORDER_SUCCESS_IMAGE_PATH или images/photo_2026-04-07_20-21-21.jpg/png) — отправляю только текст.",
    );
    await bot.api.sendMessage(payload.telegramUserId, caption, {
      reply_markup,
    });
  }
}

type NotifyBody = {
  orderId: string;
  orderNumber: string;
  telegramUserId: number;
};

function readJsonBody(req: import("node:http").IncomingMessage): Promise<NotifyBody> {
  return new Promise((resolvePromise, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        const data = JSON.parse(raw) as NotifyBody;
        resolvePromise(data);
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

/**
 * POST /notify/virt-order-success
 * Authorization: Bearer <ORDER_NOTIFY_SECRET>
 * Body: { "telegramUserId": number, "orderNumber": string, "orderId": string }
 */
export function startOrderNotifyHttpServer(
  bot: Bot,
  miniAppUrl: string,
): void {
  const secret = process.env.ORDER_NOTIFY_SECRET?.trim();
  const port = Number(process.env.ORDER_NOTIFY_HTTP_PORT || "8788");

  if (!secret) {
    console.warn(
      "ORDER_NOTIFY_SECRET не задан — HTTP-уведомления о заказах отключены (задайте секрет в .env).",
    );
    return;
  }

  const server = createServer(async (req, res) => {
    if (req.method !== "POST" || req.url !== "/notify/virt-order-success") {
      res.writeHead(404).end();
      return;
    }

    const auth = req.headers.authorization;
    if (auth !== `Bearer ${secret}`) {
      res.writeHead(401).end("unauthorized");
      return;
    }

    try {
      const body = await readJsonBody(req);
      if (
        typeof body.telegramUserId !== "number" ||
        typeof body.orderNumber !== "string" ||
        typeof body.orderId !== "string"
      ) {
        res.writeHead(400).end("bad body");
        return;
      }

      await sendVirtOrderSuccess(bot, miniAppUrl, body);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    } catch (e) {
      console.error("notify/virt-order-success:", e);
      res.writeHead(500).end("error");
    }
  });

  server.listen(port, "127.0.0.1", () => {
    console.log(
      `HTTP уведомления о заказах: POST http://127.0.0.1:${port}/notify/virt-order-success`,
    );
  });
}
