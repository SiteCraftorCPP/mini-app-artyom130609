import * as DialogPrimitive from "@radix-ui/react-dialog";
import { type VariantProps, cva } from "class-variance-authority";
import { X } from "lucide-react";
import type { ComponentProps } from "react";

import { useLockBodyScroll } from "@/shared/hooks/use-lock-body-scroll";
import { cn } from "@/shared/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

/** Крестик в строке с бейджем (PopupAppHeader), не absolute */
export const dialogPopupCloseButtonClassName =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-[4px] border border-app-border-soft bg-app-highlight text-app-highlight-foreground shadow-[0_4px_10px_var(--app-highlight-shadow)] transition hover:cursor-pointer hover:brightness-105";

const dialogContentVariants = cva(
  "fixed left-1/2 z-50 flex w-[calc(100vw-(var(--popup-viewport-offset)*2))] -translate-x-1/2 flex-col outline-hidden",
  {
    variants: {
      variant: {
        default:
          "top-1/2 max-w-sm -translate-y-1/2 rounded-[16px] p-6 text-text-primary shadow-[0_24px_60px_var(--app-shadow)]",
        /**
         * Высота и отступ от верха от `var(--app-stable-vh-px)`: в Telegram — viewportStableHeight,
         * не уменьшается при клавиатуре, поэтому панель не «улетает вверх».
         * Без `bottom: …` в vh, чтобы динамическое dvh/lvh не пересчитывало кадр.
         */
        popup:
          "top-[min(3.25rem,max(0.25rem,calc(0.065*var(--app-stable-vh-px,100dvh))))] h-[min(720px,calc(0.9*var(--app-stable-vh-px,100dvh)))] max-h-[min(720px,calc(0.9*var(--app-stable-vh-px,100dvh)))] w-[calc(100vw-(var(--popup-viewport-offset)*2))] max-w-md translate-y-0 overflow-hidden rounded-[16px] shadow-[0_24px_60px_var(--app-shadow)]",
        /** Узкий блок по центру экрана (FAQ и т.п.), без растягивания на всю высоту */
        popupCentered:
          "top-1/2 max-h-[min(85vh,560px)] w-[min(100vw-2rem,22rem)] max-w-[22rem] -translate-y-1/2 overflow-hidden rounded-[16px] shadow-[0_24px_60px_var(--app-shadow)]",
        /** «Купить вирты» / «Купить аккаунт»: по центру экрана, ширина как у полноэкранного popup */
        popupFormCentered:
          "top-1/2 max-h-[min(90dvh,720px)] w-[min(100vw-(var(--popup-viewport-offset)*2),28rem)] max-w-md -translate-y-1/2 overflow-hidden rounded-[16px] shadow-[0_24px_60px_var(--app-shadow)]",
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

  const resolvedVariant = variant ?? "popup";
  const isPopupSurface =
    resolvedVariant === "popup" ||
    resolvedVariant === "popupCentered" ||
    resolvedVariant === "popupFormCentered";

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(dialogContentVariants({ variant }), className)}
        {...props}
        data-tg-dialog-popup={isPopupSurface ? "true" : undefined}
      >
        {isPopupSurface ? (
          <div className="tw-bg-gradient-card-border relative flex max-h-full min-h-0 flex-1 rounded-[16px] p-px">
            <div
              className={cn(
                "tw-bg-gradient-popup-surface text-text-primary relative flex max-h-full min-h-0 flex-1 flex-col rounded-[15px] backdrop-blur-[2px]",
                resolvedVariant === "popupCentered" ||
                resolvedVariant === "popupFormCentered"
                  ? "pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-3"
                  : "pt-[max(var(--app-telegram-popup-top-clearance,52px),var(--tg-content-top,0px),var(--tg-safe-top,0px),env(safe-area-inset-top,0px))]",
              )}
            >
              {children}
            </div>
          </div>
        ) : (
          children
        )}
        {resolvedVariant === "default" ? (
          <DialogPrimitive.Close
            className={cn(
              dialogCloseVariants({ variant: resolvedVariant }),
              "hover:cursor-pointer",
            )}
          >
            <X className="size-6" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        ) : null}
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
