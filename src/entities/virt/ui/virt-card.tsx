import type { Virt } from "../model";

import {
  VIRT_GRADIENT_CLASSES,
  VIRT_TEXT_GRADIENT_CLASSES,
} from "@/shared/constants/virt-gradients";
import { VIRT_PLAQUE_TITLE } from "@/shared/lib/plaque-title-class";
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
  const name = virt.name.trim();

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
          "relative flex w-full min-h-20 min-w-0 items-center rounded-full py-2",
          VIRT_GRADIENT_CLASSES[virt.gradientToken],
        )}
      >
        <AppText
          variant="primaryStrong"
          className={cn(
            "relative z-10 min-w-0 max-w-[58%] flex-1 items-center justify-center rounded-full px-2 py-2 md:max-w-[62%] md:px-4",
            VIRT_TEXT_GRADIENT_CLASSES[virt.gradientToken],
            VIRT_PLAQUE_TITLE,
          )}
        >
          {name}
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
            />
          ) : (
            getVirtInitials(virt.name)
          )}
        </span>
      </span>
    </Button>
  );
};
