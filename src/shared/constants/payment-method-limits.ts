import type { PaymentMethodCode } from "@/shared/lib/prepare-payment";

/** Минимумы способов оплаты (мини-апп + подсказки пользователю). */
export const PAYMENT_MIN_RUB_SBP = 10;
export const PAYMENT_MIN_RUB_MIR = 50;
export const PAYMENT_MIN_RUB_CARD = 50;
export const PAYMENT_MIN_RUB_STREAMPAY = 10;

export function minRubForPaymentMethod(method: PaymentMethodCode): number {
  if (method === "sbp") {
    return PAYMENT_MIN_RUB_SBP;
  }
  if (method === "mir") {
    return PAYMENT_MIN_RUB_MIR;
  }
  if (method === "streampay") {
    return PAYMENT_MIN_RUB_STREAMPAY;
  }
  return PAYMENT_MIN_RUB_CARD;
}
