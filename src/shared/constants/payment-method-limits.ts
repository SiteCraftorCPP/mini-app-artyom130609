import type { PaymentMethodCode } from "@/shared/lib/prepare-payment";

import { KZT_PER_ONE_RUB, rubToKztAmount } from "./payment-requisites-kzt";

/** Минимумы способов оплаты (мини-апп + подсказки пользователю). */
export const PAYMENT_MIN_RUB_SBP = 10;
export const PAYMENT_MIN_RUB_MIR = 50;
export const PAYMENT_MIN_RUB_CARD = 50;
export const PAYMENT_MIN_KZT = 100;

export function minRubForPaymentMethod(method: PaymentMethodCode): number {
  if (method === "sbp") {
    return PAYMENT_MIN_RUB_SBP;
  }
  if (method === "mir") {
    return PAYMENT_MIN_RUB_MIR;
  }
  return PAYMENT_MIN_RUB_CARD;
}

export function rubMeetsKztMinimum(amountRub: number): boolean {
  const rub = Math.round(amountRub * 100) / 100;
  return rubToKztAmount(rub) >= PAYMENT_MIN_KZT;
}

/** Минимум ₽, при котором округление до ₸ даёт не меньше PAYMENT_MIN_KZT. */
export function minimalRubForKztPay(): number {
  for (let cents = 10; cents <= 5_000_000; cents++) {
    const rub = cents / 100;
    if (rubToKztAmount(rub) >= PAYMENT_MIN_KZT) {
      return rub;
    }
  }
  return Math.ceil((PAYMENT_MIN_KZT / KZT_PER_ONE_RUB) * 100) / 100;
}
