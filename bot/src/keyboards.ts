import { InlineKeyboard, Keyboard } from "grammy";

import { BTN_ABOUT, BTN_BACK, BTN_HOW_TO_ORDER, BTN_OPEN_SHOP } from "./texts.js";

export function mainMenuKeyboard(miniAppUrl: string) {
  return new Keyboard()
    .webApp(BTN_OPEN_SHOP, miniAppUrl)
    .row()
    .text(BTN_HOW_TO_ORDER)
    .row()
    .text(BTN_ABOUT)
    .resized()
    .persistent();
}

export function aboutBackKeyboard() {
  return new InlineKeyboard().text(BTN_BACK, "about:back");
}
