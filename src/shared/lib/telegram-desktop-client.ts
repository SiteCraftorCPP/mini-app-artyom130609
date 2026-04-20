/**
 * «ПК-подобный» клиент Telegram: без большого верхнего отступа под системную шапку Mini App.
 *
 * Важно: окно Mini App на Telegram Desktop часто **узкое** (как телефон), поэтому нельзя
 * опираться только на `innerWidth >= 600` для platform `web` / `weba`.
 */

const MOBILE_PLATFORMS = new Set([
  "android",
  "android_x",
  "ios",
  "web_k",
]);

function isLikelyPhoneWebClient(): boolean {
  if (typeof navigator === "undefined" || typeof window === "undefined") {
    return false;
  }

  const ua = navigator.userAgent;

  // Типичный мобильный UA (Telegram Web в браузере на телефоне и т.п.)
  const mobileUa =
    /Android.*Mobile|iPhone|iPod|(?:^|[^a-zA-Z])Mobile(?:[^a-zA-Z]|$)/i.test(
      ua,
    ) && !/iPad/i.test(ua);

  const coarsePointer =
    window.matchMedia?.("(pointer: coarse)").matches === true;

  return mobileUa || coarsePointer;
}

export function isTelegramDesktopLikeClient(
  platform: string,
  _innerWidth: number,
): boolean {
  const p = platform.toLowerCase();

  if (MOBILE_PLATFORMS.has(p)) {
    return false;
  }

  if (p === "tdesktop" || p === "macos") {
    return true;
  }

  // web / weba / unknown / пусто: узкое окно на ПК даёт маленький innerWidth — отделяем по UA и pointer
  if (p === "web" || p === "weba" || p === "unknown" || p === "") {
    if (isLikelyPhoneWebClient()) {
      return false;
    }
    return true;
  }

  return true;
}
