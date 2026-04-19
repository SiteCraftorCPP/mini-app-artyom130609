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
        "tw-bg-gradient-home-card text-app-panel-foreground rounded-[16px]",
        glowClassNames[glow],
        className,
      )}
      {...props}
    />
  );

  if (!bordered) return content;

  return (
    <div
      className={cn(
        "tw-bg-gradient-card-border rounded-[16px] p-px w-[inherit]",
        classNameWrapper,
      )}
    >
      {content}
    </div>
  );
};
