import { useWebApp } from "@vkruglikov/react-telegram-web-app";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { PaymentDialogContext } from "@/features/payment/payment-method-dialog";
import { BUY_ACCOUNT_OPTIONS_TEXT } from "@/shared/constants/text";

import SortLevelIcon from "@/assets/icon/sort-level.svg";
import SortVirtIcon from "@/assets/icon/sort-virt.svg";

import {
  type AccountPurchaseOption,
  type BuyAccountPurchaseMode,
  type Virt,
} from "@/entities/virt";

export type BuyAccountModeConfig = {
  icon: typeof SortLevelIcon;
  mode: BuyAccountPurchaseMode;
  options: AccountPurchaseOption[];
  title: string;
};

type UseBuyAccountOptionsParams = {
  onBackStateChange?: (handler: (() => boolean) | null) => void;
  virt: Virt;
};

export const useBuyAccountOptions = ({
  onBackStateChange,
  virt,
}: UseBuyAccountOptionsParams) => {
  const webApp = useWebApp();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentContext, setPaymentContext] = useState<PaymentDialogContext | null>(
    null,
  );
  const [paymentAmountRub, setPaymentAmountRub] = useState(0);
  const [selectedMode, setSelectedMode] = useState<BuyAccountModeConfig | null>(
    null,
  );
  const [selectedOption, setSelectedOption] =
    useState<AccountPurchaseOption | null>(null);
  const [server, setServer] = useState(virt.serverOptions[0] || "");

  const amountRub = selectedOption?.amountRub ?? 0;

  const modeOptions = useMemo<BuyAccountModeConfig[]>(
    () => [
      {
        icon: SortLevelIcon,
        mode: "level",
        options: virt.accountLevelOptions ?? [],
        title: BUY_ACCOUNT_OPTIONS_TEXT.byLevel,
      },
      {
        icon: SortVirtIcon,
        mode: "virts",
        options: virt.accountVirtOptions ?? [],
        title: BUY_ACCOUNT_OPTIONS_TEXT.byVirtsAmount,
      },
    ],
    [virt.accountLevelOptions, virt.accountVirtOptions],
  );

  const selectMode = useCallback((modeConfig: BuyAccountModeConfig) => {
    setSelectedMode(modeConfig);
    setSelectedOption(modeConfig.options[0] ?? null);
  }, []);

  const handleBack = useCallback(() => {
    if (!selectedMode) {
      return false;
    }

    setSelectedMode(null);
    setSelectedOption(null);
    return true;
  }, [selectedMode]);

  useEffect(() => {
    onBackStateChange?.(selectedMode ? handleBack : null);

    return () => onBackStateChange?.(null);
  }, [handleBack, onBackStateChange, selectedMode]);

  const handleSubmit = useCallback(() => {
    if (!selectedMode || !selectedOption) {
      return;
    }
    setPaymentAmountRub(amountRub);
    setPaymentContext({
      orderKind: "account",
      game: virt.name,
      server,
      transferMethod: `${selectedMode.title}: ${selectedOption.label}`,
      accountMode: selectedMode.title,
      accountOptionLabel: selectedOption.label,
    });
    setPaymentOpen(true);
  }, [amountRub, selectedMode, selectedOption, server, virt.name]);

  return {
    server,
    amountRub,
    handleSubmit,
    isSubmitting: false,
    modeOptions,
    selectMode,
    selectedMode,
    selectedOption,
    setSelectedOption,
    setServer,
    paymentOpen,
    setPaymentOpen,
    paymentContext,
    paymentAmountRub,
    initData: webApp?.initData?.trim() ?? "",
  };
};
