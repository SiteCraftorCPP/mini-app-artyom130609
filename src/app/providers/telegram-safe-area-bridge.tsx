import { useWebApp } from "@vkruglikov/react-telegram-web-app";
import { useEffect } from "react";

import { isTelegramDesktopLikeClient } from "@/shared/lib/telegram-desktop-client";

type Inset = { top: number; bottom: number; left: number; right: number };

type WebAppWithInsets = ReturnType<typeof useWebApp> & {
  safeAreaInset?: Inset;
  contentSafeAreaInset?: Inset;
};

/**
 * Пишет отступы из Telegram WebApp в CSS-переменные.
 * На ПК (tdesktop, macos, web/weba не на телефоне) — data-tg-desktop и нули сверху (см. index.css).
 */
export function TelegramSafeAreaBridge() {
  const webApp = useWebApp() as WebAppWithInsets;

  useEffect(() => {
    const root = document.documentElement;

    const setDesktopMode = () => {
      const desktop = isTelegramDesktopLikeClient(
        webApp.platform,
        window.innerWidth,
      );
      if (desktop) {
        root.setAttribute("data-tg-desktop", "true");
      } else {
        root.removeAttribute("data-tg-desktop");
      }
      return desktop;
    };

    const apply = () => {
      const desktop = setDesktopMode();

      if (desktop) {
        root.style.setProperty("--tg-safe-top", "0px");
        root.style.setProperty("--tg-safe-bottom", "0px");
        root.style.setProperty("--tg-safe-left", "0px");
        root.style.setProperty("--tg-safe-right", "0px");
        root.style.setProperty("--tg-content-top", "0px");
        root.style.setProperty("--tg-content-bottom", "0px");
        root.style.setProperty("--tg-content-left", "0px");
        root.style.setProperty("--tg-content-right", "0px");
      } else {
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
    window.addEventListener("resize", apply);

    return () => {
      webApp.offEvent("viewportChanged", onViewport);
      window.removeEventListener("resize", apply);
      root.removeAttribute("data-tg-desktop");
    };
  }, [webApp]);

  return null;
}
