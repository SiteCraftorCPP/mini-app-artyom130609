/**
 * Незавершённый заказ: оплата FreeKassa ещё не подтверждена.
 * MERCHANT_ORDER_ID = то же, что `o` в pay.fk.money.
 * Поля как у `VirtOrderSuccessPayload` (без цикла импорта).
 */
export type OtherServicePendingMeta = {
  mode: "auto" | "manual";
  deliverText?: string;
  itemId: string;
  gameId: string;
  mainId: string | null;
  gameName: string;
  mainName: string | null;
  cardSummary: string;
};

export type PendingPaymentOrder = {
  amountExpected: string;
  sent: boolean;
  telegramUserId: number;
  orderNumber: string;
  orderId: string;
  orderKind?: "virt" | "account" | "other_service";
  game?: string;
  server?: string;
  bankAccount?: string;
  amountRub?: number;
  virtAmountLabel?: string;
  transferMethod?: string;
  promoCode?: string;
  otherService?: OtherServicePendingMeta;
};

const byMerchant = new Map<string, PendingPaymentOrder>();
/** intid FreeKassa — защита от повторных уведомлений */
const processedIntids = new Set<string>();

export function putPendingPayment(merchantId: string, o: PendingPaymentOrder) {
  byMerchant.set(merchantId, o);
}

export function getPendingPayment(merchantId: string): PendingPaymentOrder | undefined {
  return byMerchant.get(merchantId);
}

export function isIntidProcessed(intid: string): boolean {
  return processedIntids.has(intid);
}

export function markIntidProcessed(intid: string) {
  processedIntids.add(intid);
}

export function markPendingSent(merchantId: string) {
  const p = byMerchant.get(merchantId);
  if (p) {
    p.sent = true;
  }
}

export function buildMerchantOrderId(): string {
  const t = Date.now();
  const r = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `A${t}${r}`;
}
