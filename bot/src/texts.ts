/** Тексты как в ТЗ. Premium-кастомные эмодзи в Bot API — через entities + custom_emoji_id; здесь Unicode из макета. */

export const WELCOME = [
  "👋 Добро пожаловать в ARTSHOPVIRTS — магазин виртов и услуг для самых популярных RP-проектов.",
  "",
  "Чтобы оформить заказ, нажмите открыть магазин 👇",
].join("\n");

export const ABOUT_SHOP = [
  "🪙 Продаём и скупаем вирты во всех RP-проектах, а также предоставляем полный спектр услуг.",
  "",
  "⚡️Гарантируем возврат средств в случае блокировки аккаунта, связанной с нашим магазином.",
  "",
  "🍑 Работаем с 2024 года: более 1500 клиентов и 780 отзывов.",
  "",
  "⛓Наши официальные ссылки:",
  "",
  "✈️Telegram канал: @artshopvirts_chanel",
  "",
  "⭐️Отзывы: https://t.me/artshopvirts_chanel/85",
  "",
  "👥Менеджер: @artshopvirts_man",
  "",
  "🎓Медиа сотрудничество: @artshopvirts_media",
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

export function buildOrderCompletedBuyerCaption(orderNumber: string): string {
  const t = orderNumber.trim().replace(/^#+/, "");
  const ref = `#${t}`;
  return [
    `✅ Заказ ${ref} успешно выполнен!`,
    "",
    "💳 Вирты успешно зачислены на ваш банковский счёт.",
    "",
    "🪙 Напишите отзыв — и к следующему заказу получите 200 000 бонусных виртов!",
  ].join("\n");
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
