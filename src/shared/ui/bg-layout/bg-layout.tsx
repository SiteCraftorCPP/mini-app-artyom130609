import { type HTMLAttributes } from "react";

import { APP_BACKGROUND_FRAME, APP_BACKGROUND_GLOWS } from "@/shared/constants/app-background";
import { APP_THEME } from "@/shared/constants/theme";

type BgLayoutProps = HTMLAttributes<HTMLDivElement>;

/**
 * Базовый градиент + позиционированные «светящиеся» круги (как в макете).
 * Круги — только radial-gradient с rgba, без filter:blur / noise / color-mix (меньше «точек» в WebView).
 */
export const BgLayout = ({ children }: BgLayoutProps) => {
  return (
    <div
      data-theme={APP_THEME.defaultTheme}
      className="bg-app-background relative flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 flex justify-center overflow-hidden"
      >
        <div
          className="relative h-dvh w-full overflow-hidden"
          style={{
            height: `${APP_BACKGROUND_FRAME.height}px`,
          }}
        >
          <div
            className="absolute inset-0"
            style={{ background: "var(--app-background-gradient)" }}
          />
          <div
            className="absolute top-0 left-1/2 isolate h-full"
            style={{
              transform: "translateX(-50%)",
              width: `${APP_BACKGROUND_FRAME.width}px`,
            }}
          >
            {APP_BACKGROUND_GLOWS.large.map((glow, index) => (
              <div
                key={`large-${index}`}
                className="tw-bg-glow-large absolute z-0 rounded-full"
                style={{
                  height: `${glow.height}px`,
                  left: `${glow.x}px`,
                  top: `${glow.y}px`,
                  width: `${glow.width}px`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-[var(--maxWidth)] flex-1 flex-col gap-4 overflow-x-hidden px-4 pb-4 pt-[max(var(--app-telegram-top-clearance,120px),var(--tg-content-top,0px),var(--tg-safe-top,0px),env(safe-area-inset-top,0px))]">
        {children}
      </div>
    </div>
  );
};
