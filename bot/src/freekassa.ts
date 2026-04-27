import { createHash, createHmac } from "node:crypto";

/**
 * FreeKassa: ID способа `i` в ссылке на оплату — смотри кабинет (список валют / способы).
 * Дефолты по договорённости с заказчиком; при расхождении с ЛК задай в `bot/.env`:
 * FREEKASSA_METHOD_SBP, FREEKASSA_METHOD_CARD, FREEKASSA_METHOD_MIR.
 */
export const FREEKASSA_METHOD_DEFAULTS = {
  /** СБП (НСПК) — часто 44, у магазинов может отличаться */
  SBP: 44,
  /** МИР */
  MIR: 12,
  /** Card RUB API (VISA, MasterCard) */
  CARD_RUB: 36,
} as const;

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (raw === undefined || raw === "") {
    return fallback;
  }
  const n = Number(raw);
  if (Number.isInteger(n) && n > 0) {
    return n;
  }
  return fallback;
}

/** ID `i` для GET-формы на pay.fk.money (без смены кода — через env). */
export function resolveFreeKassaMethodId(
  method: "sbp" | "mir" | "card_rub",
): number {
  if (method === "sbp") {
    return intFromEnv("FREEKASSA_METHOD_SBP", FREEKASSA_METHOD_DEFAULTS.SBP);
  }
  if (method === "mir") {
    return intFromEnv("FREEKASSA_METHOD_MIR", FREEKASSA_METHOD_DEFAULTS.MIR);
  }
  return intFromEnv("FREEKASSA_METHOD_CARD", FREEKASSA_METHOD_DEFAULTS.CARD_RUB);
}

const PAY_BASE = "https://pay.fk.money/";

/** REST API (нужен для способов «только API», напр. Card RUB): docs.freekassa.net → orders/create */
const FK_API_BASE = "https://api.fk.life/v1";

/**
 * HMAC-SHA256 как в @boarteam/freekassa-sdk: Object.keys, sort, values join |.
 * Важно: `nonce` в теле — строка (см. request() в freekassa.sdk.js), иначе подпись не совпадёт.
 */
export function signFreeKassaApiPayload(
  payload: Record<string, string | number | undefined>,
  apiKey: string,
): string {
  const keys = Object.keys(payload).filter(
    (k) => k !== "signature" && payload[k] !== undefined,
  );
  keys.sort();
  const str = keys.map((k) => payload[k] as string | number).join("|");
  return createHmac("sha256", apiKey).update(str, "utf8").digest("hex");
}

export type FreeKassaCreateOrderResult = {
  payUrl: string;
  fkOrderId: number;
  orderHash: string;
};

/**
 * Создать заказ и получить ссылку на оплату (для методов без GET-формы на pay.fk.money).
 * В ЛК: настройки → API-ключ.
 */
export async function createFreeKassaOrderPayUrl(args: {
  apiKey: string;
  shopId: number;
  paymentId: string;
  i: number;
  email: string;
  ip: string;
  amountRub: number;
  currency: "RUB";
}): Promise<FreeKassaCreateOrderResult> {
  const oa = formatAmountForFk(args.amountRub);
  const amount = Number(oa);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("invalid amount");
  }
  /** Как @boarteam/freekassa-sdk: request() добавляет nonce строкой, иначе подпись на FK не сходится. */
  const nonce = Date.now().toString();
  const payload: Record<string, string | number> = {
    amount,
    currency: args.currency,
    email: args.email,
    i: args.i,
    ip: args.ip,
    nonce,
    paymentId: args.paymentId,
    shopId: args.shopId,
  };
  const signature = signFreeKassaApiPayload(payload, args.apiKey);
  const body = { ...payload, signature };
  const r = await fetch(`${FK_API_BASE}/orders/create`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let parsed: {
    type?: string;
    location?: string;
    orderId?: number;
    orderHash?: string;
    message?: string;
  };
  try {
    parsed = JSON.parse(text) as typeof parsed;
  } catch {
    throw new Error(`FK API: ответ не JSON (${r.status}): ${text.slice(0, 280)}`);
  }
  if (parsed.type !== "success" || !parsed.location?.trim()) {
    const errMsg = [
      (parsed as { error?: string }).error,
      parsed.message,
      (parsed as { description?: string }).description,
    ]
      .filter(Boolean)
      .join(" — ");
    throw new Error(
      errMsg.trim() ||
        `FK API orders/create: ${r.status} ${text.slice(0, 400)}`,
    );
  }
  return {
    payUrl: parsed.location.trim(),
    fkOrderId: parsed.orderId ?? 0,
    orderHash: parsed.orderHash ?? "",
  };
}

const FK_NOTIFY_IPS = new Set([
  "168.119.157.136",
  "168.119.60.227",
  "178.154.197.79",
  "51.250.54.238",
]);

export function isFreeKassaNotifyIp(ip: string): boolean {
  const t = ip.trim();
  return FK_NOTIFY_IPS.has(t);
}

/** Подпись для формы GET на pay.fk.money: md5(m:oa:secret1:currency:o) */
export function signPaymentForm(
  merchantId: string,
  orderAmount: string,
  secret1: string,
  currency: string,
  orderId: string,
): string {
  const s = `${merchantId}:${orderAmount}:${secret1}:${currency}:${orderId}`;
  return createHash("md5").update(s, "utf8").digest("hex");
}

/**
 * Подпись в оповещении: md5(MERCHANT_ID:AMOUNT:secret2:MERCHANT_ORDER_ID)
 * AMOUNT — как в уведомлении (строка).
 */
export function signNotification(
  merchantId: string,
  amount: string,
  secret2: string,
  merchantOrderId: string,
): string {
  const s = `${merchantId}:${amount}:${secret2}:${merchantOrderId}`;
  return createHash("md5").update(s, "utf8").digest("hex");
}

export function buildPaymentUrl(args: {
  m: string;
  oa: string;
  o: string;
  currency: "RUB" | "USD" | "EUR" | "UAH" | "KZT";
  s: string;
  i: number;
}): string {
  const p = new URLSearchParams();
  p.set("m", args.m);
  p.set("oa", args.oa);
  p.set("o", args.o);
  p.set("currency", args.currency);
  p.set("s", args.s);
  p.set("i", String(args.i));
  p.set("lang", "ru");
  /** Как в официальном примере GET-формы (док-ция FreeKassa, демо-ссылка). */
  p.set("pay", "PAY");
  return `${PAY_BASE}?${p.toString()}`;
}

/**
 * Сумма в форме/проверке: два знака после запятой.
 */
export function formatAmountForFk(amountRub: number): string {
  if (!Number.isFinite(amountRub) || amountRub <= 0) {
    return "0.00";
  }
  return amountRub.toFixed(2);
}

export type FreeKassaNotifyFields = {
  MERCHANT_ID?: string;
  AMOUNT?: string;
  intid?: string;
  MERCHANT_ORDER_ID?: string;
  SIGN?: string;
  CUR_ID?: string;
};

export function parseFreeKassaFormBody(body: string): Record<string, string> {
  const p = new URLSearchParams(body);
  const o: Record<string, string> = {};
  p.forEach((v, k) => {
    o[k] = v;
  });
  return o;
}

/**
 * URL-encoded POST тело, большие POST читаются построчно.
 */
export async function readRequestBodyString(req: import("node:http").IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const ch of req) {
    chunks.push(ch as Buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}
