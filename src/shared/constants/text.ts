import { DEFAULT } from "@/shared/constants/default";

export const TEXT = {
  base: {
    empty: "Пусто",
  },
  buttons: {
    copyLink: "Скопировать ссылку",
    next: "Продолжить",
    out: "Вывести",
    save: "Сохранить",
    sell: "Продать",
    sendTelegram: "Отправить в Telegram",
  },
  errors: { errorGame: "Произошла ошибка" },
  notification: {
    copied: "Скопировано",
  },
  labels: {
    server: "Сервер",
  },
};

export const VIRT_FORM_TEXT = {
  accountNumberLabel: "Номер счета",
  accountNumberRequired: "Введите номер счета",
  amountRubLabel: "Сумма в рублях",
  amountRubRequired: "Введите сумму в рублях",
  amountVirtsHint: `${DEFAULT.MIN_AMOUNT_VIRT_LABEL}= ${DEFAULT.MIN_AMOUNT_VIRT_FULL_LABEL}`,
  amountVirtsLabel: "Сумма в виртах",
  amountVirtsRequired: "Введите сумму в виртах",
  exchangeRateHint: `${DEFAULT.MIN_AMOUNT_VIRT_LABEL} - ${DEFAULT.MIN_AMOUNT_RUB} руб`,
  minimumAmountPrefix: "от",
  minimumAmountShortTemplate: (amount: number) => `от ${amount}р*`,
  minimumAmountTemplate: (amount: number, currency: string) =>
    `Минимальная сумма ${amount} ${currency}`,
  paymentError: "Не удалось создать оплату",
  paymentSuccess: "Оплата успешно создана",
  promoCodeLabel: "Промокод",
  promoCodePlaceholder: "Введите промокод",
  serverRequired: "Выберите сервер",
  submit: "Оплатить",
  submitPending: "Загрузка...",
} as const;

export const VIRT_SELL_TEXT = {
  description:
    "Для того чтобы продать вирты нажмите на кнопку ниже, вас перебросит в чат с менеджером.",
  note: "Для экономии вашего и нашего времени пишите сразу одним сообщением какое количество и на каком сервере хотите продать вирты.",
} as const;

export const BUY_ACCOUNT_OPTIONS_TEXT = {
  byLevel: "По уровню",
  byVirts: "По виртам",
  byVirtsAmount: "По количеству виртов",
} as const;

export const INFO_PAGE_TEXT = {
  faqTitle: "Часто задаваемые вопросы:",
  pageTitle: "Информация",
  supportButton: "Задать вопрос",
} as const;

export const ACCOUNT_PAGE_TEXT = {
  contact: {
    channel: "Наш канал",
    contacts: "Контакты",
    privacyPolicy: "Политика конфиденциальности",
    reviews: "Отзывы",
    support: "Поддержка",
    terms: "Соглашение",
  },
  menu: {
    currentOrders: "Актуальные заказы",
    faq: "Часто задаваемые вопросы",
    orderHistory: "История заказов",
    referral: "Реферальная система",
    support: "Поддержка",
  },
  pageTitle: "Аккаунт",
  popup: {
    currentOrders:
      "Здесь появится список ваших актуальных заказов, когда они будут созданы.",
    orderHistory: "История заказов пока пуста.",
    referral:
      "Реферальная система скоро станет доступна. Следите за обновлениями.",
  },
  userIdLabel: "ID:",
} as const;
