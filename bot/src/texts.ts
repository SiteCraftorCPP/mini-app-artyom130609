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
export const BTN_BACK_TO_ADMIN = "🔙 В админ-панель";
export const BTN_BACK_TO_HISTORY_50 = "🔙 К списку (50)";
export const BTN_STAT_PERIOD_CHOOSE = "◀ К выбору периода";
export const BTN_BACK_TO_ORDER_LIST = "🔙 К списку заказов";
export const BTN_STATS_VIEW_ORDERS = "📦 Просмотреть заказы";
export const BTN_STATS_BACK = "🔙 Назад";
export const BTN_CONFIRM_VIRT = "✅ Подтвердить выдачу виртов";
export const BTN_COPY_ORDER_DATA = "📋 Скопировать данные";
export const PENDING_ORDERS_HEADER = "📦 Заказы, ожидающие выполнения:";
export const STATS_HEADER = "💰 Статистика актуальных заказов на выдачу:";
export const msgProfitPrompt = (orderId: string) =>
  `Введите чистую прибыль за заказ #${orderId} в RUB:`;
export const MSG_PROFIT_INVALID =
  "Введите число в рублях (например 1500 или 1500,50). Только цифры и разделитель.";
export const msgProfitSaved = (orderId: string, amount: string) =>
  `Чистая прибыль ${amount} RUB за заказ #${orderId} учтена.`;
export const MSG_PROFIT_CANCELLED = "Ввод прибыли отменён.";

export const BTN_CANCEL_PROFIT_INPUT = "❌ Отмена";

export const MSG_ORDER_LOOKUP_PROMPT = [
  "Введите номер заказа (как в уведомлении о заказе, можно с #).",
  "",
  "Покажем все данные по заказу. Если он уже выполнен — время закрытия тоже.",
  "",
  "Выйти из режима поиска — кнопка «В админ-панель» внизу.",
].join("\n");
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

export function buildOrderPeriodStatsMessage(periodIndex: number): string {
  const label =
    periodIndex >= 0 && periodIndex < STAT_PERIOD_TITLES.length
      ? STAT_PERIOD_TITLES[periodIndex]
      : "Период";
  const s = periodIndex + 1;
  const count = 3 + (s % 18);
  const totalRub = 12_000 + s * 1_241;
  return [
    `📊 ${label}`,
    "",
    "Сейчас — демо-цифры; после API здесь будут фактические данные.",
    "",
    `📦 Заказов: ${count}`,
    `💵 Оборот: ${totalRub.toFixed(2)} RUB`,
  ].join("\n");
}

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
