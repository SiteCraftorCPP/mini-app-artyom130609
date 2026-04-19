import { VIRTS_ICONS } from "../constants/virt-icons";

import type { AccountPurchaseOption, Virt } from "@/entities/virt";

const ACCOUNT_LEVEL_PRICE_LIST = [
  10, 40, 100, 150, 200, 300, 400, 500, 600, 700, 800, 1000, 1200, 1400, 1500,
  1600, 1700, 1800,
] as const;

const ACCOUNT_LEVEL_OPTIONS: AccountPurchaseOption[] =
  ACCOUNT_LEVEL_PRICE_LIST.map((amountRub, index) => {
    const level = index + 1;

    return {
      amountRub,
      id: `level-${level}`,
      label: `${level} LVL`,
    };
  });

export const BUY_ACCOUNTS_MOCK: Virt[] = [
  {
    id: "black-russia",
    name: "Black Russia",
    slug: "black-russia",
    gradientToken: "red",
    logo: VIRTS_ICONS["black-russia"],
    serverLabel: "Сервер",
    serverOptions: ["1. №02 Green", "2. №05 Red", "3. №07 Blue"],
    accountNumber: "",
    amountRub: 0,
    amountVirts: 0,
    exchangeRate: 2,
    promoCode: "",
    minAmountRub: 100,
    accountLevelOptions: ACCOUNT_LEVEL_OPTIONS,
    accountVirtOptions: [
      { id: "virts-1kk", label: "1кк", amountRub: 900 },
      { id: "virts-5kk", label: "5кк", amountRub: 4200 },
    ],
  },
  {
    id: "matryoshka-rp",
    name: "Матрешка РП",
    slug: "matryoshka-rp",
    gradientToken: "purple",
    logo: VIRTS_ICONS["matryoshka-rp"],
    serverLabel: "Сервер",
    serverOptions: ["1. №02 Green", "2. №05 Red"],
    accountNumber: "",
    amountRub: 0,
    amountVirts: 0,
    exchangeRate: 2.2,
    promoCode: "",
    minAmountRub: 100,
    accountLevelOptions: ACCOUNT_LEVEL_OPTIONS,
    accountVirtOptions: [
      { id: "virts-1m", label: "1 000 000", amountRub: 850 },
      { id: "virts-1kk", label: "1кк", amountRub: 850 },
      { id: "virts-5kk", label: "5кк", amountRub: 3900 },
    ],
  },
  {
    id: "arizona-rp",
    name: "Arizona RP",
    slug: "arizona-rp",
    gradientToken: "blue",
    logo: VIRTS_ICONS["arizona-rp"],
    serverLabel: "Сервер",
    serverOptions: ["1. №02 Green", "2. №05 Red", "3. №10 Gold"],
    accountNumber: "",
    amountRub: 0,
    amountVirts: 0,
    exchangeRate: 1.9,
    promoCode: "",
    minAmountRub: 100,
    accountLevelOptions: ACCOUNT_LEVEL_OPTIONS,
    accountVirtOptions: [
      { id: "virts-1m", label: "1 000 000", amountRub: 950 },
      { id: "virts-1kk", label: "1кк", amountRub: 950 },
      { id: "virts-5kk", label: "5кк", amountRub: 4500 },
    ],
  },
  {
    id: "gta-v-rp",
    name: "GTA V RP",
    slug: "gta-v-rp",
    gradientToken: "yellow",
    logo: VIRTS_ICONS["gta-v-rp"],
    serverLabel: "Сервер",
    serverOptions: ["1. №02 Green", "2. №05 Red"],
    accountNumber: "",
    amountRub: 0,
    amountVirts: 0,
    exchangeRate: 2.4,
    promoCode: "",
    minAmountRub: 100,
    accountLevelOptions: ACCOUNT_LEVEL_OPTIONS,
    accountVirtOptions: [
      { id: "virts-1m", label: "1 000 000", amountRub: 1000 },
      { id: "virts-1kk", label: "1кк", amountRub: 1000 },
      { id: "virts-5kk", label: "5кк", amountRub: 4800 },
    ],
  },
  {
    id: "majestic-rp",
    name: "Majestic RP",
    slug: "majestic-rp",
    gradientToken: "pink",
    logo: VIRTS_ICONS["majestic-rp"],
    serverLabel: "Сервер",
    serverOptions: ["1. №02 Green", "2. №05 Red", "3. №08 White"],
    accountNumber: "",
    amountRub: 0,
    amountVirts: 0,
    exchangeRate: 2.7,
    promoCode: "",
    minAmountRub: 100,
    accountLevelOptions: ACCOUNT_LEVEL_OPTIONS,
    accountVirtOptions: [
      { id: "virts-1m", label: "1 000 000", amountRub: 1100 },
      { id: "virts-1kk", label: "1кк", amountRub: 1100 },
      { id: "virts-5kk", label: "5кк", amountRub: 5200 },
    ],
  },
  {
    id: "grand-mobile-rp",
    name: "Grand Mobile RP",
    slug: "grand-mobile-rp",
    gradientToken: "dark",
    logo: VIRTS_ICONS["grand-mobile-rp"],
    serverLabel: "Сервер",
    serverOptions: ["1. №02 Green", "2. №05 Red"],
    accountNumber: "",
    amountRub: 0,
    amountVirts: 0,
    exchangeRate: 3,
    promoCode: "",
    minAmountRub: 100,
    accountLevelOptions: ACCOUNT_LEVEL_OPTIONS,
    accountVirtOptions: [
      { id: "virts-1m", label: "1 000 000", amountRub: 1200 },
      { id: "virts-1kk", label: "1кк", amountRub: 1200 },
      { id: "virts-5kk", label: "5кк", amountRub: 5600 },
    ],
  },
];
