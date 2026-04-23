import { type VariantProps, cva } from "class-variance-authority";
import type { ReactElement } from "react";

import { Card } from "@/ui/card";

import { cn } from "@/shared/utils";

const infoBadgeCardVariants = cva("border-none bg-transparent", {
  variants: {
    variant: {
      header: "h-10 w-fit max-w-full shrink-0 rounded-2xl",
      profile: "h-10 w-full rounded-2xl",
    },
  },
  defaultVariants: {
    variant: "header",
  },
});

const contentVariants = cva("grid h-full", {
  variants: {
    variant: {
      header: "ml-1 grid-cols-[auto_auto] rounded-md bg-surface-base",
      profile: "ml-1 grid-cols-[auto_1fr] rounded-md bg-app-highlight",
    },
  },
  defaultVariants: {
    variant: "header",
  },
});

const iconVariants = cva("flex shrink-0 items-center justify-center rounded-md px-2", {
  variants: {
    variant: {
      /** wallet.svg 28×24 — не растягивать на всю высоту h-10 (как в шапке визуально). */
      header:
        "-ml-1 min-h-0 self-center tw-bg-gradient-home-action-primary [&_svg]:block [&_svg]:h-6 [&_svg]:w-[28px] [&_svg]:max-h-6 [&_svg]:max-w-[28px] [&_svg]:shrink-0 [&_svg]:object-contain",
      profile: "-ml-1 bg-background-card",
    },
  },
  defaultVariants: {
    variant: "header",
  },
});

const infoVariants = cva("flex items-center", {
  variants: {
    variant: {
      header: "px-2",
      profile: "px-2",
    },
  },
  defaultVariants: {
    variant: "header",
  },
});

type InfoBadgeCardProps = {
  className?: string;
  icon: ReactElement;
  info: ReactElement;
} & VariantProps<typeof infoBadgeCardVariants>;

export const InfoBadgeCard = ({
  className,
  icon,
  info,
  variant,
}: InfoBadgeCardProps) => {
  return (
    <Card className={cn(infoBadgeCardVariants({ variant }), className)}>
      <div className={contentVariants({ variant })}>
        <div className={iconVariants({ variant })}>
          <span>{icon}</span>
        </div>
        <div className={cn(infoVariants({ variant }), "overflow-hidden")}>
          <span>{info}</span>
        </div>
      </div>
    </Card>
  );
};
