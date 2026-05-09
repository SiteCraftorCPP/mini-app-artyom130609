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

/** Поля из заказа и .env — не переопределяются STREAMPAY_EXTRA_CREATE_FIELDS (иначе старый JSON в EXTRA затирал валюту → 406). */
const STREAMPAY_CREATE_BODY_CORE_KEYS = new Set([
  "store_id",
  "customer",
  "external_id",
  "description",
  "system_currency",
  "payment_type",
  "currency",
  "amount",
  "merchant_fee",
  "success_url",
  "fail_url",
  "cancel_url",
  "lang",
]);

function streamPayExtraValueOk(v: unknown): boolean {
  if (v === undefined || v === null) {
    return false;
  }
  if (typeof v === "string" && !v.replace(/^\ufeff/, "").trim()) {
    return false;
  }
  return true;
}

/** ISO 4217 numeric — если в ЛК в примере числа вместо "USD"/"UAH", задай STREAMPAY_JSON_CURRENCY_AS_ISO4217_NUMBER=1 */
const ISO4217_ALPHA_TO_NUM: Record<string, number> = {
  UAH: 980,
  USD: 840,
  EUR: 978,
  RUB: 643,
  PLN: 985,
  GBP: 826,
  KZT: 398,
};

function streamPayCurrencyForJson(code: string): string | number {
  const raw = code.replace(/^\ufeff/, "").trim();
  const useNum =
    process.env.STREAMPAY_JSON_CURRENCY_AS_ISO4217_NUMBER === "1" ||
    process.env.STREAMPAY_JSON_CURRENCY_AS_ISO4217_NUMBER === "true";
  if (!useNum) {
    return raw;
  }
  let n: number | null = null;
  if (/^\d+$/.test(raw)) {
    n = Number(raw);
  } else {
    const mapped = ISO4217_ALPHA_TO_NUM[raw.toUpperCase()];
    if (mapped != null) {
      n = mapped;
    }
  }
  if (n == null) {
    return raw;
  }
  const asStr =
    process.env.STREAMPAY_ISO4217_NUMERIC_AS_JSON_STRING === "1" ||
    process.env.STREAMPAY_ISO4217_NUMERIC_AS_JSON_STRING === "true";
  return asStr ? String(n) : n;
}

/**
 * Тело POST /api/payment/create — порядок ключей как в примере PaymentCreateJs в ЛК.
 * `extraFromEnv` — только дополнительные поля из STREAMPAY_EXTRA_CREATE_FIELDS; валюту/тип/сумму там не дублируй (см. STREAMPAY_CREATE_BODY_CORE_KEYS).
 */
export function streamPayBuildCreatePaymentJson(
  i: StreamPayCreatePaymentFields,
  extraFromEnv?: Record<string, unknown> | null,
): string {
  const paymentTypeOut =
    process.env.STREAMPAY_PAYMENT_TYPE_AS_JSON_STRING === "1" ||
    process.env.STREAMPAY_PAYMENT_TYPE_AS_JSON_STRING === "true"
      ? String(i.paymentType)
      : i.paymentType;
  const amountOut =
    process.env.STREAMPAY_AMOUNT_AS_JSON_STRING === "1" ||
    process.env.STREAMPAY_AMOUNT_AS_JSON_STRING === "true"
      ? i.amount.toFixed(2)
      : i.amount;
  const o: Record<string, unknown> = {
    store_id: i.storeId,
    customer: i.customer,
    external_id: i.externalId,
    description: i.description,
    system_currency: streamPayCurrencyForJson(i.systemCurrency),
    payment_type: paymentTypeOut,
  };
  if (i.paymentType === 1 && i.currency) {
    o.currency = streamPayCurrencyForJson(i.currency);
  }
  o.amount = amountOut;
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
  if (extraFromEnv && typeof extraFromEnv === "object" && !Array.isArray(extraFromEnv)) {
    for (const [k, v] of Object.entries(extraFromEnv)) {
      if (STREAMPAY_CREATE_BODY_CORE_KEYS.has(k)) {
        continue;
      }
      if (streamPayExtraValueOk(v)) {
        o[k] = v;
      }
    }
  }
  return JSON.stringify(o);
}

/** Парсинг STREAMPAY_EXTRA_CREATE_FIELDS — одна строка JSON-объекта из ЛК (без подстановок). */
export function streamPayParseExtraCreateFieldsJson(raw: string | undefined): Record<string, unknown> | null {
  const s = raw?.trim();
  if (!s) {
    return null;
  }
  const j = JSON.parse(s) as unknown;
  if (j == null || typeof j !== "object" || Array.isArray(j)) {
    throw new Error("STREAMPAY_EXTRA_CREATE_FIELDS: ожидается JSON-объект {...}");
  }
  return j as Record<string, unknown>;
}

/** Убираем из extra поля, которые обязаны совпадать с заказом (подмена = поломка callback). */
export function streamPaySanitizeExtraForMerge(extra: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!extra) {
    return null;
  }
  const skip = new Set(["store_id", "customer", "external_id", "amount"]);
  const o: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(extra)) {
    if (!skip.has(k)) {
      o[k] = v;
    }
  }
  return Object.keys(o).length > 0 ? o : null;
}

export type StreamPayCreateResult = { payUrl: string };

export async function streamPayPostCreate(
  apiBaseUrl: string,
  bodyJson: string,
  privateSeedHex64: string,
  logMeta?: { storeId?: number; orderHint?: string },
): Promise<StreamPayCreateResult> {
  const base = apiBaseUrl.replace(/\/$/, "");
  const url = `${base}/api/payment/create`;
  const signature = streamPaySignUtf8Payload(bodyJson, privateSeedHex64);
  const verbose = process.env.STREAMPAY_LOG === "1" || process.env.STREAMPAY_LOG === "true";
  if (verbose) {
    console.info("[streampay] payment/create request", {
      url,
      storeId: logMeta?.storeId,
      orderHint: logMeta?.orderHint,
      body: bodyJson,
      bodyLength: Buffer.byteLength(bodyJson, "utf8"),
      signatureHexLength: signature.length,
    });
  }
  const r = await fetch(url, {
    method: "POST",
    headers: {
      Signature: signature,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: bodyJson,
  });
  const text = await r.text();
  if (!r.ok) {
    console.error("[streampay] payment/create FAILED", {
      url,
      status: r.status,
      statusText: r.statusText,
      contentType: r.headers.get("content-type") ?? "",
      responseBody: text.length > 8000 ? `${text.slice(0, 8000)}…` : text,
      requestBody: bodyJson,
    });
  } else if (verbose) {
    console.info("[streampay] payment/create ok", {
      url,
      status: r.status,
      responsePreview: text.slice(0, 600),
      requestBody: bodyJson,
    });
  }
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
