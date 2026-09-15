import type { PaymentMethodCode } from "@/shared/lib/prepare-payment";

export const PAYMENT_MIN_RUB_SBP = 10;
export const PAYMENT_MIN_RUB_MIR = 50;
export const PAYMENT_MIN_RUB_CARD = 50;

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

export function minRubForPaymentMethod(method: PaymentMethodCode): number {
  if (method === "sbp") {
    return PAYMENT_MIN_RUB_SBP;
  }
  if (method === "mir") {
    return PAYMENT_MIN_RUB_MIR;
  }
  return PAYMENT_MIN_RUB_CARD;
}
