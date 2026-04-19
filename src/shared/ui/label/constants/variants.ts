import { cva } from "class-variance-authority";

export const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      variant: {
        order: "text-[14px] font-medium leading-[100%] normal-case",
        default: "text-sm leading-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
