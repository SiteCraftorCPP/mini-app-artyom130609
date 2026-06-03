import type { Virt } from "../model";

import { VIRT_GRADIENT_CLASSES } from "@/shared/constants/virt-gradients";
import { cn } from "@/shared/utils";
import { Button } from "@/ui/button";

/** Позиция/масштаб логотипа справа — как в макете Figma (частично обрезан). */
const VIRT_LOGO_CLASS: Partial<Record<string, string>> = {
  "black-russia": "h-[122%] translate-x-[8%]",
  "matryoshka-rp": "h-[128%] translate-x-[4%]",
  "gta-v-rp": "h-[124%] translate-x-[10%]",
  "grand-mobile-rp": "h-[118%] translate-x-[2%]",
  "arizona-rp": "h-[120%] translate-x-[6%]",
  "majestic-rp": "h-[108%] translate-x-0",
  "province-rp": "h-[150%] translate-x-[12%]",
  "radmir-rp": "h-[122%] translate-x-[6%]",
  "amazing-rp": "h-[120%] translate-x-[8%]",
};

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
        className={cn("absolute inset-0", VIRT_GRADIENT_CLASSES[virt.gradientToken])}
        aria-hidden
      />
      <span
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_130%_at_6%_50%,rgba(0,0,0,0.42)_0%,transparent_58%)]"
        aria-hidden
      />
      <span className="relative z-[1] flex h-full min-w-0 flex-1 items-center pl-5 pr-[40%] sm:pl-6">
        <span className="truncate text-[15px] font-bold leading-tight tracking-tight text-white sm:text-[17px]">
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
            "pointer-events-none absolute top-1/2 right-0 z-[1] w-auto max-w-[46%] -translate-y-1/2 object-contain object-right",
            VIRT_LOGO_CLASS[virt.slug] ?? "h-[120%] translate-x-[6%]",
          )}
        />
      ) : null}
    </Button>
  );
};
