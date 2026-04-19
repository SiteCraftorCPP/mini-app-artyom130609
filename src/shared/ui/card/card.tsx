import type { HTMLAttributes } from "react";

import { cn } from "@/shared/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  glow?: "none" | "soft" | "strong";
  bordered?: boolean;
  classNameWrapper?: string;
};

const glowClassNames = {
  none: "",
  soft: "shadow-[0_8px_20px_var(--app-shadow)]",
  strong: "shadow-[0_18px_50px_var(--app-shadow)]",
} as const;

export const Card = ({
  className,
  classNameWrapper,
  glow = "soft",
  bordered = false,
  ...props
}: CardProps) => {
  const content = (
    <div
      className={cn(
        "tw-bg-gradient-home-card text-app-panel-foreground overflow-hidden",
        !bordered && "rounded-[16px]",
        glowClassNames[glow],
        className,
        /* На 1px меньше внешнего радиуса из-за p-px у обводки — иначе в углах «квадрат» */
        bordered && "rounded-[15px]",
      )}
      {...props}
    />
  );

  if (!bordered) return content;

  return (
    <div
      className={cn(
        "tw-bg-gradient-card-border w-[inherit] overflow-hidden p-px",
        classNameWrapper ?? "rounded-[16px]",
      )}
    >
      {content}
    </div>
  );
};
