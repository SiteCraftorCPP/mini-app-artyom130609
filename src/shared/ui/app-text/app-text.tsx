import { type VariantProps, cva } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { HighlightText } from "@/shared/lib/high-light-text";
import { cn } from "@/shared/utils";

import { TAG } from "./model";

const textVariants = {
  default: "text-gray-800",
  darkCyanStrong: "font-bold text-text-dark-cyan",
  darkStrong: "font-bold text-black",
  heroButton: "font-semibold text-white",
  heroButtonBlack: "font-semibold text-black",
  popupBody: "text-text-primary",
  primaryStrong: "font-bold text-white",
  primaryMedium: "font-medium text-white",
} as const;

const textSizes = {
  default: "text-[16px] leading-[100%] md:text-[16px]",
  small: "text-[12px] leading-[100%] md:text-[12px]",
  popupBadge: "text-[16px] leading-none",
  popupBody: "text-[20px] leading-[120%]",
  medium: "text-[14px] leading-[100%] md:text-[14px]",
  headerInfo: "text-base leading-none",
  heroButton: "text-[18px] leading-none",
  xxxl: "text-[24px] leading-[100%] md:text-[24px]",
} as const;

const textVariant = cva("", {
  variants: {
    variant: textVariants,
    size: textSizes,
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export type AppTextVariant = keyof typeof textVariants;
export type AppTextSize = keyof typeof textSizes;

type AppTextProps = HTMLAttributes<HTMLElement> & {
  highlight?: string | string[];
  classNameHighLight?: string;
  variant?: AppTextVariant;
  size?: AppTextSize;
  tag?: TAG;
} & VariantProps<typeof textVariant>;

export const AppText = ({
  children,
  className,
  classNameHighLight,
  highlight,
  variant,
  size,
  tag,
}: AppTextProps) => {
  return (
    <TextWrapper variant={variant} size={size} tag={tag} className={className}>
      <HighlightText highlight={highlight} className={classNameHighLight}>
        {children}
      </HighlightText>
    </TextWrapper>
  );
};

function TextWrapper({
  children,
  variant,
  size,
  className,
  tag = TAG.span,
}: AppTextProps) {
  const Tag = tag;

  return (
    <Tag className={cn(textVariant({ variant, size }), className)}>
      {children}
    </Tag>
  );
}
