/**
 * TODO: подключить к API. Демо-заказы убраны — только данные, которые реально приходят с бэка/оплаты.
 */
export type AdminOrderRow = {
  id: string;
  publicOrderId: string;
  categoryLabel: string;
  telegramUsername: string;
  telegramUserId: string;
  game: string;
  server: string;
  virtAmountLabel: string;
  transferMethod: string;
  bankAccount: string;
  amountRub: number;
  openedAtLine: string;
  /** Для завершённых заказов (поиск по номеру). */
  closedAtLine?: string;
};

/** Актуальные оплаченные заказы (в выдачу). */
export const ADMIN_ORDERS_MOCK: AdminOrderRow[] = [];

/** Выполненные; те же поля, что у актуальных, плюс время закрытия. */
export const ADMIN_ORDERS_ARCHIVE: AdminOrderRow[] = [];

/** Последние N заказов для раздела «История 50» (после API — подписка на тот же источник). */
export const ADMIN_ORDERS_LAST_50: AdminOrderRow[] = [];

export const HISTORY_50_PAGE_SIZE = 8;

const ALL_ORDERS: AdminOrderRow[] = [
  ...ADMIN_ORDERS_MOCK,
  ...ADMIN_ORDERS_ARCHIVE,
  ...ADMIN_ORDERS_LAST_50,
];

export function getHistory50Slice(page: number): AdminOrderRow[] {
  const start = page * HISTORY_50_PAGE_SIZE;
  return ADMIN_ORDERS_LAST_50.slice(start, start + HISTORY_50_PAGE_SIZE);
}

export function getHistory50PageCount(): number {
  return Math.ceil(ADMIN_ORDERS_LAST_50.length / HISTORY_50_PAGE_SIZE);
}

export function normalizeOrderIdForLookup(s: string): string {
  return s.trim().replace(/^#+/, "");
}

export function getAdminOrderById(id: string): AdminOrderRow | undefined {
  const n = normalizeOrderIdForLookup(id);
  return (
    ALL_ORDERS.find((o) => o.id === n || o.publicOrderId === n) ?? undefined
  );
}
