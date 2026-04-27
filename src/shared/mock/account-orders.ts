import { VIRTS_ICONS, type VirtProjectIconKey } from "@/shared/constants/virt-icons";

import {
  demoBuyerAt,
  demoOrderPublicId,
} from "@/shared/mock/order-demo-constants";

/** Порядок как в магазине; в моках истории идут по кругу. */
export const ORDER_MOCK_PROJECT_KEYS: VirtProjectIconKey[] = [
  "black-russia",
  "matryoshka-rp",
  "gta-v-rp",
  "majestic-rp",
  "arizona-rp",
  "radmir-rp",
  "province-rp",
  "amazing-rp",
  "grand-mobile-rp",
];

const GAME_NAME_BY_PROJECT: Record<VirtProjectIconKey, string> = {
  "black-russia": "Black Russia",
  "matryoshka-rp": "Матрешка РП",
  "gta-v-rp": "GTA V RP",
  "majestic-rp": "Majestic RP",
  "arizona-rp": "Arizona RP",
  "radmir-rp": "Radmir RP",
  "province-rp": "Province RP",
  "amazing-rp": "Amazing RP",
  "grand-mobile-rp": "Grand Mobile RP",
};

export type AccountOrderMock = {
  accountNumber: string;
  completedAt: string;
  game: string;
  id: string;
  /** URL иконки, если `projectKey` нет (например, от API). */
  logo: string;
  /** Ключ проекта — иконка из `VIRTS_ICONS`, как в магазине. */
  projectKey?: VirtProjectIconKey;
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
    projectKey: "black-russia",
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
    projectKey: "black-russia",
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
    game: "Arizona RP",
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
    projectKey: "arizona-rp",
    logo: VIRTS_ICONS["arizona-rp"],
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
    projectKey: "black-russia",
    logo: VIRTS_ICONS["black-russia"],
    promoCode: "",
    price: 0,
  },
];

/** Обычная «История» (16): номер как в уведомлении + покупатели из демо-пула. */
export const ACCOUNT_ORDER_HISTORY_MOCK: AccountOrderMock[] = Array.from(
  { length: 16 },
  (_, index) => {
    const b = demoBuyerAt(index + 50);
    const ref = demoOrderPublicId(300 + index);
    const pk = ORDER_MOCK_PROJECT_KEYS[index % ORDER_MOCK_PROJECT_KEYS.length]!;
    return {
      accountNumber: "1234567890",
      completedAt: "12:20",
      game: GAME_NAME_BY_PROJECT[pk],
      id: ref,
      publicOrderId: ref,
      number: ref,
      telegramUsername: b.telegramUsername,
      telegramUserId: b.telegramUserId,
      projectKey: pk,
      logo: VIRTS_ICONS[pk],
      paidAt: "12:15",
      price: 0,
      promoCode: "ARTVS",
      server: `№${index + 1} Green`,
      time: "12:00",
      title: "26.03.2026",
    };
  },
);

/** Последние 50 админ-заказов (тот же набор, что в боте; позже — API). */
export const ACCOUNT_ADMIN_HISTORY_50_MOCK: AccountOrderMock[] = Array.from(
  { length: 50 },
  (_, i) => {
    const b = demoBuyerAt(i);
    const id = demoOrderPublicId(i);
    const isOpen = i % 7 === 0;
    const amountRub = 200 + (i % 10) * 100;
    const pk = ORDER_MOCK_PROJECT_KEYS[i % ORDER_MOCK_PROJECT_KEYS.length]!;
    return {
      id,
      publicOrderId: id,
      number: id,
      categoryLabel: "Вирты",
      telegramUsername: b.telegramUsername,
      telegramUserId: b.telegramUserId,
      game: GAME_NAME_BY_PROJECT[pk],
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
      projectKey: pk,
      logo: VIRTS_ICONS[pk],
      promoCode: "",
      price: 0,
    };
  },
);
