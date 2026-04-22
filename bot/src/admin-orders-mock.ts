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

export function getAdminOrderById(id: string): AdminOrderRow | undefined {
  return ADMIN_ORDERS_MOCK.find((o) => o.id === id);
}
