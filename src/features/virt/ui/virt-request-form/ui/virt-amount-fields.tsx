import { memo } from "react";
import type { Control } from "react-hook-form";

import { AppText, TAG } from "@/ui/app-text";

import { VIRT_FORM_TEXT } from "@/shared/constants/text";
import { TIMING } from "@/shared/constants/timing";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";

import { useVirtAmountFields } from "../hooks/use-virt-amount-fields";
import { VIRT_REQUEST_FORM_CLASSNAMES } from "../model/virt-request-form.constants";

import { type VirtRequestFormValues } from "@/features/virt/model";

type VirtAmountFieldsProps = {
  control: Control<VirtRequestFormValues>;
  exchangeRate: number;
  lastEditedForAmount: "amountRub" | "amountVirts";
  lockVirtsForPromo: boolean;
  initialAmountRub: string;
  initialAmountVirts: string;
  minAmountRub: number;
  onAmountRubInput: (value: string) => void;
  onAmountVirtInput: (value: string) => void;
  onAmountsCommit: (amountRub: string, amountVirts: string) => void;
};

export const VirtAmountFields = memo(
  ({
    control,
    exchangeRate,
    lastEditedForAmount,
    lockVirtsForPromo,
    initialAmountRub,
    initialAmountVirts,
    minAmountRub,
    onAmountRubInput,
    onAmountVirtInput,
    onAmountsCommit,
  }: VirtAmountFieldsProps) => {
    const {
      amountRubValue,
      amountVirtValue,
      handleAmountRubChange,
      handleAmountRubDebounce,
      handleAmountVirtChange,
      handleAmountVirtDebounce,
    } = useVirtAmountFields({
      exchangeRate,
      lastEditedForAmount,
      lockVirtsForPromo,
      initialAmountRub,
      initialAmountVirts,
      onAmountRubInput,
      onAmountVirtInput,
      onAmountsCommit,
    });

    return (
      <>
        <FormField
          control={control}
          name="amountRub"
          render={() => (
            <FormItem className={VIRT_REQUEST_FORM_CLASSNAMES.formItem}>
              <div className="mb-0 flex items-center justify-between gap-3">
                <FormLabel className="normal-case">
                  <div className="mb-1 flex items-center gap-2">
                    <AppText
                      tag={TAG.div}
                      variant="heroButtonBlack"
                      size="small"
                    >
                      {VIRT_FORM_TEXT.amountRubLabel}
                    </AppText>
                    <AppText
                      tag={TAG.p}
                      className="mb-0 text-center text-black/60"
                      variant="heroButtonBlack"
                      size="small"
                    >
                      {`(1кк - ${exchangeRate}р)`}
                    </AppText>
                  </div>
                </FormLabel>
                <AppText
                  className="mb-1 text-black/60"
                  variant="heroButtonBlack"
                  size="small"
                >
                  {VIRT_FORM_TEXT.minimumAmountShortTemplate(minAmountRub)}
                </AppText>
              </div>
              <FormControl>
                <div className="relative">
                  <Input
                    variant="form"
                    type="text"
                    inputMode="decimal"
                    enterKeyHint="next"
                    disableAutoScrollOnFocus
                    value={amountRubValue}
                    onChange={handleAmountRubChange}
                    debounceMs={TIMING.inputDebounceMs}
                    onDebounce={handleAmountRubDebounce}
                    placeholder=""
                    className="pr-8"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-black/60 font-medium">
                    ₽
                  </span>
                </div>
              </FormControl>

              <FormMessage
                className={VIRT_REQUEST_FORM_CLASSNAMES.formMessage}
              />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="amountVirts"
          render={() => (
            <FormItem className={VIRT_REQUEST_FORM_CLASSNAMES.formItem}>
              <FormLabel className="normal-case">
                <div className="mb-1 flex items-center gap-2">
                  <AppText tag={TAG.div} variant="heroButtonBlack" size="small">
                    {VIRT_FORM_TEXT.amountVirtsLabel}
                  </AppText>
                  <AppText
                    tag={TAG.p}
                    className="text-center text-black/60"
                    variant="heroButtonBlack"
                    size="small"
                  >
                    {`(${VIRT_FORM_TEXT.amountVirtsHint})`}
                  </AppText>
                </div>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    variant="form"
                    type="text"
                    inputMode="numeric"
                    enterKeyHint="done"
                    disableAutoScrollOnFocus
                    value={amountVirtValue}
                    onChange={handleAmountVirtChange}
                    debounceMs={TIMING.inputDebounceMs}
                    onDebounce={handleAmountVirtDebounce}
                    placeholder=""
                    className="pr-10"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-black/60 font-medium">
                    КК
                  </span>
                </div>
              </FormControl>

              <FormMessage
                className={VIRT_REQUEST_FORM_CLASSNAMES.formMessage}
              />
            </FormItem>
          )}
        />
      </>
    );
  },
);

VirtAmountFields.displayName = "VirtAmountFields";
