import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/shared/utils";

const buttonVariants = cva(
  "hover:cursor-pointer inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all outline-none disabled:pointer-events-none disabled:opacity-50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0  dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        accountMenu:
          "tw-bg-gradient-badge-background w-full justify-start rounded-[16px] border  text-white shadow-[0_8px_20px_var(--app-shadow)] hover:brightness-110",
        brand:
          "tw-bg-gradient-home-action-primary text-app-highlight-foreground shadow-[0_10px_30px_var(--app-shadow)] hover:brightness-105",
        faq: "group w-full justify-start rounded-[6px] bg-white text-left text-text-dark-cyan shadow-none duration-200 hover:tw-bg-gradient-badge-background hover:text-white hover:brightness-105 [&_svg_*]:fill-current",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "tw-bg-gradient-badge-background text-primary border  rounded-[50px]",
        menu: "inline-flex rounded-[16px] border transition",
        popupSubmit:
          "tw-bg-popup-submit border border-app-border-soft text-white shadow-[0_8px_20px_var(--app-shadow)] hover:brightness-110",
        support:
          "bg-background-card w-full justify-start rounded-[8px] text-white shadow-[0_8px_20px_var(--app-shadow)] hover:brightness-110",
        virtCard:
          "tw-bg-gradient-virt-card-border h-auto w-full justify-start overflow-hidden rounded-[12px] p-px text-left whitespace-normal hover:brightness-105",
        accouuntVirt: "flex-col gap-1 rounded-[6px] p-0 justify-start",
      },
      menuState: {
        active:
          "border-none tw-bg-gradient-bottom-nav text-app-highlight-foreground shadow-[var(--shadow-nav-active)] [&_svg_*]:fill-current",
        default:
          "border-white/18 bg-app-icon-panel text-app-nav-idle shadow-[var(--shadow-surface-soft)] [&_svg_*]:fill-current",
        none: "bg-transparant border-none",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        accountMenu: "h-17.5 gap-3 pl-[22px] pr-2",
        accountVirt: "h-auto",
        faq: "h-11 px-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        link: "h-11 px-6",
        pill: "h-16 rounded-full px-7 text-xl has-[>svg]:px-5",
        menu: "size-12",
        popupSubmit: "h-7 rounded-full px-6 text-[14px] font-semibold",
        virtCard: "px-0 py-0",
        supportLink: "h-14.5",
      },
    },
    defaultVariants: {
      menuState: "default",
      variant: "default",
      size: "default",
    },
  },
);

export function Button({
  className,
  menuState,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, menuState, className }))}
      {...props}
    />
  );
}
