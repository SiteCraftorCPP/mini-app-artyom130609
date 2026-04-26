import CardOne from "@/assets/icon/card-1.svg";
import CardTwo from "@/assets/icon/card-2.svg";
import CardThree from "@/assets/icon/card-3.svg";
import CardFour from "@/assets/icon/card-4.svg";

export const HOME_SCREEN_TEXT = {
  hero: {
    title: "ARTSHOP VIRTS",
    sectionTitle: "Главный экран",
  },
  popups: {
    ctaLabel: "Скоро будет доступно",
    close: "Закрыть",
    /** Сообщение в popup «Другие услуги» (список плашек ниже в коде закомментирован). */
    servicesBody:
      "Дополнительные сервисы (сопровождение, буст, поддержка) появятся здесь. Мы дорабатываем раздел — загляните позже.",
  },
} as const;

export const HOME_ACTIONS_TEXT = {
  buyVirtualCurrency: {
    title: "Купить вирты",
    description:
      "Подборка пакетов валюты откроется в popup-окне после подключения реальных данных.",
    accent: "currency",
  },
  sellVirtualCurrency: {
    title: "Продать вирты",
    description:
      "Здесь появится форма продажи виртуальной валюты с курсом и подтверждением заявки.",
    accent: "sale",
  },
  buyAccount: {
    title: "Купить аккаунт",
    description:
      "Popup покажет доступные аккаунты, фильтры и быстрый переход к оформлению покупки.",
    accent: "account",
  },
  services: {
    title: "Другие услуги",
    description:
      "Внутри popup будут дополнительные сервисы: буст, сопровождение сделки и поддержка.",
    accent: "services",
  },
} as const;

export const HOME_ACTION_GRADIENT_TOKEN = {
  aqua: "aqua",
  cyan: "cyan",
  green: "green",
  mint: "mint",
} as const;

export const HOME_ACTION_GRADIENTS = {
  [HOME_ACTION_GRADIENT_TOKEN.aqua]: "tw-bg-gradient-home-action-primary",
  [HOME_ACTION_GRADIENT_TOKEN.mint]: "tw-bg-gradient-home-action-secondary",
  [HOME_ACTION_GRADIENT_TOKEN.green]: "tw-bg-gradient-home-action-tertiary",
  [HOME_ACTION_GRADIENT_TOKEN.cyan]: "tw-bg-gradient-home-action-quaternary",
} as const;

export const HOME_ACTION_ICON = {
  account: <CardThree className="size-fit" />,
  currency: <CardOne className="size-fit" />,
  sale: <CardTwo className="size-fit" />,
  services: <CardFour className="size-fit" />,
} as const;
