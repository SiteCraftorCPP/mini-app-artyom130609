import { useWebApp } from "@vkruglikov/react-telegram-web-app";
import { useEffect } from "react";

type Inset = { top: number; bottom: number; left: number; right: number };

type WebAppWithInsets = ReturnType<typeof useWebApp> & {
  safeAreaInset?: Inset;
  contentSafeAreaInset?: Inset;
};

/**
 * Пишет отступы из Telegram WebApp в CSS-переменные (env(safe-area) в WebView часто нули).
 */
export function TelegramSafeAreaBridge() {
  const webApp = useWebApp() as WebAppWithInsets;

  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      const s = webApp.safeAreaInset;
      const c = webApp.contentSafeAreaInset;

      if (s) {
        root.style.setProperty("--tg-safe-top", `${s.top}px`);
        root.style.setProperty("--tg-safe-bottom", `${s.bottom}px`);
        root.style.setProperty("--tg-safe-left", `${s.left}px`);
        root.style.setProperty("--tg-safe-right", `${s.right}px`);
      }
      if (c) {
        root.style.setProperty("--tg-content-top", `${c.top}px`);
        root.style.setProperty("--tg-content-bottom", `${c.bottom}px`);
        root.style.setProperty("--tg-content-left", `${c.left}px`);
        root.style.setProperty("--tg-content-right", `${c.right}px`);
      }

      const vh = webApp.viewportStableHeight;
      if (typeof vh === "number" && vh > 0) {
        root.style.setProperty("--tg-viewport-stable-height", `${vh}px`);
      }
    };

    webApp.ready();
    apply();

    const onViewport = () => apply();
    webApp.onEvent("viewportChanged", onViewport);

    return () => {
      webApp.offEvent("viewportChanged", onViewport);
    };
  }, [webApp]);

  return null;
}
