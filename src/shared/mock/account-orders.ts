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
