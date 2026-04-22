import { InlineKeyboard } from "grammy";

import {
  BTN_ABOUT,
  BTN_ADMIN_PANEL,
  BTN_BACK,
  BTN_HOW_TO_ORDER,
  BTN_OPEN_SHOP,
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

export function aboutBackKeyboard() {
  return new InlineKeyboard().text(BTN_BACK, "about:back");
}

export function adminPanelKeyboard(miniAppUrl: string) {
  return new InlineKeyboard().webApp(
    BTN_ADMIN_PANEL,
    `${miniAppUrl.replace(/\/+$/, "")}/profile?open=currentOrders`,
  );
}
