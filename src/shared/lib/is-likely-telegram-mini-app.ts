/** Есть контекст Telegram Mini App (не «голый» браузер). */
export function isLikelyTelegramMiniApp(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const tg = (
    window as unknown as {
      Telegram?: { WebApp?: { initData?: string; initDataUnsafe?: { user?: unknown } } };
    }
  ).Telegram?.WebApp;
  if (!tg) {
    return false;
  }
  return Boolean(tg.initData?.trim() || tg.initDataUnsafe?.user != null);
}
