import {
  HOME_ACTION_GRADIENT_TOKEN,
  HOME_ACTIONS_TEXT,
} from "@/shared/constants/home-screen";

export const HOME_SCREEN_MOCK = {
  actions: [
    {
      id: "buy-virtual-currency",
      title: HOME_ACTIONS_TEXT.buyVirtualCurrency.title,
      description: HOME_ACTIONS_TEXT.buyVirtualCurrency.description,
      gradientToken: HOME_ACTION_GRADIENT_TOKEN.aqua,
      accent: HOME_ACTIONS_TEXT.buyVirtualCurrency.accent,
    },
    {
      id: "sell-virtual-currency",
      title: HOME_ACTIONS_TEXT.sellVirtualCurrency.title,
      description: HOME_ACTIONS_TEXT.sellVirtualCurrency.description,
      gradientToken: HOME_ACTION_GRADIENT_TOKEN.cyan,
      accent: HOME_ACTIONS_TEXT.sellVirtualCurrency.accent,
    },
    {
      id: "buy-account",
      title: HOME_ACTIONS_TEXT.buyAccount.title,
      description: HOME_ACTIONS_TEXT.buyAccount.description,
      gradientToken: HOME_ACTION_GRADIENT_TOKEN.mint,
      accent: HOME_ACTIONS_TEXT.buyAccount.accent,
    },
    {
      id: "services",
      title: HOME_ACTIONS_TEXT.services.title,
      description: HOME_ACTIONS_TEXT.services.description,
      gradientToken: HOME_ACTION_GRADIENT_TOKEN.green,
      accent: HOME_ACTIONS_TEXT.services.accent,
    },
  ],
} as const;
