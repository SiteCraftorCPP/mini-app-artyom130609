import { useState } from "react";

import { AppText, TAG } from "@/ui/app-text";
import { Button } from "@/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";

import { CURRENCY } from "@/shared/constants/common";
import {
  BUY_ACCOUNT_OPTIONS_TEXT,
  TEXT,
  VIRT_FORM_TEXT,
} from "@/shared/constants/text";
import { formatNumberWithSpaces } from "@/shared/lib/format-numbers";

import { PaymentMethodDialog } from "@/features/payment/payment-method-dialog";
import { Input } from "@/shared/ui/input";

import {
  type BuyAccountModeConfig,
  useBuyAccountOptions,
} from "../hooks/use-buy-account-options";

import { type Virt, VirtCard } from "@/entities/virt";

type BuyAccountOptionsProps = {
  onBackStateChange?: (handler: (() => boolean) | null) => void;
  virt: Virt;
};

const accountOptionClassName =
  "tw-bg-gradient-account-option h-41 flex-1 flex-col gap-3 rounded-xl px-4 py-5 shadow-none hover:brightness-105";

type AboutAccountsBlockProps = {
  open: boolean;
  onToggle: () => void;
  showBalanceLine: boolean;
};

const AboutAccountsBlock = ({
  open,
  onToggle,
  showBalanceLine,
}: AboutAccountsBlockProps) => {
  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="ghost"
        className="tw-bg-gradient-account-option hover:brightness-105 h-auto min-h-10 w-full justify-center rounded-md px-4 py-2 text-white"
        aria-expanded={open}
        onClick={onToggle}
      >
        <AppText variant="darkCyanStrong" size="popupBody">
          {BUY_ACCOUNT_OPTIONS_TEXT.aboutAccountsButton}
        </AppText>
      </Button>
      {open ? (
        <div className="border-app-border-soft rounded-md border bg-black/25 px-3 py-2.5">
          <AppText
            tag={TAG.p}
            variant="primaryStrong"
            size="small"
            className="mb-1.5"
          >
            {BUY_ACCOUNT_OPTIONS_TEXT.aboutAccountsTitle}
          </AppText>
          <ul className="list-none space-y-1.5 pl-0 text-left">
            <li className="flex gap-2">
              <span className="text-white/80" aria-hidden>
                –
              </span>
              <AppText tag={TAG.span} variant="primaryMedium" size="small">
                {BUY_ACCOUNT_OPTIONS_TEXT.aboutAccountsBodyLine1}
              </AppText>
            </li>
            <li className="flex gap-2">
              <span className="text-white/80" aria-hidden>
                –
              </span>
              <AppText tag={TAG.span} variant="primaryMedium" size="small">
                {BUY_ACCOUNT_OPTIONS_TEXT.aboutAccountsBodyLine2}
              </AppText>
            </li>
            {showBalanceLine ? (
              <li className="flex gap-2">
                <span className="text-white/80" aria-hidden>
                  –
                </span>
                <AppText tag={TAG.span} variant="primaryMedium" size="small">
                  {BUY_ACCOUNT_OPTIONS_TEXT.aboutAccountsBodyLine3}
                </AppText>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export const BuyAccountOptions = ({
  onBackStateChange,
  virt,
}: BuyAccountOptionsProps) => {
  const {
    amountRub,
    customKkStr,
    effectiveOption,
    handleSubmit,
    isCustomVirtsMode,
    isSubmitting,
    modeOptions,
    selectMode,
    selectedMode,
    selectedOption,
    setCustomKkStr,
    setSelectedOption,
    setServer,
    server,
    paymentOpen,
    setPaymentOpen,
    paymentContext,
    paymentAmountRub,
    initData,
  } = useBuyAccountOptions({ onBackStateChange, virt });

  const selectedOptionLabel = selectedOption
    ? `${selectedOption.label} - ${formatNumberWithSpaces(selectedOption.amountRub)} ${CURRENCY.RUB}`
    : undefined;

  const [aboutByLevelOpen, setAboutByLevelOpen] = useState(false);
  const [aboutByVirtsOpen, setAboutByVirtsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 px-4 pb-6">
      <VirtCard virt={virt} interactive={false} className="shadow-none" />
      {selectedMode ? (
        <div className="flex flex-col gap-3">
          <ModeTitle modeConfig={selectedMode} />
          <AboutAccountsBlock
            open={isCustomVirtsMode ? aboutByVirtsOpen : aboutByLevelOpen}
            onToggle={() =>
              isCustomVirtsMode
                ? setAboutByVirtsOpen((o) => !o)
                : setAboutByLevelOpen((o) => !o)
            }
            showBalanceLine={isCustomVirtsMode}
          />
          <div className="mb-2 space-y-1">
            <AppText tag={TAG.p} variant="darkStrong" className="mb-1">
              {TEXT.labels.server}
            </AppText>
            <Select value={server} onValueChange={(value) => setServer(value)}>
              <SelectTrigger className="h-9.5">
                <SelectValue>
                  <AppText variant="darkStrong">{server}</AppText>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {virt.serverOptions.map((server) => (
                  <SelectItem key={server} value={server}>
                    {server}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            {isCustomVirtsMode ? (
              <div className="space-y-1">
                <AppText tag={TAG.p} variant="darkStrong" className="mb-1">
                  {BUY_ACCOUNT_OPTIONS_TEXT.customKkLabel}
                </AppText>
                <Input
                  value={customKkStr}
                  onChange={(e) => setCustomKkStr(e.target.value)}
                  inputMode="decimal"
                  autoComplete="off"
                  disableAutoScrollOnFocus
                  placeholder={BUY_ACCOUNT_OPTIONS_TEXT.customKkPricingPlaceholder}
                  variant="form"
                />
              </div>
            ) : (
              <Select
                value={selectedOption?.id}
                onValueChange={(value) => {
                  const nextOption =
                    selectedMode.options.find((option) => option.id === value) ??
                    null;

                  setSelectedOption(nextOption);
                }}
              >
                <SelectTrigger className="h-9.5">
                  <SelectValue>
                    <AppText variant="darkStrong">{selectedOptionLabel}</AppText>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {selectedMode.options.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {`${option.label} - ${formatNumberWithSpaces(option.amountRub)} ${CURRENCY.RUB}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="mt-1 flex items-center justify-between gap-3">
            <div className="border-app-border-soft tw-bg-gradient-badge-background flex h-8 min-w-[100px] items-center justify-center rounded-full border px-5 text-white">
              <AppText variant="primaryStrong" size="small">
                {`${formatNumberWithSpaces(amountRub)} ${CURRENCY.RUB}`}
              </AppText>
            </div>
            <Button
              type="button"
              variant="popupSubmit"
              size="popupSubmit"
              className="h-8.5"
              disabled={!effectiveOption || isSubmitting}
              onClick={handleSubmit}
            >
              <AppText variant="primaryStrong" size="small">
                {isSubmitting
                  ? VIRT_FORM_TEXT.submitPending
                  : VIRT_FORM_TEXT.submit}
              </AppText>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {modeOptions.map((modeConfig) => {
            const Icon = modeConfig.icon;

            return (
              <Button
                key={modeConfig.mode}
                type="button"
                className={accountOptionClassName}
                onClick={() => selectMode(modeConfig)}
              >
                <Icon className="h-14 w-16" />
                <AppText variant="darkCyanStrong" size="popupBody">
                  {modeConfig.mode === "level"
                    ? BUY_ACCOUNT_OPTIONS_TEXT.byLevel
                    : BUY_ACCOUNT_OPTIONS_TEXT.byVirts}
                </AppText>
              </Button>
            );
          })}
        </div>
      )}
      <PaymentMethodDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        initData={initData}
        amountRub={paymentAmountRub}
        context={paymentContext}
      />
    </div>
  );
};

const ModeTitle = ({ modeConfig }: { modeConfig: BuyAccountModeConfig }) => {
  const Icon = modeConfig.icon;

  return (
    <div className="tw-bg-gradient-account-option flex h-12 items-center justify-start gap-3 rounded-md px-6">
      <Icon className="h-8 w-9" />
      <AppText variant="darkCyanStrong" size="popupBody">
        {modeConfig.title}
      </AppText>
    </div>
  );
};
