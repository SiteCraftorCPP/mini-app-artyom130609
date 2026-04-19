import * as DialogPrimitive from "@radix-ui/react-dialog";
import { type VariantProps, cva } from "class-variance-authority";
import { X } from "lucide-react";
import type { ComponentProps } from "react";

import { useLockBodyScroll } from "@/shared/hooks/use-lock-body-scroll";
import { cn } from "@/shared/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

const dialogContentVariants = cva(
  "fixed top-1/2 left-1/2 z-50 flex w-[calc(100vw-(var(--popup-viewport-offset)*2))] max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col outline-hidden",
  {
    variants: {
      variant: {
        default:
          "rounded-[16px] p-6 text-text-primary shadow-[0_24px_60px_var(--app-shadow)]",
        popup:
          "max-h-[calc(100dvh-(var(--popup-viewport-offset)*2))] overflow-hidden rounded-[16px] shadow-[0_24px_60px_var(--app-shadow)]",
      },
    },
    defaultVariants: {
      variant: "popup",
    },
  },
);

const dialogCloseVariants = cva(
  "absolute inline-flex items-center justify-center transition",
  {
    variants: {
      variant: {
        default:
          "border-app-border-soft text-text-primary top-4.5 right-4 size-9 rounded-full border bg-app-surface-overlay hover:bg-app-surface-overlay-hover",
        popup:
          "top-[17px] right-4 size-8 rounded-[4px] border border-app-border-soft bg-app-highlight text-app-highlight-foreground shadow-[0_4px_10px_var(--app-highlight-shadow)] hover:brightness-105",
      },
    },
    defaultVariants: {
      variant: "popup",
    },
  },
);

export const DialogPortal = ({
  ...props
}: ComponentProps<typeof DialogPrimitive.Portal>) => {
  return <DialogPrimitive.Portal {...props} />;
};

export const DialogOverlay = ({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Overlay>) => {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out bg-app-overlay fixed inset-0 z-40 backdrop-blur-[5px]",
        className,
      )}
      {...props}
    />
  );
};

export const DialogContent = ({
  className,
  children,
  lockBodyScroll = false,
  variant,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> &
  VariantProps<typeof dialogContentVariants> & {
    lockBodyScroll?: boolean;
  }) => {
  useLockBodyScroll(lockBodyScroll);

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(dialogContentVariants({ variant }), className)}
        {...props}
      >
        {variant === "popup" ? (
          <div className="tw-bg-gradient-card-border relative flex max-h-full min-h-0 flex-1 rounded-[16px] p-px">
            <div className="tw-bg-gradient-popup-surface text-text-primary relative flex max-h-full min-h-0 flex-1 flex-col rounded-[15px] backdrop-blur-[2px]">
              {children}
            </div>
          </div>
        ) : (
          children
        )}
        <DialogPrimitive.Close
          className={cn(
            dialogCloseVariants({ variant }),
            "hover:cursor-pointer",
          )}
        >
          <X className="size-6" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
};

export const DialogHeader = ({
  className,
  ...props
}: ComponentProps<"div">) => {
  return (
    <div className={cn("flex flex-col gap-2 pr-8", className)} {...props} />
  );
};

export const DialogTitle = ({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Title>) => {
  return (
    <DialogPrimitive.Title
      className={cn(
        "text-text-primary text-2xl leading-none font-semibold",
        className,
      )}
      {...props}
    />
  );
};

export const DialogDescription = ({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) => {
  return (
    <DialogPrimitive.Description
      className={cn("text-app-text-muted text-sm leading-5", className)}
      {...props}
    />
  );
};
