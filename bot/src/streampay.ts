/**
 * StreamPay (streampay.org) — как в официальных примерах API из кабинета (PaymentCreateJs / CallbackGetJs / CallbackPostJs).
 * Создание: POST {API_BASE_URL}/api/payment/create + заголовок Signature (Ed25519).
 * Подпись: JSON-тело + UTC время YYYYMMDD:HHMM (без секунд), как в доке.
 */
import { createPrivateKey, createPublicKey, sign, verify } from "node:crypto";

/** PKCS#8 prefix + 32-byte seed — см. пример «Private key» в интеграции. */
const STREAMPAY_PRIVATE_DER_PREFIX_HEX = "302e020100300506032b657004220420";
/** SubjectPublicKeyInfo prefix + 32-byte public key — см. пример «public key». */
const STREAMPAY_PUBLIC_SPKI_PREFIX_HEX = "302a300506032b6570032100";

export function streamPayUtcMinute(d: Date): string {
  const y = d.getUTCFullYear().toString().padStart(4, "0");
  const mo = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = d.getUTCDate().toString().padStart(2, "0");
  const h = d.getUTCHours().toString().padStart(2, "0");
  const mi = d.getUTCMinutes().toString().padStart(2, "0");
  return `${y}${mo}${day}:${h}${mi}`;
}

function normalizeHex64(label: string, hex: string): string {
  const s = hex.trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(s)) {
    throw new Error(`${label}: ожидается 64 hex-символа (32 байта)`);
  }
  return s;
}

export function streamPayCreatePrivateKey(seedHex64: string): ReturnType<typeof createPrivateKey> {
  const seed = normalizeHex64("STREAMPAY_PRIVATE_KEY_HEX", seedHex64);
  return createPrivateKey({
    key: Buffer.concat([
      Buffer.from(STREAMPAY_PRIVATE_DER_PREFIX_HEX, "hex"),
      Buffer.from(seed, "hex"),
    ]),
    format: "der",
    type: "pkcs8",
  });
}

export function streamPayCreatePublicKey(pubHex64: string): ReturnType<typeof createPublicKey> {
  const pub = normalizeHex64("STREAMPAY_PUBLIC_KEY_HEX", pubHex64);
  return createPublicKey({
    key: Buffer.concat([
      Buffer.from(STREAMPAY_PUBLIC_SPKI_PREFIX_HEX, "hex"),
      Buffer.from(pub, "hex"),
    ]),
    format: "der",
    type: "spki",
  });
}

/** Подпись тела запроса к /api/payment/create (строка JSON UTF-8). */
export function streamPaySignUtf8Payload(bodyUtf8: string, seedHex64: string): string {
  const now = new Date();
  const textToSign = bodyUtf8 + streamPayUtcMinute(now);
  const key = streamPayCreatePrivateKey(seedHex64);
  return sign(null, Buffer.from(textToSign, "utf8"), key).toString("hex");
}

/**
 * Проверка callback StreamPay: буфер подписываемых данных + суффикс времени (как в CallbackPostJs / CallbackGetJs).
 * Два окна: текущая минута и −1 минута.
 */
export function streamPayVerifySignedPayload(
  payloadBuf: Buffer,
  signatureHex: string,
  publicKeyHex64: string,
): boolean {
  let sig: Buffer;
  try {
    sig = Buffer.from(signatureHex.trim(), "hex");
  } catch {
    return false;
  }
  if (sig.length === 0) {
    return false;
  }
  let pub: ReturnType<typeof createPublicKey>;
  try {
    pub = streamPayCreatePublicKey(publicKeyHex64);
  } catch {
    return false;
  }
  const now = new Date();
  for (let i = 0; i < 2; i++) {
    const tm = streamPayUtcMinute(now);
    const bufToSign = Buffer.concat([payloadBuf, Buffer.from(tm, "ascii")]);
    try {
      if (verify(null, bufToSign, pub, sig)) {
        return true;
      }
    } catch {
      /* подпись невалидна */
    }
    now.setTime(now.getTime() - 60_000);
  }
  return false;
}

/** GET callback: ключи сортируются, строка key=value через &. */
export function streamPaySortedQueryString(params: Record<string, string>): string {
  return Object.keys(params)
    .filter((k) => params[k] != null && params[k] !== "")
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
}

export type StreamPayCreatePaymentFields = {
  storeId: number;
  customer: string;
  externalId: string;
  description: string;
  systemCurrency: string;
  paymentType: number;
  /** Только при payment_type === 1 (см. доку). */
  currency?: string;
  amount: number;
  merchantFee?: number;
  successUrl?: string;
  failUrl?: string;
  cancelUrl?: string;
  lang?: string;
};

/** Жёсткий порядок полей как в примере PaymentCreateJs. */
export function streamPayBuildCreatePaymentJson(i: StreamPayCreatePaymentFields): string {
  const o: Record<string, unknown> = {
    store_id: i.storeId,
    customer: i.customer,
    external_id: i.externalId,
    description: i.description,
    system_currency: i.systemCurrency,
    payment_type: i.paymentType,
  };
  if (i.paymentType === 1 && i.currency) {
    o.currency = i.currency;
  }
  o.amount = i.amount;
  if (i.merchantFee != null && Number.isFinite(i.merchantFee)) {
    o.merchant_fee = i.merchantFee;
  }
  if (i.successUrl) {
    o.success_url = i.successUrl;
  }
  if (i.failUrl) {
    o.fail_url = i.failUrl;
  }
  if (i.cancelUrl) {
    o.cancel_url = i.cancelUrl;
  }
  if (i.lang) {
    o.lang = i.lang;
  }
  return JSON.stringify(o);
}

export type StreamPayCreateResult = { payUrl: string };

export async function streamPayPostCreate(
  apiBaseUrl: string,
  bodyJson: string,
  privateSeedHex64: string,
): Promise<StreamPayCreateResult> {
  const base = apiBaseUrl.replace(/\/$/, "");
  const signature = streamPaySignUtf8Payload(bodyJson, privateSeedHex64);
  const r = await fetch(`${base}/api/payment/create`, {
    method: "POST",
    headers: {
      Signature: signature,
      "Content-Type": "application/json",
    },
    body: bodyJson,
  });
  const text = await r.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as {
      data?: { pay_url?: string; payUrl?: string };
      messages?: unknown;
    };
  } catch {
    throw new Error(`StreamPay: не JSON (${r.status}): ${text.slice(0, 200)}`);
  }
  if (!r.ok) {
    const msg =
      typeof parsed === "object" && parsed !== null && "messages" in parsed
        ? JSON.stringify((parsed as { messages?: unknown }).messages)
        : text.slice(0, 400);
    throw new Error(`StreamPay API ${r.status}: ${msg}`);
  }
  const data =
    typeof parsed === "object" && parsed !== null && "data" in parsed
      ? (parsed as { data?: { pay_url?: string; payUrl?: string } }).data
      : undefined;
  const payUrl = data?.pay_url?.trim() || data?.payUrl?.trim();
  if (!payUrl) {
    throw new Error(`StreamPay: нет pay_url в ответе: ${text.slice(0, 300)}`);
  }
  return { payUrl };
}

/** Извлечение строковых полей callback (GET query или POST JSON). */
export function streamPayExtractCallbackFields(
  rec: Record<string, unknown>,
): {
  externalId: string;
  invoice: string;
  amount: string;
  status: string;
} | null {
  const pick = (k: string): string => {
    const v = rec[k];
    if (v == null) {
      return "";
    }
    return String(v).trim();
  };
  const externalId = pick("external_id");
  const invoice = pick("invoice");
  const amount = pick("amount");
  const status = pick("status").toLowerCase();
  if (!externalId || !invoice || !amount) {
    return null;
  }
  return { externalId, invoice, amount, status };
}

export function streamPayIsPaidStatus(status: string): boolean {
  const s = status.trim().toLowerCase();
  return s === "paid" || s === "success";
}
