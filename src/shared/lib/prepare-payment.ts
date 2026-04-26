import type { VirtOrderNotifyKind } from "./telegram-virt-order-notify";

const LOG = "[prepare-payment]";

function resolveBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_VIRT_ORDER_NOTIFY_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "";
}

export type PaymentMethodCode = "sbp" | "mir" | "card_rub";

export type PaymentPrepareInput = {
  initData: string;
  orderKind: VirtOrderNotifyKind;
  method: PaymentMethodCode;
  amountRub: number;
  game?: string;
  server?: string;
  bankAccount?: string;
  virtAmountLabel?: string;
  transferMethod?: string;
  promoCode?: string;
  accountMode?: string;
  accountOptionLabel?: string;
};

export type PaymentPrepareResult = {
  payUrl: string;
  merchantOrderId: string;
  orderId: string;
  orderNumber: string;
};

/**
 * FreeKassa: URL оплаты. Уведомление в бот — только после /notify/freekassa (сервер).
 */
export async function requestPaymentPrepare(
  body: PaymentPrepareInput,
): Promise<PaymentPrepareResult> {
  const base = resolveBaseUrl();
  if (!base) {
    throw new Error("no base url");
  }
  const r = await fetch(`${base}/notify/payment/prepare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await r.text().catch(() => "");
  if (!r.ok) {
    console.error(LOG, r.status, text);
    throw new Error(`prepare ${r.status}`);
  }
  const j = JSON.parse(text) as PaymentPrepareResult & { error?: string };
  if (!j?.payUrl || !j?.orderNumber) {
    throw new Error("bad response");
  }
  return {
    payUrl: j.payUrl,
    merchantOrderId: j.merchantOrderId,
    orderId: j.orderId,
    orderNumber: j.orderNumber,
  };
}

export function openPaymentUrl(payUrl: string): void {
  const w = window as unknown as {
    Telegram?: { WebApp?: { openLink: (u: string, o?: { try_instant_view?: boolean }) => void } };
  };
  const o = w.Telegram?.WebApp?.openLink;
  if (o) {
    o(payUrl, { try_instant_view: false });
    return;
  }
  window.open(payUrl, "_blank", "noopener,noreferrer");
}
