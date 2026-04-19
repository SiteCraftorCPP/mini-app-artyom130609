import type { Virt } from "../model";

import { VIRT_GRADIENT_CLASSES } from "@/shared/constants/virt-gradients";
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
          "m-px flex w-full items-center gap-3 rounded-[10px] px-3 py-4",
          VIRT_GRADIENT_CLASSES[virt.gradientToken],
        )}
      >
        <span
          className={cn(
            "size-15",
            {
              "flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white":
                !virt.logo,
            },
          )}
        >
          {virt.logo ? (
            <img
              src={virt.logo}
              alt=""
              className="size-full object-cover"
              width="100%"
              height="100%"
            />
          ) : (
            getVirtInitials(virt.name)
          )}
        </span>
        <AppText variant="primaryStrong" size="xxxl">
          {virt.name}
        </AppText>
      </span>
    </Button>
  );
};
