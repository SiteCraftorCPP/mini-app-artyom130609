import { Fragment, type HTMLAttributes } from "react";

import {
  APP_BACKGROUND_FRAME,
  APP_BACKGROUND_GLOWS,
  APP_BACKGROUND_NOISE,
} from "@/shared/constants/app-background";
import { APP_THEME } from "@/shared/constants/theme";

type BgLayoutProps = HTMLAttributes<HTMLDivElement>;

export const BgLayout = ({ children }: BgLayoutProps) => {
  return (
    <div
      data-theme={APP_THEME.defaultTheme}
      className="bg-app-background relative min-h-dvh"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 flex justify-center overflow-hidden blur-[0.05px]"
      >
        <div
          className="bg-app-background relative h-dvh w-full overflow-hidden"
          style={{
            height: `${APP_BACKGROUND_FRAME.height}px`,
          }}
        >
          <div
            className="absolute top-0 left-1/2 h-full"
            style={{
              transform: "translateX(-50%)",
              width: `${APP_BACKGROUND_FRAME.width}px`,
            }}
          >
            {APP_BACKGROUND_GLOWS.large.map((glow, index) => (
              <Fragment key={`large-${index}`}>
                <div
                  className="tw-bg-glow-large absolute z-0 rounded-full"
                  style={{
                    height: `${glow.height}px`,
                    left: `${glow.x}px`,
                    top: `${glow.y}px`,
                    width: `${glow.width}px`,
                  }}
                />
                <div
                  className="tw-bg-glow-noise-large absolute z-10 rounded-full opacity-80"
                  style={{
                    height: `${glow.height + APP_BACKGROUND_NOISE.largeGlowSpread * 2}px`,
                    left: `${glow.x - APP_BACKGROUND_NOISE.largeGlowSpread}px`,
                    top: `${glow.y - APP_BACKGROUND_NOISE.largeGlowSpread}px`,
                    width: `${glow.width + APP_BACKGROUND_NOISE.largeGlowSpread * 2}px`,
                  }}
                />
              </Fragment>
            ))}
            {APP_BACKGROUND_GLOWS.small.map((glow, index) => (
              <div
                key={`small-${index}`}
                className="tw-bg-glow-small absolute z-20 rounded-full"
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
      <div className="relative z-10 mx-auto flex h-dvh max-h-dvh min-h-0 w-full max-w-[var(--maxWidth)] flex-col gap-6 overflow-x-hidden px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top,0px))]">
        {children}
      </div>
    </div>
  );
};
