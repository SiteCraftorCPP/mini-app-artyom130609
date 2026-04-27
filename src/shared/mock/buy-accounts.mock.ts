import { BLACK_RUSSIA_SERVER_OPTIONS } from "../constants/servers-black-russia";
import { VIRTS_ICONS } from "../constants/virt-icons";

import type { Virt } from "@/entities/virt";

const ACCOUNT_LEVEL_PRICE_LIST = [
  10, 40, 100, 150, 200, 300, 400, 500, 600, 700, 800, 1000, 1200, 1400, 1500,
  1600, 1700, 1800,
] as const;

const ACCOUNT_LEVEL_OPTIONS = ACCOUNT_LEVEL_PRICE_LIST.map((amountRub, index) => {
  const level = index + 1;
  return {
    amountRub,
    id: `level-${level}`,
    label: `${level} LVL`,
  };
});

/** Только Black Russia: «Купить аккаунт» / «по виртам» с произвольным кк. */
export const BUY_ACCOUNTS_MOCK: Virt[] = [
  {
    id: "black-russia",
    name: "Black Russia",
    slug: "black-russia",
    gradientToken: "red",
    logo: VIRTS_ICONS["black-russia"],
    serverLabel: "Сервер",
    serverOptions: [...BLACK_RUSSIA_SERVER_OPTIONS],
    accountNumber: "",
    amountRub: 0,
    amountVirts: 0,
    exchangeRate: 2,
    promoCode: "",
    minAmountRub: 100,
    accountLevelOptions: ACCOUNT_LEVEL_OPTIONS,
    accountVirtsCustomPricing: {
      rubPerKk: 100,
      accountFeeRub: 100,
    },
  },
];
