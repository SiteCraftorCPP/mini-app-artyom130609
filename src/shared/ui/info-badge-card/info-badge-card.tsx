import { type VariantProps, cva } from "class-variance-authority";
import type { ReactElement } from "react";

import { Card } from "@/ui/card";

import { cn } from "@/shared/utils";

const infoBadgeCardVariants = cva("border-none bg-transparent", {
  variants: {
    variant: {
      header: "h-10 w-fit max-w-full shrink-0 rounded-2xl",
      profile: "h-10 w-full rounded-2xl",
      /** Кошелёк в профиле: слева как у ID, справа — светлое поле (градиент в макете), не `app-highlight`. */
      profileWallet: "h-10 w-full rounded-2xl",
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
      profileWallet:
        "ml-1 grid h-full min-h-10 min-w-0 grid-cols-[auto_1fr] overflow-hidden rounded-md",
    },
  },
  defaultVariants: {
    variant: "header",
  },
});

const iconVariants = cva("flex items-center justify-center rounded-md px-2", {
  variants: {
    variant: {
      header: "-ml-1 tw-bg-gradient-home-action-primary",
      profile: "-ml-1 bg-background-card",
      profileWallet: "-ml-1 shrink-0 self-stretch bg-background-card px-2",
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
      profileWallet:
        "min-h-10 min-w-0 flex-1 self-stretch tw-bg-gradient-account-option px-3 text-left",
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
