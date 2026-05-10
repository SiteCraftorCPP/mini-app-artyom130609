/**
 * Пересчёт суммы заказа (₽) в валюту счёта StreamPay по курсам ЦБ РФ (JSON на cbr-xml-daily.ru).
 * Формула: за Nominal единиц валюты Value рублей → 1 ед. валюты = Value/Nominal ₽.
 */

const CBR_JSON_URL = "https://www.cbr-xml-daily.ru/daily_json.js";

type CbrValute = { CharCode: string; Nominal: number; Value: number };
type CbrPayload = { Valute: Record<string, CbrValute> };

/** Запас, если ЦБ/cетевой сбой (₽ за 1 единицу валюты; подправляются редко). */
const FALLBACK_RUB_PER_UNIT: Record<string, number> = {
  USD: 100,
  USDT: 100,
  KZT: 0.22,
  UAH: 2.45,
  BYN: 28,
  AZN: 54,
};

let cache: { fetchedAt: number; valute: Record<string, CbrValute> } | null = null;

function cacheTtlMs(): number {
  const raw = process.env.STREAMPAY_CBR_CACHE_SEC?.trim();
  const n = raw ? Number(raw) : 3600;
  if (!Number.isFinite(n) || n < 60) {
    return 3600_000;
  }
  return n * 1000;
}

function autoFiatRates(): boolean {
  const v = process.env.STREAMPAY_AUTO_FIAT_RATES?.trim().toLowerCase();
  return v !== "0" && v !== "false" && v !== "off";
}

/** Включён ли автопересчёт ₽→валюта по ЦБ (и фоллбекам). */
export function streamPayAutoFiatRatesEnabled(): boolean {
  return autoFiatRates();
}

function findValute(valute: Record<string, CbrValute>, charCode: string): CbrValute | null {
  const up = charCode.toUpperCase();
  for (const v of Object.values(valute)) {
    if (v.CharCode === up) {
      return v;
    }
  }
  return null;
}

async function loadCbrValute(): Promise<Record<string, CbrValute> | null> {
  const now = Date.now();
  const ttl = cacheTtlMs();
  if (cache && now - cache.fetchedAt < ttl) {
    return cache.valute;
  }
  let res: Response;
  try {
    res = await fetch(CBR_JSON_URL, {
      signal: AbortSignal.timeout(12_000),
      headers: { Accept: "application/json" },
    });
  } catch (e) {
    console.warn("[streampay-cbr] fetch", e instanceof Error ? e.message : e);
    return cache?.valute ?? null;
  }
  if (!res.ok) {
    console.warn("[streampay-cbr] status", res.status);
    return cache?.valute ?? null;
  }
  let j: CbrPayload;
  try {
    j = (await res.json()) as CbrPayload;
  } catch {
    return cache?.valute ?? null;
  }
  if (!j?.Valute || typeof j.Valute !== "object") {
    return cache?.valute ?? null;
  }
  cache = { fetchedAt: now, valute: j.Valute };
  return j.Valute;
}

/** Сколько ₽ стоит 1 единица валюты charCode (USD, KZT, …). USDT → USD. */
export async function streamPayRubPerUnit(charCode: string): Promise<number> {
  const code = charCode.toUpperCase() === "USDT" ? "USD" : charCode.toUpperCase();
  const valute = await loadCbrValute();
  const row = valute ? findValute(valute, code) : null;
  if (row && row.Nominal > 0 && Number.isFinite(row.Value) && row.Value > 0) {
    return row.Value / row.Nominal;
  }
  const fb = FALLBACK_RUB_PER_UNIT[code];
  if (fb != null && fb > 0) {
    console.warn(`[streampay-cbr] fallback rub/unit for ${code}=${fb}`);
    return fb;
  }
  throw new Error(`streampay-cbr: нет курса для ${code}`);
}

/** Сумма заказа в ₽ → сумма в валюте charCode (2 знака). */
export async function streamPayConvertRubToFiatAmount(
  amountRub: number,
  charCode: string,
): Promise<number> {
  if (!Number.isFinite(amountRub) || amountRub <= 0) {
    throw new Error("streampay-cbr: amountRub");
  }
  if (!autoFiatRates()) {
    throw new Error("STREAMPAY_AUTO_FIAT_RATES отключён — задайте STREAMPAY_FIAT_*_PER_RUB");
  }
  const rubPerUnit = await streamPayRubPerUnit(charCode);
  if (!Number.isFinite(rubPerUnit) || rubPerUnit <= 0) {
    throw new Error("streampay-cbr: rubPerUnit");
  }
  const out = amountRub / rubPerUnit;
  return Math.round(out * 100) / 100;
}
