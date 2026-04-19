import { type HTMLAttributes } from "react";

import { APP_THEME } from "@/shared/constants/theme";

type BgLayoutProps = HTMLAttributes<HTMLDivElement>;

/**
 * Фон — один CSS-градиент (`--app-background-gradient`), без кругов/blur/noise:
 * наложения и filter: blur() в Telegram WebView давали «песок» и точки.
 */
export const BgLayout = ({ children }: BgLayoutProps) => {
  return (
    <div
      data-theme={APP_THEME.defaultTheme}
      className="bg-app-background relative flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: "var(--app-background-gradient)" }}
      />
      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-[var(--maxWidth)] flex-1 flex-col gap-6 overflow-x-hidden px-4 pb-4 pt-[max(var(--app-telegram-top-clearance,120px),var(--tg-content-top,0px),var(--tg-safe-top,0px),env(safe-area-inset-top,0px))]">
        {children}
      </div>
    </div>
  );
};
