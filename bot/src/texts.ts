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
export const BTN_BACK_TO_ADMIN = "🔙 В админ-панель";
export const BTN_BACK_TO_ORDER_LIST = "🔙 К списку заказов";
export const BTN_CONFIRM_VIRT = "✅ Подтвердить выдачу виртов";
export const BTN_COPY_ORDER_DATA = "📋 Скопировать данные";
export const PENDING_ORDERS_HEADER = "📦 Заказы, ожидающие выполнения:";
/** Сообщение при подтверждении (пока без бэка). */
export const MSG_CONFIRM_TODO = "Отметка «выдано» пока в разработке.";

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
