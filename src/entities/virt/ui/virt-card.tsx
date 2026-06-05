import type { Virt } from "../model";

import {
  VIRT_GRADIENT_CLASSES,
  VIRT_TEXT_GRADIENT_CLASSES,
} from "@/shared/constants/virt-gradients";
import { cn } from "@/shared/utils";
import { AppText } from "@/ui/app-text";
import { Button } from "@/ui/button";

const getVirtInitials = (name: string) => {
  const [firstWord = "", secondWord = ""] = name.split(" ");

  return `${firstWord.charAt(0)}${secondWord.charAt(0)}`.trim() || "V";
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
      className={cn("tw-shadow-virt-card", className, {
        "cursor-default hover:cursor-default": !interactive,
      })}
    >
      <span
        className={cn(
          "relative flex h-20 w-full items-center overflow-hidden rounded-full",
          VIRT_GRADIENT_CLASSES[virt.gradientToken],
        )}
      >
        <AppText
          variant="primaryStrong"
          size="xxxl"
          className={cn(
            "relative z-10 flex h-full w-[60%] md:w-[66.5%] shrink-0 items-center justify-center truncate rounded-full px-3 md:px-5 text-center text-[19px] leading-none",
            VIRT_TEXT_GRADIENT_CLASSES[virt.gradientToken],
          )}
        >
          {virt.name}
        </AppText>
        <span
          className={cn(
            "pointer-events-none absolute top-1/2 right-[-6px] z-20 h-[100%] w-[100%] -translate-y-1/2",
            {
              "flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white":
                !virt.logo,
            },
          )}
        >
          {virt.logo ? (
            <img
              src={virt.logo}
              alt=""
              className="size-full object-contain object-right"
              width="100%"
              height="100%"
              loading="eager"
              decoding="sync"
            />
          ) : (
            getVirtInitials(virt.name)
          )}
        </span>
      </span>
    </Button>
  );
};
