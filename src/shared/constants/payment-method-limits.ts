import type { PaymentMethodCode, StreampayFiatPreset } from "@/shared/lib/prepare-payment";

/** 
 * Минимумы способов оплаты (мини-апп + подсказки пользователю). 
 * Взяты из расчета примерного курса 1 USD = 100 RUB (с запасом, чтобы точно пройти лимиты шлюза).
 * 3 USD для KZ = 300 RUB
 * 5 USD для AZN, BYN, RUB = 500 RUB
 * 7 USD для UAH = 700 RUB
 */
export const PAYMENT_MIN_RUB_SBP = 500;
export const PAYMENT_MIN_RUB_MIR = 500;
export const PAYMENT_MIN_RUB_CARD = 500;

export const PAYMENT_MIN_RUB_STREAMPAY_KZT = 300;
export const PAYMENT_MIN_RUB_STREAMPAY_UAH = 700;
export const PAYMENT_MIN_RUB_STREAMPAY_AZN_BYN = 500;

export function minRubForPaymentMethod(method: PaymentMethodCode, preset?: StreampayFiatPreset): number {
  if (method === "streampay") {
    if (preset === "tenge") return PAYMENT_MIN_RUB_STREAMPAY_KZT;
    if (preset === "uah") return PAYMENT_MIN_RUB_STREAMPAY_UAH;
    if (preset === "azn" || preset === "byn") return PAYMENT_MIN_RUB_STREAMPAY_AZN_BYN;
    return 500;
  }
  if (method === "sbp") {
    return PAYMENT_MIN_RUB_SBP;
  }
  if (method === "mir") {
    return PAYMENT_MIN_RUB_MIR;
  }
  return PAYMENT_MIN_RUB_CARD;
}
