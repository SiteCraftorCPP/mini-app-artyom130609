/**
 * /start: custom emoji + жирный весь остальной текст (entities), либо WELCOME_HTML + parse_mode.
 * «О магазине» — 4 custom id; то же, либо ABOUT_SHOP_HTML.
 * Обычный текст без `parse_mode` / без MessageEntity **не** бывает жирным в Telegram.
 */
export const WELCOME_LINE_1 =
  "Добро пожаловать в ARTSHOPVIRTS — магазин виртов и услуг для самых популярных RP-проектов.";
export const WELCOME_LINE_2 = "Чтобы оформить заказ, нажмите открыть магазин";
export const WELCOME = [WELCOME_LINE_1, "", WELCOME_LINE_2].join("\n");

/** 4 абзаца «О магазине» — к началу каждой сроки в подписи custom-иконка (см. ABOUT_CUSTOM_EMOJI_ORDER). */
export const ABOUT_SHOP_LINES: readonly [string, string, string, string] = [
  "Продаём и скупаем вирты во всех RP-проектах, а также предоставляем полный спектр услуг.",
  "Гарантируем возврат части средств в случае блокировки аккаунта, связанной с нашим магазином.",
  "Работаем с 2024 года: более 1500 клиентов и 780 отзывов.",
  "Наши официальные ресурсы — по кнопкам ниже.",
];

/** Ссылки под «О магазине» (кнопки-URL + env при необходимости). */
export const LINK_ABOUT_CHANNEL = "https://t.me/artshopvirts_channel";
export const LINK_ABOUT_REVIEWS = "https://t.me/artshopvirts_channel/85";
export const LINK_ABOUT_MANAGER = "https://t.me/artshopvirts_man";
export const LINK_ABOUT_MEDIA = "https://t.me/artshopvirts_media";

export const ABOUT_SHOP = [
  ABOUT_SHOP_LINES[0],
  "",
  ABOUT_SHOP_LINES[1],
  "",
  ABOUT_SHOP_LINES[2],
  "",
  ABOUT_SHOP_LINES[3],
].join("\n");

export const BTN_OPEN_SHOP = "Открыть магазин";
/** Кнопка в поле ввода (setChatMenuButton → Web App) — тот же URL, что у MINI_APP_URL. */
export const BTN_MENU_SHOP = "Магазин";
export const BTN_HOW_TO_ORDER = "Как оформить заказ";
export const BTN_ABOUT = "О магазине";
export const BTN_BACK = "Назад";
export const BTN_ADMIN_MAIN = "Админ панель";
/** Главная кнопка: актуальные оплаченные заказы. */
export const BTN_ADMIN_CURRENT_ORDERS = "📦 Актуальные заказы";
/** Вторая кнопка главного меню админки. */
export const BTN_ADMIN_STATS = "💰 Статистика актуальных заказов";
/** Третья кнопка: поиск заказа по номеру (открытый и закрытый). */
export const BTN_ADMIN_FIND_ORDER = "🔍 Найти заказ";
/** Четвёртая: последние 50 (открытие с первой страницы). */
export const BTN_ADMIN_HISTORY_50 = "📋 История заказов";
/** Пятая: мок-статистика по периодам. */
export const BTN_ORDER_PERIOD_STATS = "Статистика заказов";
/** Шестая: сколько уникальных пользователей воспользовалось ботом. */
export const BTN_ADMIN_USER_STATS = "👥 Статистика пользователей";
/** Седьмая: рассылки по базе пользователей. */
export const BTN_ADMIN_BROADCASTS = "📣 Рассылка";
export const BTN_BROADCAST_BUY_VIRTS = "Открыть приложение";
export const BTN_BROADCAST_BACK = "🔙 Назад";
/** Восьмая: поставки. */
export const BTN_ADMIN_SUPPLIES = "📦 Поставки";
/** Каталог «Другие услуги» для мини-аппа. */
export const BTN_ADMIN_OTHER_SERVICES = "🛎 Другие услуги (каталог)";
export const BTN_SUPPLIES_NEW = "➕ Новая поставка";
export const BTN_SUPPLIES_ACTIVE = "🔥 Актуальная поставка";
export const BTN_SUPPLIES_HISTORY = "📜 История поставок";
export const BTN_SUPPLIES_STATS = "📊 Статистика поставок";
export const BTN_SUPPLIES_FINISH = "✅ Завершить поставку";
export const BTN_SUPPLIES_BACK = "🔙 Назад";
export const BTN_SUPPLIES_CANCEL_INPUT = "❌ Отмена";
export const BTN_BACK_TO_ADMIN = "🔙 В админ-панель";
export const BTN_BACK_TO_HISTORY_50 = "🔙 К списку (50)";
export const BTN_STAT_PERIOD_CHOOSE = "◀ К выбору периода";
export const BTN_BACK_TO_ORDER_LIST = "🔙 К списку заказов";
export const BTN_STATS_VIEW_ORDERS = "📦 Просмотреть заказы";
export const BTN_STATS_BACK = "🔙 Назад";
export const BTN_CONFIRM_VIRT = "✅ Подтвердить выдачу виртов";
export const BTN_COPY_ORDER_DATA = "📋 Скопировать данные";
export const PENDING_ORDERS_HEADER = "📦 Актуальные заказы";
export const STATS_HEADER = "💰 Сумма текущих заказов в рублях";

/** Кнопка в уведомлении о выполнении заказа (пост с отзывами). */
export const BTN_WRITE_REVIEW = "Написать отзыв";
export const REVIEW_POST_URL = "https://t.me/artshopvirts_channel/85";

const ORDER_COMPLETED_LINE_REVIEW =
  "Напишите отзыв — и к следующему заказу получите 200 000 бонусных виртов!";

export function buildOrderCompletedBuyerCaption(orderNumber: string, isAccount?: boolean, accountData?: string): string {
  const t = orderNumber.trim().replace(/^#+/, "");
  const ref = `#${t}`;
  if (isAccount && accountData) {
    return [
      `✅ Заказ ${ref} успешно выполнен!`,
      "",
      "✅ Данные для входа в аккаунт:",
      accountData,
      "",
      `🪙 ${ORDER_COMPLETED_LINE_REVIEW}`,
    ].join("\n");
  }
  return [
    `✅ Заказ ${ref} успешно выполнен!`,
    "",
    "✅ Вирты успешно зачислены на ваш банковский счёт.",
    "",
    `🪙 ${ORDER_COMPLETED_LINE_REVIEW}`,
  ].join("\n");
}

/** «Другие услуги»: выполнен — без строки «Данные для входа в аккаунт», только текст выдачи. */
export function buildOrderCompletedOtherServiceBuyerCaption(
  orderNumber: string,
  bodyText: string,
): string {
  const t = orderNumber.trim().replace(/^#+/, "");
  const ref = `#${t}`;
  const body = bodyText.trim();
  return [
    `✅ Заказ ${ref} успешно выполнен!`,
    "",
    body,
    "",
    `🪙 ${ORDER_COMPLETED_LINE_REVIEW}`,
  ].join("\n");
}

/** Текст строки про отзыв (без ведущего эмодзи) — для caption_entities. */
export function getOrderCompletedReviewLineText(): string {
  return ORDER_COMPLETED_LINE_REVIEW;
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** /start: без custom emoji в подписи — `parse_mode: "HTML"`, весь текст жирный. */
export const WELCOME_HTML = `<b>${escHtml(WELCOME)}</b>`;

/** «О магазине» без custom emoji: `parse_mode: "HTML"`, весь текст жирный. */
export const ABOUT_SHOP_HTML = `<b>${escHtml(ABOUT_SHOP)}</b>`;

function refFromOrderInput(orderNumber: string): string {
  const t = orderNumber.trim().replace(/^#+/, "");
  return `#${t}`;
}

/** Без custom emoji, с `parse_mode: "HTML"`. */
export function buildVirtOrderCaptionHtml(orderNumber: string): string {
  return `<b>${escHtml(plainVirtOrderCaption(orderNumber))}</b>`;
}

function plainVirtOrderCaption(orderNumber: string): string {
  const ref = refFromOrderInput(orderNumber);
  return [
    `✅ Заказ ${ref} успешно оформлен!`,
    "",
    "🕔 Срок выдачи: от 5 минут до 24 часов",
    "(среднее время — ~20 минут)",
    "",
    "После зачисления виртов на ваш счёт вы получите уведомление в этом чате.",
    "",
    "Чтобы узнать детали заказа, нажмите кнопку ниже 👇",
  ].join("\n");
}

export function buildAccountAppOrderCaptionHtml(orderNumber: string): string {
  return `<b>${escHtml(plainAccountAppOrderCaption(orderNumber))}</b>`;
}

function plainAccountAppOrderCaption(orderNumber: string): string {
  const ref = refFromOrderInput(orderNumber);
  return [
    `✅ Заказ ${ref} успешно оформлен!`,
    "",
    "🕔 Срок выдачи: от 5 минут до 24 часов",
    "(среднее время — ~20 минут)",
    "",
    "Информация по заказу будет отправлена в этот чат.",
    "",
    "Чтобы узнать детали заказа, нажмите кнопку ниже 👇",
  ].join("\n");
}

export function buildAccountManagerOrderCaptionHtml(orderNumber: string): string {
  return `<b>${escHtml(plainAccountManagerOrderCaption(orderNumber))}</b>`;
}

function plainAccountManagerOrderCaption(orderNumber: string): string {
  const ref = refFromOrderInput(orderNumber);
  return [
    `✅ Заказ ${ref} успешно оформлен!`,
    "",
    "Что нужно сделать:",
    "Скопируйте номер заказа и напишите менеджеру через кнопку ниже 👇",
  ].join("\n");
}

export function buildOrderCompletedBuyerCaptionHtml(
  orderNumber: string,
  isAccount?: boolean,
  accountData?: string,
): string {
  return `<b>${escHtml(buildOrderCompletedBuyerCaption(orderNumber, isAccount, accountData))}</b>`;
}

export function buildOrderCompletedOtherServiceBuyerCaptionHtml(
  orderNumber: string,
  bodyText: string,
): string {
  return `<b>${escHtml(buildOrderCompletedOtherServiceBuyerCaption(orderNumber, bodyText))}</b>`;
}

export function buildSellVirtCaptionHtml(orderRef: string): string {
  return `<b>${escHtml(buildSellVirtCaption(orderRef))}</b>`;
}
export const msgProfitPrompt = (orderId: string) => {
  const t = orderId.trim().replace(/^#+/, "");
  return `Введите чистую прибыль за заказ #${t} в RUB:`;
};
export const MSG_PROFIT_INVALID =
  "Введите число в рублях (например 1500 или 1500,50). Только цифры и разделитель.";
export const msgProfitSaved = (orderId: string, amount: string) => {
  const t = orderId.trim().replace(/^#+/, "");
  return `Чистая прибыль ${amount} RUB за заказ #${t} учтена.`;
};
export const MSG_PROFIT_CANCELLED = "Ввод прибыли отменён.";

export const BTN_CANCEL_PROFIT_INPUT = "❌ Отмена";

export const MSG_ORDER_LOOKUP_PROMPT = "Введите номер заказа:";
export const MSG_ORDER_NOT_FOUND = "Заказ с таким номером не найден. Проверьте ввод и попробуйте снова.";
export const MSG_ORDER_LOOKUP_CANCELLED = "Поиск отменён.";

export const STAT_PERIOD_TITLES = [
  "Статистика за день",
  "Статистика за месяц",
  "Статистика за год",
  "Статистика за определённый день",
  "Статистика за определённый месяц",
  "Статистика за определённый год",
  "За всё время",
  "За определённый период",
] as const;

export const HOW_TO_ORDER_INTRO = "Ознакомление: как оформить заказ";

/** Текст под custom emoji в «Как оформить заказ» (ему предшествует HOW_TO_ORDER_HELP_CUSTOM_EMOJI_ID). */
export const HOW_TO_ORDER_HELP_TEXT =
  "Есть трудности с оформлением заказа? Напишите менеджеру — кнопка ниже";

/** Склейка для HTML/фоллбэка без custom emoji. */
export const VIDEO_CAPTION = [HOW_TO_ORDER_INTRO, "", HOW_TO_ORDER_HELP_TEXT].join("\n");

/** Кнопка под видео «Как оформить заказ» (URL в LINK_ABOUT_MANAGER). */
export const BTN_HOW_TO_ORDER_MANAGER = "Написать менеджеру";
export const VIDEO_CAPTION_HTML = `<b>${escHtml(VIDEO_CAPTION)}</b>`;

/**
 * Подпись инлайн-кнопки (без @никнейма — он только в URL: MANAGER_TELEGRAM_URL / t.me/artshopvirts_man).
 */
export const BTN_WRITE_MANAGER = "Написать менеджеру";

/**
 * Сообщение о продаже виртов — в том же стиле, что «заказ оформлен» + кнопка к менеджеру.
 * @param orderRef — короткий номер (как JDHDH), с # или без
 */
export function buildSellVirtCaption(orderRef: string): string {
  const t = orderRef.trim();
  const n = t.startsWith("#") ? t : `#${t}`;
  return [
    `✅  Заказ ${n} успешно оформлен!`,
    "",
    "Что нужно сделать:",
    "Скопируйте номер заказа и напишите менеджеру через кнопку ниже 👇",
  ].join("\n");
}
