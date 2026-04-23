import { demoBuyerAt, demoOrderPublicId } from "./order-demo-constants.js";

/**
 * TODO: подключить к API. Пока тот же набор, что в моке мини-аппа.
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

export const ADMIN_ORDERS_MOCK: AdminOrderRow[] = [
  {
    id: "72NN9IPP",
    publicOrderId: "72NN9IPP",
    categoryLabel: "Вирты",
    telegramUsername: "artem22481",
    telegramUserId: "1944803821",
    game: "Black Russia",
    server: "2 (Green)",
    virtAmountLabel: "1.0 кк",
    transferMethod: "bank",
    bankAccount: "2828",
    amountRub: 1200,
    openedAtLine: "01.04 10:59",
  },
  {
    id: "A1B2C3XY",
    publicOrderId: "A1B2C3XY",
    categoryLabel: "Вирты",
    telegramUsername: "buyer_demo",
    telegramUserId: "500000001",
    game: "Black Russia",
    server: "1 (Red)",
    virtAmountLabel: "0.5 кк",
    transferMethod: "card",
    bankAccount: "9000",
    amountRub: 650,
    openedAtLine: "02.04 14:20",
  },
];

/** Выполненные; те же поля, что у актуальных, плюс время закрытия. */
export const ADMIN_ORDERS_ARCHIVE: AdminOrderRow[] = [
  {
    id: "ZZ99CLOS",
    publicOrderId: "ZZ99CLOS",
    categoryLabel: "Вирты",
    telegramUsername: "closed_demo",
    telegramUserId: "600000001",
    game: "Black Russia",
    server: "1 (Red)",
    virtAmountLabel: "0.2 кк",
    transferMethod: "bank",
    bankAccount: "1001",
    amountRub: 300,
    openedAtLine: "28.03 09:00",
    closedAtLine: "28.03 12:15",
  },
];

/** Последние 50 (как в мини-апе: рефы и ники из демо-пула; позже — API). */
export const ADMIN_ORDERS_LAST_50: AdminOrderRow[] = Array.from(
  { length: 50 },
  (_, i) => {
    const b = demoBuyerAt(i);
    const id = demoOrderPublicId(i);
    const isOpen = i % 7 === 0;
    const amountRub = 200 + (i % 10) * 100;
    return {
      id,
      publicOrderId: id,
      categoryLabel: "Вирты",
      telegramUsername: b.telegramUsername,
      telegramUserId: b.telegramUserId,
      game: "Black Russia",
      server: `${(i % 3) + 1} (Green)`,
      virtAmountLabel: `${(0.1 + (i % 5) * 0.1).toFixed(1)} кк`,
      transferMethod: i % 2 === 0 ? "bank" : "card",
      bankAccount: String(2_000 + i),
      amountRub,
      openedAtLine: `${String((i % 28) + 1).padStart(2, "0")}.04.2026 10:00`,
      closedAtLine: isOpen
        ? undefined
        : `10.${String((i % 28) + 1).padStart(2, "0")} 12:00`,
    };
  },
);

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
