export const BASE_API_URL = import.meta.env.VITE_API_URL;
export const LINK_SHARED = `https://t.me/${import.meta.env.VITE_BOT_ADDRESS?.replace(/^@/, "") ?? ""}?start=`;
export const DEV_MODE = import.meta.env.DEV;
export const CHANEL_BUY = import.meta.env.VITE_CHANEL_BUY || "";

/**
 * Если в .env забыли VITE_BOT_ADDRESS при сборке — иначе ссылка «Продать» пустая
 * и href="#" оставляет пользователя в том же WebView (ощущение «открывается мини-аппа»).
 */
const SELL_FALLBACK_BOT_USERNAME = "MiniAppArtyom130609_BOT";

function isMiniAppSiteUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname === "artshopvirts.space" || u.hostname.endsWith(".artshopvirts.space");
  } catch {
    return false;
  }
}

/**
 * Ссылка для «Продать»: не ставь URL мини-аппа (откроется сайт, а не чат).
 * Если VITE_CHANEL_BUY пусто или ошибочно указывает на сайт — deep link в бота: ?start=sell.
 */
export function resolveSellVirtTelegramLink(): string {
  const custom = import.meta.env.VITE_CHANEL_BUY?.trim();
  if (custom && !isMiniAppSiteUrl(custom)) {
    return custom;
  }
  const bot =
    import.meta.env.VITE_BOT_ADDRESS?.replace(/^@/, "").trim() ||
    SELL_FALLBACK_BOT_USERNAME;
  return `https://t.me/${bot}?start=sell`;
}
export const SUPPORT_CHAT_URL = import.meta.env.VITE_SUPPORT_CHAT_URL || "";
export const EXTERNAL_LINKS = {
  channel: import.meta.env.VITE_CHANNEL_URL || "",
  contacts: import.meta.env.VITE_CONTACTS_URL || "",
  privacyPolicy: import.meta.env.VITE_PRIVACY_POLICY_URL || "",
  reviews: import.meta.env.VITE_REVIEWS_URL || "",
  support: SUPPORT_CHAT_URL,
  terms: import.meta.env.VITE_TERMS_URL || "",
} as const;
export const CURRENCY = {
  RUB: "RUB",
} as const;
