"use client";

import { type VariantProps, cva } from "class-variance-authority";
import { type HTMLAttributes, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useLockBodyScroll } from "@/shared/hooks/use-lock-body-scroll";
import { cn } from "@/shared/utils";

const spinerVariants = cva("flex items-center justify-center", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      fix: "fixed inset-0 z-1000 h-screen w-screen bg-background pointer-events-auto",
      load: "fixed inset-0 z-1000 h-screen w-screen bg-black/50 pointer-events-auto",
    },
    size: {
      default: "min-h-screen",
    },
  },
  defaultVariants: {
    variant: "load",
    size: "default",
  },
});

type SpinerProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof spinerVariants> & {
    classNameLoader?: string;
  };

export const Spinner = ({
  className,
  classNameLoader,
  variant,
  size,
}: SpinerProps) => {
  const resolvedVariant = variant ?? "load";
  const resolvedSize = size ?? "default";

  useLockBodyScroll(
    resolvedVariant === "fix" || resolvedVariant === "load",
  );
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const content = (
    <div
      className={cn(
        spinerVariants({
          variant: resolvedVariant,
          size: resolvedSize,
          className,
        }),
      )}
      onPointerDownCapture={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onClickCapture={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <div className="text-center">
        <div
          className={cn(
            "mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600",
            classNameLoader,
          )}
        />

        <p className="text-gray-600">Загрузка...</p>
      </div>
    </div>
  );

  if (
    (resolvedVariant === "fix" || resolvedVariant === "load") &&
    isMounted
  ) {
    return createPortal(content, document.body);
  }

  return content;
};
