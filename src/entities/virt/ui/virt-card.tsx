import type { Virt } from "../model";

import {
  VIRT_CARD_LOGO_CLASS,
  VIRT_CARD_TEXT_PANEL_WIDTH,
  resolveVirtCardGradient,
} from "@/shared/constants/virt-card-theme";
import { cn } from "@/shared/utils";
import { Button } from "@/ui/button";

/** Высота плашки из Figma: 336 × 85.63 */
const VIRT_CARD_HEIGHT_PX = 85.63;

type VirtCardProps = {
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
  virt: Virt;
};

export const VirtCard = ({
  className,
  virt,
  onClick,
  interactive = true,
}: VirtCardProps) => {
  const { from, to } = resolveVirtCardGradient(virt.slug);
  const textPanelWidth = VIRT_CARD_TEXT_PANEL_WIDTH[virt.slug] ?? "64%";

  return (
    <Button
      type="button"
      variant="virtCard"
      size="virtCard"
      onClick={onClick}
      disabled={interactive && !onClick}
      className={cn(className, {
        "cursor-default hover:cursor-default": !interactive,
      })}
      style={{ height: VIRT_CARD_HEIGHT_PX }}
    >
      {/* Правая зона — яркий цвет (без градиента) */}
      <span
        className="absolute inset-0"
        style={{ backgroundColor: to }}
        aria-hidden
      />
      {/* Левая «капсула» под текст — тёмный цвет, как в Figma */}
      <span
        className="absolute top-0 bottom-0 left-0 rounded-full"
        style={{
          backgroundColor: from,
          width: textPanelWidth,
        }}
        aria-hidden
      />
      <span
        className="relative z-[1] flex h-full shrink-0 items-center justify-start"
        style={{ width: textPanelWidth }}
      >
        <span className="truncate px-5 text-[17px] font-bold leading-none tracking-tight text-white">
          {virt.name}
        </span>
      </span>
      {virt.logo ? (
        <img
          src={virt.logo}
          alt=""
          aria-hidden
          draggable={false}
          className={cn(
            "pointer-events-none absolute top-1/2 right-0 z-[1] -translate-y-1/2 object-contain object-right",
            VIRT_CARD_LOGO_CLASS[virt.slug] ??
              "h-[112%] w-auto max-w-[46%]",
          )}
        />
      ) : null}
    </Button>
  );
};
