import { useInitData, useWebApp } from "@vkruglikov/react-telegram-web-app";

import { resolveWebAppInitDataString } from "@/shared/lib/resolve-webapp-init-data-string";

/** Подписанная строка `initData` (нужна для API бота). Сначала `useInitData`, затем WebApp / window. */
export function useWebAppInitDataString(): string {
  const [, initDataFromHook] = useInitData();
  const trimmed = initDataFromHook?.trim();
  if (trimmed) {
    return trimmed;
  }
  const webApp = useWebApp();
  return resolveWebAppInitDataString(webApp);
}
