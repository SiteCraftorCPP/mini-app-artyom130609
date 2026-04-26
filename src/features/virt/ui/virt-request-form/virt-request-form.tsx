import { AppText, TAG } from "@/ui/app-text";
import { Button } from "@/ui/button";

import { CURRENCY } from "@/shared/constants/common";
import { TEXT, VIRT_FORM_TEXT } from "@/shared/constants/text";
import { formatNumberWithSpaces } from "@/shared/lib/format-numbers";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import { useVirtRequestForm } from "../../hooks";
import { cn } from "@/shared/utils";

import {
  VIRT_REQUEST_FORM_CLASSNAMES,
  VIRT_REQUEST_FORM_DEFAULTS,
  getAccountNumberPlaceholder,
} from "./model/virt-request-form.constants";
import { VirtAmountFields } from "./ui/virt-amount-fields";
import { type Virt, VirtCard } from "@/entities/virt";

type VirtRequestFormProps = {
  virt: Virt;
};

export const VirtRequestForm = ({ virt }: VirtRequestFormProps) => {
  const {
    displayAmountRub,
    form,
    handleAmountRubInput,
    handleAmountVirtInput,
    handleAmountsCommit,
    handleSubmit,
    initialAmountRub,
    initialAmountVirts,
    isSubmitting,
    effectiveExchangeRate,
    activePromoCode,
    applyPromoCode,
    promoApplyFeedback,
    isPromoListFetching,
    lastEditedForAmount,
    lockVirtsForPromo,
  } = useVirtRequestForm({ virt });

  return (
    <div className="flex flex-1 flex-col gap-3 px-4 pb-4 h-full">
      <VirtCard virt={virt} interactive={false} className="shadow-none shrink-0" />

      <Form {...form}>
        <form
          onSubmit={handleSubmit}
          className="bg-surface-base text-text-inverse flex flex-col w-full rounded-xl p-4 shadow-[var(--shadow-popup-panel)]"
        >
          <div className="flex flex-col gap-3">
            <FormField
              control={form.control}
              name="server"
              render={({ field }) => (
                <FormItem className={VIRT_REQUEST_FORM_CLASSNAMES.formItem}>
                  <FormLabel className="normal-case">
                    <AppText
                      tag={TAG.div}
                      className="mb-1"
                      variant="heroButtonBlack"
                      size="small"
                    >
                      {virt.serverLabel || TEXT.labels.server}
                    </AppText>
                  </FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {virt.serverOptions.map((server) => (
                          <SelectItem key={server} value={server}>
                            {server}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage
                    className={VIRT_REQUEST_FORM_CLASSNAMES.formMessage}
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem className={VIRT_REQUEST_FORM_CLASSNAMES.formItem}>
                  <FormLabel className="normal-case">
                    <AppText
                      tag={TAG.div}
                      className="mb-1"
                      variant="heroButtonBlack"
                      size="small"
                    >
                      {VIRT_FORM_TEXT.accountNumberLabel}
                    </AppText>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      variant="form"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      enterKeyHint="next"
                      disableAutoScrollOnFocus
                      placeholder={getAccountNumberPlaceholder(virt.name)}
                    />
                  </FormControl>
                  <FormMessage
                    className={VIRT_REQUEST_FORM_CLASSNAMES.formMessage}
                  />
                </FormItem>
              )}
            />

            <VirtAmountFields
              control={form.control}
              exchangeRate={effectiveExchangeRate}
              lastEditedForAmount={lastEditedForAmount}
              lockVirtsForPromo={lockVirtsForPromo}
              initialAmountRub={initialAmountRub}
              initialAmountVirts={initialAmountVirts}
              minAmountRub={virt.minAmountRub}
              onAmountRubInput={handleAmountRubInput}
              onAmountVirtInput={handleAmountVirtInput}
              onAmountsCommit={handleAmountsCommit}
            />

            <FormField
              control={form.control}
              name="promoCode"
              render={({ field }) => (
                <FormItem className={VIRT_REQUEST_FORM_CLASSNAMES.formItem}>
                  <FormLabel className="normal-case">
                    <AppText
                      tag={TAG.div}
                      className="mb-1"
                      variant="heroButtonBlack"
                      size="small"
                    >
                      {VIRT_FORM_TEXT.promoCodeLabel}
                    </AppText>
                  </FormLabel>
                  <FormControl>
                    <div className="flex w-full min-w-0 items-stretch gap-2">
                      <Input
                        {...field}
                        className="min-w-0 flex-1"
                        variant="form"
                        value={field.value ?? ""}
                        placeholder={VIRT_FORM_TEXT.promoCodePlaceholder}
                      />
                      <button
                        type="button"
                        className={cn(
                          "inline-flex h-12 shrink-0 items-center justify-center rounded-full border border-app-border-soft bg-app-highlight px-4 text-sm font-medium text-black shadow-none transition-all outline-none",
                          "hover:brightness-105 focus-visible:ring-[3px] focus-visible:ring-ring/50",
                          "disabled:pointer-events-none disabled:opacity-50",
                        )}
                        onClick={applyPromoCode}
                        disabled={isPromoListFetching}
                      >
                        <AppText
                          tag={TAG.span}
                          size="small"
                          variant="heroButtonBlack"
                        >
                          {VIRT_FORM_TEXT.applyPromo}
                        </AppText>
                      </button>
                    </div>
                  </FormControl>
                  {activePromoCode && (
                    <AppText
                      tag={TAG.div}
                      className="mt-1 text-[#2ecc71]"
                      size="small"
                    >
                      {VIRT_FORM_TEXT.promoAppliedOk(
                        activePromoCode.discount,
                      )}
                    </AppText>
                  )}
                  {!activePromoCode && promoApplyFeedback === "not_found" && (
                    <AppText
                      tag={TAG.div}
                      className="mt-1 text-red-500/90"
                      size="small"
                    >
                      {VIRT_FORM_TEXT.promoNotFound}
                    </AppText>
                  )}
                  {!activePromoCode && promoApplyFeedback === "error" && (
                    <AppText
                      tag={TAG.div}
                      className="mt-1 text-red-500/90"
                      size="small"
                    >
                      {VIRT_FORM_TEXT.promoNetworkError}
                    </AppText>
                  )}
                  {!activePromoCode && promoApplyFeedback === "empty" && (
                    <AppText
                      tag={TAG.div}
                      className="mt-1 text-amber-500/90"
                      size="small"
                    >
                      {VIRT_FORM_TEXT.promoEnterCode}
                    </AppText>
                  )}
                  <FormMessage
                    className={VIRT_REQUEST_FORM_CLASSNAMES.formMessage}
                  />
                </FormItem>
              )}
            />
          </div>

          <div className="mt-3 flex shrink-0 items-center justify-between gap-3">
            <div className="border-app-border-soft tw-bg-gradient-badge-background flex h-7 items-center justify-center rounded-full border px-4 text-white">
              <AppText tag={TAG.div} variant="primaryStrong" size="small">
                {`${formatNumberWithSpaces(Number(displayAmountRub || 0)) || VIRT_REQUEST_FORM_DEFAULTS.zeroAmountFallback} ${CURRENCY.RUB}`}
              </AppText>
            </div>
            <Button
              type="submit"
              variant="popupSubmit"
              size="popupSubmit"
              disabled={isSubmitting}
            >
              <AppText tag={TAG.div} variant="heroButton" size="small">
                {isSubmitting
                  ? VIRT_FORM_TEXT.submitPending
                  : VIRT_FORM_TEXT.submit}
              </AppText>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
