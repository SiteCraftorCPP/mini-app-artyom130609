import { VIRTS_ICONS } from "@/shared/constants/virt-icons";

export type AccountOrderMock = {
  accountNumber: string;
  completedAt: string;
  game: string;
  id: string;
  logo: string;
  number: string;
  paidAt: string;
  price: number;
  promoCode: string;
  server: string;
  time: string;
  title: string;
  /** Админ: для списка `#id (Вирты) - @user` */
  categoryLabel?: string;
  /** Админ: заголовок «Детали заказа …» */
  publicOrderId?: string;
  telegramUserId?: string;
  telegramUsername?: string;
  openedAtLine?: string;
  transferMethod?: string;
  virtAmountLabel?: string;
  amountRub?: number;
  /** Счёт в банке (если отличается от accountNumber при отображении) */
  bankAccount?: string;
};

export const ACCOUNT_CURRENT_ORDERS_MOCK: AccountOrderMock[] = [
  {
    accountNumber: "1234567890",
    completedAt: "12:20",
    game: "Black Russia",
    id: "current-1",
    logo: VIRTS_ICONS["black-russia"],
    number: "Заказ №1",
    paidAt: "12:15",
    price: 0,
    promoCode: "ARTVS",
    server: "№02 Green",
    time: "12:00",
    title: "26.03.2026",
  },
];

/** Оплаченные заказы для админки (мок; позже — API). */
export const ACCOUNT_ADMIN_CURRENT_ORDERS_MOCK: AccountOrderMock[] = [
  {
    id: "72NN9IPP",
    publicOrderId: "72NN9IPP",
    number: "72NN9IPP",
    categoryLabel: "Вирты",
    telegramUsername: "artem22481",
    telegramUserId: "1944803821",
    game: "Black Russia",
    server: "2 (Green)",
    virtAmountLabel: "1.0 кк",
    transferMethod: "bank",
    bankAccount: "2828",
    accountNumber: "2828",
    amountRub: 1200,
    openedAtLine: "01.04 10:59",
    time: "10:59",
    title: "01.04",
    paidAt: "10:59",
    completedAt: "",
    logo: VIRTS_ICONS["black-russia"],
    promoCode: "",
    price: 0,
  },
  {
    id: "A1B2C3XY",
    publicOrderId: "A1B2C3XY",
    number: "A1B2C3XY",
    categoryLabel: "Вирты",
    telegramUsername: "buyer_demo",
    telegramUserId: "500000001",
    game: "Black Russia",
    server: "1 (Red)",
    virtAmountLabel: "0.5 кк",
    transferMethod: "card",
    bankAccount: "9000",
    accountNumber: "9000",
    amountRub: 650,
    openedAtLine: "02.04 14:20",
    time: "14:20",
    title: "02.04",
    paidAt: "14:18",
    completedAt: "",
    logo: VIRTS_ICONS["black-russia"],
    promoCode: "",
    price: 0,
  },
];

export const ACCOUNT_ORDER_HISTORY_MOCK: AccountOrderMock[] = Array.from(
  { length: 16 },
  (_, index) => ({
    accountNumber: "1234567890",
    completedAt: "12:20",
    game: "Black Russia",
    id: `history-${index + 1}`,
    logo: VIRTS_ICONS["black-russia"],
    number: `Заказ №${index + 1}`,
    paidAt: "12:15",
    price: 0,
    promoCode: "ARTVS",
    server: `№${index + 1} Green`,
    time: "12:00",
    title: "26.03.2026",
  }),
);
