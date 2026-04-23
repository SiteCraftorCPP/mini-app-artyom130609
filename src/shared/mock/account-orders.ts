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
  /** Завершённый админ-заказ: время/дата закрытия (поиск по номеру). */
  closedAtLine?: string;
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

/** Завершённые оплаченные заказы (мок; поиск «Найти заказ» для админа). */
export const ACCOUNT_ADMIN_ORDER_ARCHIVE_MOCK: AccountOrderMock[] = [
  {
    id: "ZZ99CLOS",
    publicOrderId: "ZZ99CLOS",
    number: "ZZ99CLOS",
    categoryLabel: "Вирты",
    telegramUsername: "closed_demo",
    telegramUserId: "600000001",
    game: "Black Russia",
    server: "1 (Red)",
    virtAmountLabel: "0.2 кк",
    transferMethod: "bank",
    bankAccount: "1001",
    accountNumber: "1001",
    amountRub: 300,
    openedAtLine: "28.03 09:00",
    closedAtLine: "28.03 12:15",
    time: "09:00",
    title: "28.03",
    paidAt: "09:00",
    completedAt: "12:15",
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

const pad4 = (n: number) => String(n).padStart(4, "0");

/** Последние 50 админ-заказов (тот же набор, что в боте; позже — API). */
export const ACCOUNT_ADMIN_HISTORY_50_MOCK: AccountOrderMock[] = Array.from(
  { length: 50 },
  (_, i) => {
    const n = i + 1;
    const id = `H${pad4(n)}`;
    const isOpen = i % 7 === 0;
    const amountRub = 200 + (i % 10) * 100;
    return {
      id,
      publicOrderId: id,
      number: id,
      categoryLabel: "Вирты",
      telegramUsername: `client${(i % 20) + 1}`,
      telegramUserId: String(1_900_000_000 + i),
      game: "Black Russia",
      server: `${(i % 3) + 1} (Green)`,
      virtAmountLabel: `${(0.1 + (i % 5) * 0.1).toFixed(1)} кк`,
      transferMethod: i % 2 === 0 ? "bank" : "card",
      bankAccount: String(2_000 + i),
      accountNumber: String(2_000 + i),
      amountRub,
      openedAtLine: `${String((i % 28) + 1).padStart(2, "0")}.04.2026 10:00`,
      closedAtLine: isOpen
        ? undefined
        : `10.${String((i % 28) + 1).padStart(2, "0")} 12:00`,
      time: "10:00",
      title: "04.2026",
      paidAt: "09:30",
      completedAt: isOpen ? "" : "12:00",
      logo: VIRTS_ICONS["black-russia"],
      promoCode: "",
      price: 0,
    };
  },
);
