import type { PaymentMethodCode, StreampayFiatPreset } from "@/shared/lib/prepare-payment";

/**
 * Минимумы способов оплаты (мини-апп + подсказки пользователю).
 * RUB: лимиты по данным платёжки (FreeKassa): СБП от 10 ₽, карты РФ от 50 ₽.
 */
export const PAYMENT_MIN_RUB_SBP = 10;
export const PAYMENT_MIN_RUB_MIR = 50;
export const PAYMENT_MIN_RUB_CARD = 50;

export const PAYMENT_MIN_RUB_STREAMPAY_KZT = 145; // ~1000 KZT
export const PAYMENT_MIN_RUB_STREAMPAY_UAH = 465; // ~300 UAH
export const PAYMENT_MIN_RUB_STREAMPAY_BYN = 240; // ~10 BYN
export const PAYMENT_MIN_RUB_STREAMPAY_AZN = 375; // ~10 AZN

/** Каталог minAmountRub ≥ 500 — legacy placeholder; для формы берём PAYMENT_MIN_RUB_SBP. */
export const VIRT_CATALOG_LEGACY_MIN_RUB_PLACEHOLDER = 500;

export function effectiveVirtFormMinAmountRub(catalogMinRub: number): number {
  if (!Number.isFinite(catalogMinRub)) {
    return PAYMENT_MIN_RUB_SBP;
  }
  if (catalogMinRub >= VIRT_CATALOG_LEGACY_MIN_RUB_PLACEHOLDER) {
    return PAYMENT_MIN_RUB_SBP;
  }
  return catalogMinRub;
}

export function minRubForPaymentMethod(method: PaymentMethodCode, preset?: StreampayFiatPreset): number {
  if (method === "streampay") {
    if (preset === "tenge") return PAYMENT_MIN_RUB_STREAMPAY_KZT;
    if (preset === "uah") return PAYMENT_MIN_RUB_STREAMPAY_UAH;
    if (preset === "byn") return PAYMENT_MIN_RUB_STREAMPAY_BYN;
    if (preset === "azn") return PAYMENT_MIN_RUB_STREAMPAY_AZN;
    return PAYMENT_MIN_RUB_STREAMPAY_KZT;
  }
  if (method === "sbp") {
    return PAYMENT_MIN_RUB_SBP;
  }
  if (method === "mir") {
    return PAYMENT_MIN_RUB_MIR;
  }
  return PAYMENT_MIN_RUB_CARD;
}
