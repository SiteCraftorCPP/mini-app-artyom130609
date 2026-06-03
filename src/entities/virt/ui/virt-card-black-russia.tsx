import type { Virt } from "../model";

import {
  BR_VIRT_CARD_LEFT_WIDTH_PERCENT,
  BR_VIRT_CARD_OUTER_HEIGHT_PX,
  BR_VIRT_CARD_RIGHT_WIDTH_PERCENT,
  BR_VIRT_CARD_SEGMENT_HEIGHT_PX,
  BR_VIRT_CARD_SEGMENT_INSET_Y_PX,
  BR_VIRT_CARD_TITLE_CLASS,
  brVirtCardLogoCss,
} from "@/shared/constants/virt-card-black-russia";
import { cn } from "@/shared/utils";
import { Button } from "@/ui/button";

type VirtCardBlackRussiaProps = {
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
  virt: Virt;
};

export const VirtCardBlackRussia = ({
  className,
  virt,
  onClick,
  interactive = true,
}: VirtCardBlackRussiaProps) => {
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
      style={{ height: BR_VIRT_CARD_OUTER_HEIGHT_PX }}
    >
      {/* Figma: внешняя обводка #C75041 → #DB7160 */}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: "linear-gradient(90deg, #C75041 0%, #DB7160 100%)",
        }}
        aria-hidden
      />

      {/* Figma: левый Rectangle 86 — #FF0003 */}
      <span
        className="absolute left-0 rounded-l-full"
        style={{
          top: BR_VIRT_CARD_SEGMENT_INSET_Y_PX,
          width: `${BR_VIRT_CARD_LEFT_WIDTH_PERCENT}%`,
          height: BR_VIRT_CARD_SEGMENT_HEIGHT_PX,
          backgroundColor: "#FF0003",
        }}
        aria-hidden
      />

      {/* Figma: правый сегмент — #B50B0A */}
      <span
        className="absolute right-0 rounded-r-full"
        style={{
          top: BR_VIRT_CARD_SEGMENT_INSET_Y_PX,
          width: `${BR_VIRT_CARD_RIGHT_WIDTH_PERCENT}%`,
          height: BR_VIRT_CARD_SEGMENT_HEIGHT_PX,
          backgroundColor: "#B50B0A",
        }}
        aria-hidden
      />

      <span
        className="absolute z-[1] flex items-center justify-center"
        style={{
          left: 0,
          top: BR_VIRT_CARD_SEGMENT_INSET_Y_PX,
          width: `${BR_VIRT_CARD_LEFT_WIDTH_PERCENT}%`,
          height: BR_VIRT_CARD_SEGMENT_HEIGHT_PX,
        }}
      >
        <span className={BR_VIRT_CARD_TITLE_CLASS} style={{ fontWeight: 900 }}>
          {virt.name}
        </span>
      </span>

      {virt.logo ? (
        <span
          className="pointer-events-none absolute z-[2]"
          style={brVirtCardLogoCss()}
          aria-hidden
        >
          <img
            src={virt.logo}
            alt=""
            draggable={false}
            className="block size-full object-cover object-center"
          />
        </span>
      ) : null}
    </Button>
  );
};
