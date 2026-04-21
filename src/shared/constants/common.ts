export const BASE_API_URL = import.meta.env.VITE_API_URL;
export const LINK_SHARED = `https://t.me/${import.meta.env.VITE_BOT_ADDRESS?.replace(/^@/, "") ?? ""}?start=`;
export const DEV_MODE = import.meta.env.DEV;
export const CHANEL_BUY = import.meta.env.VITE_CHANEL_BUY || "";

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
