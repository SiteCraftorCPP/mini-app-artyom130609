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

const contentVariants = cva("grid h-full w-full min-w-0", {
  variants: {
    variant: {
      /* Кошелёк: ровно квадрат h-10, без растяжения; дальше — белое поле. */
      header:
        "ml-1 grid-cols-[2.5rem_minmax(0,1fr)] rounded-md bg-surface-base",
      profile: "ml-1 grid-cols-[auto_1fr] rounded-md bg-app-highlight",
    },
  },
  defaultVariants: {
    variant: "header",
  },
});

const iconVariants = cva(
  "flex shrink-0 items-center justify-center overflow-hidden rounded-md",
  {
    variants: {
      variant: {
        /* 2.5rem колонка = h-10; padding 6+6+28=40. SVG фикс 28×24 — preflight max-width:100% не тянет иконку. */
        header:
          "-ml-1 box-border w-full min-w-0 max-w-full px-1.5 tw-bg-gradient-home-action-primary [&>span]:inline-flex [&>span]:items-center [&>span]:justify-center [&>span]:[line-height:0] [&_svg]:!h-6 [&_svg]:!w-7 [&_svg]:!max-w-none [&_svg]:!shrink-0",
        profile: "-ml-1 px-2 bg-background-card",
      },
    },
    defaultVariants: {
      variant: "header",
    },
  },
);

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
