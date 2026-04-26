import { createHash } from "node:crypto";

/** FreeKassa: способы из ЛК, см. раздел «Список валют» в docs. */
export const FREEKASSA_METHOD = {
  /** СБП */
  SBP: 42,
  /** МИР */
  MIR: 12,
  /** Card RUB API (VISA, MasterCard) */
  CARD_RUB: 36,
} as const;

const PAY_BASE = "https://pay.fk.money/";

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
