import { InlineKeyboard } from "grammy";

import {
  BTN_ABOUT,
  BTN_BACK,
  BTN_HOW_TO_ORDER,
  BTN_HOW_TO_ORDER_MANAGER,
  BTN_OPEN_SHOP,
  LINK_ABOUT_CHANNEL,
  LINK_ABOUT_MANAGER,
  LINK_ABOUT_MEDIA,
  LINK_ABOUT_REVIEWS,
} from "./texts.js";

/** Инлайн-кнопки под баннером (как в макете). */
export function mainMenuInlineKeyboard(miniAppUrl: string) {
  return new InlineKeyboard()
    .webApp(BTN_OPEN_SHOP, miniAppUrl)
    .row()
    .text(BTN_HOW_TO_ORDER, "menu:how")
    .row()
    .text(BTN_ABOUT, "menu:about");
}

/** Под видео «Как оформить заказ». */
export function howToOrderManagerKeyboard() {
  return new InlineKeyboard().url(BTN_HOW_TO_ORDER_MANAGER, LINK_ABOUT_MANAGER);
}

/**
 * «О магазине»: ссылки (без web_app) + назад. Текст кнопок — label; URL в texts (LINK_ABOUT_*).
 */
export function aboutShopResourceKeyboard() {
  return new InlineKeyboard()
    .url("Telegram-канал", LINK_ABOUT_CHANNEL)
    .row()
    .url("Отзывы", LINK_ABOUT_REVIEWS)
    .row()
    .url("Менеджер", LINK_ABOUT_MANAGER)
    .row()
    .url("Медиа-сотрудничество", LINK_ABOUT_MEDIA)
    .row()
    .text(BTN_BACK, "about:back");
}
