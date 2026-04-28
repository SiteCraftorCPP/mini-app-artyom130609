export function resolveWebAppInitDataString(
  webApp: { initData?: string } | null | undefined,
): string {
  const fromHook = webApp?.initData?.trim();
  if (fromHook) {
    return fromHook;
  }
  if (typeof window !== "undefined") {
    const tg = (
      window as unknown as {
        Telegram?: { WebApp?: { initData?: string } };
      }
    ).Telegram?.WebApp;
    const raw = tg?.initData?.trim();
    if (raw) {
      return raw;
    }
  }
  return "";
}
