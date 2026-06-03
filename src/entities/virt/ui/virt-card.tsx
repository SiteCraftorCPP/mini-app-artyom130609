import type { Virt } from "../model";

import {
  VIRT_CARD_INNER_HEIGHT_PX,
  VIRT_CARD_INNER_INSET_Y_PX,
  VIRT_CARD_INNER_WIDTH_PERCENT,
  VIRT_CARD_OUTER_HEIGHT_PX,
  resolveVirtCardLogoStyle,
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
  const logo = resolveVirtCardLogoStyle(virt.slug);

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
      {/* Внешняя плашка: #C75041 → #DB7160 */}
      <span
        className="absolute inset-0 rounded-full"
        style={{ background: theme.outerGradient }}
        aria-hidden
      />

      {/* Левая капсула 223×81: #FF0003 → #B50B0A */}
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

      {/* Montserrat Black 900, 18px, center — Figma */}
      <span
        className="absolute left-[2px] z-[1] flex items-center justify-center"
        style={{
          top: VIRT_CARD_INNER_INSET_Y_PX,
          width: `${VIRT_CARD_INNER_WIDTH_PERCENT}%`,
          height: VIRT_CARD_INNER_HEIGHT_PX,
        }}
      >
        <span
          className="truncate px-4 text-center font-[Montserrat] text-[18px] font-black leading-none tracking-normal text-white"
          style={{ fontWeight: 900 }}
        >
          {virt.name}
        </span>
      </span>

      {virt.logo ? (
        <img
          src={virt.logo}
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none absolute z-[2] object-contain object-right"
          style={{
            width: logo.widthPx,
            height: logo.heightPx,
            right: logo.rightPx,
            top: logo.topPx != null ? `${logo.topPx}%` : "50%",
            transform: `translateY(-50%) rotate(${logo.rotateDeg}deg)`,
            transformOrigin: "center center",
          }}
        />
      ) : null}
    </Button>
  );
};
