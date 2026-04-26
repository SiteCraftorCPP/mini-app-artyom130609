/**
 * /start: в подписи к баннеру — custom id «рука» / «указатель» + `bold` в entities, либо WELCOME_HTML + parse_mode.
 * «О магазине» — 4 custom id; жирные строки/подписи ссылок через `bold` в entities, либо ABOUT_SHOP_HTML.
 * Обычный текст без `parse_mode` / без MessageEntity **не** бывает жирным в Telegram.
 */
export const WELCOME_LINE_1 =
  "Добро пожаловать в ARTSHOPVIRTS — магазин виртов и услуг для самых популярных RP-проектов.";
export const WELCOME_LINE_2 = "Чтобы оформить заказ, нажмите открыть магазин";
export const WELCOME = [WELCOME_LINE_1, "", WELCOME_LINE_2].join("\n");

/** /start: без custom emoji в подписи — `parse_mode: "HTML"`. */
export const WELCOME_LINE_1_HTML = `Добро пожаловать в <b>ARTSHOPVIRTS</b> — магазин виртов и услуг для самых популярных RP-проектов.`;
export const WELCOME_LINE_2_HTML = `<b>Чтобы оформить заказ, нажмите открыть магазин</b>`;
export const WELCOME_HTML = [WELCOME_LINE_1_HTML, "", WELCOME_LINE_2_HTML].join("\n");

/** 4 абзаца «О магазине» — к каждому в подписи своя custom-иконка. */
export const ABOUT_SHOP_LINES: readonly [string, string, string, string] = [
  "Продаём и скупаем вирты во всех RP-проектах, а также предоставляем полный спектр услуг.",
  "Гарантируем возврат средств в случае блокировки аккаунта, связанной с нашим магазином.",
  "Работаем с 2024 года: более 1500 клиентов и 780 отзывов.",
  [
    "Наши официальные ссылки:",
    "Telegram канал: @artshopvirts_channel",
    "Отзывы: https://t.me/artshopvirts_channel/85",
    "Менеджер: @artshopvirts_man",
    "MEDIA-сотрудничество: @artshopvirts_media",
  ].join("\n"),
];

export const ABOUT_SHOP = [
  ABOUT_SHOP_LINES[0],
  "",
  ABOUT_SHOP_LINES[1],
  "",
  ABOUT_SHOP_LINES[2],
  "",
  ABOUT_SHOP_LINES[3],
].join("\n");

const ABOUT_SHOP_FOURTH_BLOCK_HTML = [
  "<b>Наши официальные ссылки:</b>",
  "<b>Telegram канал:</b> @artshopvirts_channel",
  "<b>Отзывы:</b> https://t.me/artshopvirts_channel/85",
  "<b>Менеджер:</b> @artshopvirts_man",
  "<b>MEDIA-сотрудничество:</b> @artshopvirts_media",
].join("\n");

/** «О магазине» без custom emoji: `parse_mode: "HTML"`. */
export const ABOUT_SHOP_HTML = [
  `<b>${ABOUT_SHOP_LINES[0]}</b>`,
  "",
  `<b>${ABOUT_SHOP_LINES[1]}</b>`,
  "",
  `<b>${ABOUT_SHOP_LINES[2]}</b>`,
  "",
  ABOUT_SHOP_FOURTH_BLOCK_HTML,
].join("\n");

export const BTN_OPEN_SHOP = "🟢 Открыть магазин";
export const BTN_HOW_TO_ORDER = "🔴 Как оформить заказ";
export const BTN_ABOUT = "🔵 О магазине";
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
export const BTN_BROADCAST_BUY_VIRTS = "🟢 Открыть приложение";
export const BTN_BROADCAST_BACK = "🔙 Назад";
/** Восьмая: поставки. */
export const BTN_ADMIN_SUPPLIES = "📦 Поставки";
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
export const BTN_WRITE_REVIEW = "🟢 Написать отзыв";
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

/** Текст строки про отзыв (без ведущего эмодзи) — для caption_entities. */
export function getOrderCompletedReviewLineText(): string {
  return ORDER_COMPLETED_LINE_REVIEW;
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

export const VIDEO_CAPTION = "Ознакомление: как оформить заказ";

/**
 * Подпись инлайн-кнопки (без @никнейма — он только в URL: MANAGER_TELEGRAM_URL / t.me/artshopvirts_man).
 */
export const BTN_WRITE_MANAGER = "🟢 Написать менеджеру";

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
