import type { Virt } from "../model";

import {
  VIRT_CARD_LOGO_CLASS,
  resolveVirtCardGradient,
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
  const { from, to } = resolveVirtCardGradient(virt.slug);

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
    >
      <span
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, ${from} 0%, ${to} 100%)`,
        }}
        aria-hidden
      />
      {/* Тёмный круг слева под текст — как в Figma */}
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 72% 130% at 10% 50%, ${from} 0%, transparent 58%)`,
        }}
        aria-hidden
      />
      {/* Светлое пятно справа под логотип */}
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 68% 120% at 90% 50%, ${to} 0%, transparent 62%)`,
        }}
        aria-hidden
      />
      <span className="relative z-[1] flex h-full min-w-0 flex-1 items-center pl-[18px] pr-[42%] sm:pl-5">
        <span
          className="truncate text-[15px] font-bold leading-tight tracking-tight text-white sm:text-[17px]"
          style={{ textShadow: "0 1px 3px rgba(0,0,0,0.28)" }}
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
          className={cn(
            "pointer-events-none absolute top-1/2 right-0 z-[1] w-auto -translate-y-1/2 object-contain object-right",
            VIRT_CARD_LOGO_CLASS[virt.slug] ??
              "h-[132%] max-w-[48%] translate-x-[10%]",
          )}
        />
      ) : null}
    </Button>
  );
};
