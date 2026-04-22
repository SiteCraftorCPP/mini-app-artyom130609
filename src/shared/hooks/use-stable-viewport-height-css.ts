import { useEffect } from "react";

const VAR_NAME = "--app-stable-vh-px";

type ViewportHandler = (payload: { isStateStable: boolean }) => void;

type TelegramWebAppApi = {
  viewportStableHeight: number;
  onEvent(type: "viewportChanged", handler: ViewportHandler): void;
  offEvent(type: "viewportChanged", handler: ViewportHandler): void;
};

function getTelegramWebApp(): TelegramWebAppApi | undefined {
  return (window as unknown as { Telegram?: { WebApp?: TelegramWebAppApi } })
    .Telegram?.WebApp;
}

/**
 * Снимок «стабильной» высоты: Telegram `viewportStableHeight` не уменьшается от клавиатуры,
 * поэтому fixed-попапы с height/top на базе `var(--app-stable-vh-px)` не смещаются.
 */
export function useStableViewportHeightCss() {
  useEffect(() => {
    const apply = () => {
      const tg = getTelegramWebApp();
      const h =
        tg && tg.viewportStableHeight > 0
          ? tg.viewportStableHeight
          : (window.visualViewport?.height ?? window.innerHeight);
      document.documentElement.style.setProperty(VAR_NAME, `${Math.round(h)}px`);
    };

    apply();
    const t1 = window.setTimeout(apply, 50);
    const t2 = window.setTimeout(apply, 200);
    const onOrient = () => window.setTimeout(apply, 400);
    window.addEventListener("orientationchange", onOrient);

    const onVp: ViewportHandler = () => apply();
    try {
      getTelegramWebApp()?.onEvent("viewportChanged", onVp);
    } catch {
      /* */
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("orientationchange", onOrient);
      try {
        getTelegramWebApp()?.offEvent("viewportChanged", onVp);
      } catch {
        /* */
      }
    };
  }, []);
}
