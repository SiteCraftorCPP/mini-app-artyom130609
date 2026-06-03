import type { Virt } from "../model";

import {
  VIRT_CARD_INNER_HEIGHT_PX,
  VIRT_CARD_INNER_INSET_Y_PX,
  VIRT_CARD_INNER_WIDTH_PERCENT,
  VIRT_CARD_LOGO_CLASS,
  VIRT_CARD_OUTER_HEIGHT_PX,
  resolveVirtCardTheme,
} from "@/shared/constants/virt-card-theme";
import { cn } from "@/shared/utils";
import { Button } from "@/ui/button";

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
  const theme = resolveVirtCardTheme(virt.slug);

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
      style={{ height: VIRT_CARD_OUTER_HEIGHT_PX }}
    >
      {/* Тёмный фон всей плашки (#6D2222 и т.д.) — виден справа */}
      <span
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: theme.outer }}
        aria-hidden
      />

      {/* Яркая левая капсула 223×81 с градиентом (#FF0100 → #B50B0A) */}
      <span
        className="absolute left-[2px] rounded-full"
        style={{
          top: VIRT_CARD_INNER_INSET_Y_PX,
          width: `${VIRT_CARD_INNER_WIDTH_PERCENT}%`,
          height: VIRT_CARD_INNER_HEIGHT_PX,
          background: theme.innerGradient,
        }}
        aria-hidden
      />

      {/* Текст по центру капсулы */}
      <span
        className="absolute left-[2px] z-[1] flex items-center justify-center"
        style={{
          top: VIRT_CARD_INNER_INSET_Y_PX,
          width: `${VIRT_CARD_INNER_WIDTH_PERCENT}%`,
          height: VIRT_CARD_INNER_HEIGHT_PX,
        }}
      >
        <span className="truncate px-4 text-center text-[17px] font-bold leading-[24px] tracking-tight text-white">
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
            "pointer-events-none absolute top-1/2 right-0 z-[2] -translate-y-1/2 object-contain object-right",
            VIRT_CARD_LOGO_CLASS[virt.slug] ??
              "h-[110px] w-auto max-w-[105px] translate-x-[4px]",
          )}
        />
      ) : null}
    </Button>
  );
};
