import * as React from "react";
import type { InputHTMLAttributes } from "react";

import { scrollToInput } from "@/shared/lib/scroll-to-top-input";
import { cn } from "@/shared/utils";

export type InputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "defaultValue" | "value"
> & {
  debounceMs?: number;
  onDebounce?: (value: string) => void;
  value?: string;
  defaultValue?: string;
  variant?: "default" | "form";
  /**
   * Отключает auto-scroll на фокус (в Telegram WebView может дёргать попап вверх при появлении клавиатуры).
   */
  disableAutoScrollOnFocus?: boolean;
};

const inputVariants = {
  default: {
    input:
      "text-text-primary placeholder:text-text-primary h-full w-full rounded-full bg-transparent px-3 text-[13px] leading-[100%] font-normal transition-colors placeholder:text-[13px] placeholder:font-normal focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 md:text-[20px] md:placeholder:text-[20px]",
    outer:
      "tw-bg-gradient-primary focus-within:tw-bg-gradient-secondary flex h-[32px] w-full items-center justify-center rounded-full md:h-[52px]",
    surface: "tw-bg-gradient-primary flex h-[30px] rounded-full md:h-[50px]",
  },
  form: {
    input:
      "h-full w-full rounded-full bg-transparent pl-5 pr-4 pt-[2px] text-[14px] leading-[100%] font-normal text-black transition-colors placeholder:text-[14px] placeholder:font-medium placeholder:text-red-200 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 ",
    outer: "flex h-12 w-full items-center justify-center rounded-full",
    surface:
      "border-app-border-soft bg-app-highlight flex h-12 w-full rounded-full border",
  },
} as const;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      debounceMs = 200,
      onDebounce,
      type,
      onChange,
      onFocus,
      disableAutoScrollOnFocus = false,
      defaultValue,
      value,
      variant = "default",
      ...props
    },
    ref,
  ) => {
    const isControlled = value !== undefined;
    const [innerValue, setInnerValue] = React.useState(defaultValue ?? "");
    const [debouncedValue, setDebouncedValue] = React.useState<string | null>(
      null,
    );
    const currentValue = isControlled ? value : innerValue;
    const wrapperRef = React.useRef<HTMLDivElement | null>(null);
    const onDebounceRef = React.useRef(onDebounce);
    const styles = inputVariants[variant];

    React.useEffect(() => {
      onDebounceRef.current = onDebounce;
    }, [onDebounce]);

    React.useEffect(() => {
      if (!isControlled) {
        setInnerValue(defaultValue ?? "");
      }
    }, [defaultValue, isControlled]);

    const handleOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;

      if (!isControlled) {
        setInnerValue(newValue);
      }

      setDebouncedValue(newValue);
      onChange?.(event);
    };

    const handleFocus = (
      event: React.FocusEvent<HTMLInputElement, Element>,
    ) => {
      if (!disableAutoScrollOnFocus) {
        scrollToInput(wrapperRef);
      }
      if (onFocus) onFocus(event);
    };

    React.useEffect(() => {
      if (!onDebounceRef.current || debouncedValue === null) {
        return;
      }

      const timeoutId = window.setTimeout(() => {
        onDebounceRef.current?.(debouncedValue);
      }, debounceMs);

      return () => window.clearTimeout(timeoutId);
    }, [debounceMs, debouncedValue]);

    return (
      <div className={styles.outer}>
        <div
          className={styles.surface}
          style={variant === "default" ? { width: "calc(100% - 2px)" } : undefined}
        >
          <div
            ref={wrapperRef}
            className="flex h-full w-full items-center justify-between rounded-full p-0"
          >
            <input
              className={cn(styles.input, className)}
              type={type}
              ref={ref}
              value={currentValue}
              onChange={handleOnChange}
              onFocus={handleFocus}
              {...props}
            />
          </div>
        </div>
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
