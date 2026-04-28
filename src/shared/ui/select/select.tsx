import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/shared/utils";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = ({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>) => {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        "relative flex h-12 w-full items-center rounded-full border border-app-border-soft bg-app-highlight px-4 pr-10 pt-[3px] text-left text-[14px] text-text-inverse outline-hidden",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-text-inverse" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
};

export const SelectContent = ({
  className,
  children,
  position = "popper",
  ...props
}: ComponentPropsWithoutRef<typeof SelectPrimitive.Content>) => {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position={position}
        className={cn(
          "bg-surface-base text-text-inverse relative z-50 flex max-h-[var(--radix-select-content-available-height)] min-w-[var(--radix-select-trigger-width)] flex-col overflow-hidden rounded-xl border border-app-border-soft shadow-[var(--shadow-popup-panel)]",
          className,
        )}
        {...props}
      >
        {/*
          Скролл здесь, не на Viewport: Radix выставляет на Viewport overflow, из‑за чего в TG WebView нет полосы.
        */}
        <div
          className={cn(
            "scrollbar-select-list min-h-0 min-w-0 flex-1 touch-pan-y overflow-y-scroll overscroll-contain px-1 py-1 [-webkit-overflow-scrolling:touch]",
            "max-h-[min(300px,var(--radix-select-content-available-height,100dvh))]",
          )}
        >
          <SelectPrimitive.Viewport className="p-0">{children}</SelectPrimitive.Viewport>
        </div>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
};

export const SelectItem = ({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof SelectPrimitive.Item>) => {
  return (
    <SelectPrimitive.Item
      className={cn(
        "relative flex w-full cursor-default items-center rounded-[10px] py-2 pr-8 pl-3 text-sm outline-hidden select-none data-[highlighted]:bg-app-highlight data-[highlighted]:text-white",
        className,
      )}
      {...props}
    >
      <span className="absolute right-3 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
};
