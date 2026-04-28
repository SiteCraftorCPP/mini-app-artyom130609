/**
 * Незавершённый заказ: оплата FreeKassa ещё не подтверждена.
 * MERCHANT_ORDER_ID = то же, что `o` в pay.fk.money.
 * Хранилище пишется на диск — чтобы callback FK нашёл заказ после перезапуска бота.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE_PATH = resolve(__dirname, "../data/payment-pending.v1.json");

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

type FileShape = {
  v: 1;
  byMerchant: Record<string, PendingPaymentOrder>;
};

const byMerchant = new Map<string, PendingPaymentOrder>();

function loadFromDisk(): void {
  if (!existsSync(STORE_PATH)) {
    return;
  }
  try {
    const raw = readFileSync(STORE_PATH, "utf8");
    const j = JSON.parse(raw) as FileShape;
    if (j?.v !== 1 || typeof j.byMerchant !== "object" || j.byMerchant == null) {
      return;
    }
    for (const [k, v] of Object.entries(j.byMerchant)) {
      if (v && typeof v === "object") {
        byMerchant.set(k, v);
      }
    }
  } catch {
    /* ignore */
  }
}

function persistToDisk(): void {
  mkdirSync(dirname(STORE_PATH), { recursive: true });
  const payload: FileShape = {
    v: 1,
    byMerchant: Object.fromEntries(byMerchant),
  };
  writeFileSync(STORE_PATH, JSON.stringify(payload, null, 2), "utf8");
}

loadFromDisk();

/** intid FreeKassa — защита от повторных уведомлений */
const processedIntids = new Set<string>();

export function putPendingPayment(merchantId: string, o: PendingPaymentOrder) {
  byMerchant.set(merchantId, o);
  persistToDisk();
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
    persistToDisk();
  }
}

export function buildMerchantOrderId(): string {
  const t = Date.now();
  const r = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `A${t}${r}`;
}
