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
        "relative flex h-7 w-full items-center rounded-full border border-app-border-soft bg-app-highlight px-4 pr-10 pt-[3px] text-left text-xs text-text-inverse outline-hidden",
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
          "bg-surface-base text-text-inverse relative z-50 max-h-60 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-app-border-soft p-1 shadow-[var(--shadow-popup-panel)]",
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
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
