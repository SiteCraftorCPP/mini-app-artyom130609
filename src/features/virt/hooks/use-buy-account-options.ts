import { useWebApp } from "@vkruglikov/react-telegram-web-app";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { PaymentDialogContext } from "@/features/payment/payment-method-dialog";
import { BUY_ACCOUNT_OPTIONS_TEXT } from "@/shared/constants/text";
import {
  accountWithVirtsPriceRub,
  formatKkLabelForOrder,
  parseKkFromUserInput,
} from "@/shared/lib/account-virt-pricing";

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
  const [customKkStr, setCustomKkStr] = useState("");
  const [server, setServer] = useState(virt.serverOptions[0] || "");

  const isCustomVirtsMode = Boolean(
    virt.accountVirtsCustomPricing && selectedMode?.mode === "virts",
  );

  const parsedKk = useMemo(
    () => (isCustomVirtsMode ? parseKkFromUserInput(customKkStr) : null),
    [customKkStr, isCustomVirtsMode],
  );

  const amountRub = useMemo(() => {
    if (
      isCustomVirtsMode &&
      virt.accountVirtsCustomPricing &&
      parsedKk !== null
    ) {
      return accountWithVirtsPriceRub(parsedKk, virt.accountVirtsCustomPricing);
    }
    return selectedOption?.amountRub ?? 0;
  }, [
    isCustomVirtsMode,
    virt.accountVirtsCustomPricing,
    parsedKk,
    selectedOption,
  ]);

  const effectiveOption: AccountPurchaseOption | null = useMemo(() => {
    if (
      isCustomVirtsMode &&
      virt.accountVirtsCustomPricing &&
      parsedKk !== null
    ) {
      return {
        id: "custom-kk",
        label: formatKkLabelForOrder(parsedKk),
        amountRub,
      };
    }
    return selectedOption;
  }, [
    amountRub,
    isCustomVirtsMode,
    parsedKk,
    selectedOption,
    virt.accountVirtsCustomPricing,
  ]);

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
        options: virt.accountVirtsCustomPricing
          ? []
          : virt.accountVirtOptions ?? [],
        title: BUY_ACCOUNT_OPTIONS_TEXT.byVirtsAmount,
      },
    ],
    [
      virt.accountLevelOptions,
      virt.accountVirtOptions,
      virt.accountVirtsCustomPricing,
    ],
  );

  const selectMode = useCallback(
    (modeConfig: BuyAccountModeConfig) => {
      setSelectedMode(modeConfig);
      setCustomKkStr("");
      if (modeConfig.mode === "virts" && virt.accountVirtsCustomPricing) {
        setSelectedOption(null);
      } else {
        setSelectedOption(modeConfig.options[0] ?? null);
      }
    },
    [virt.accountVirtsCustomPricing],
  );

  const handleBack = useCallback(() => {
    if (!selectedMode) {
      return false;
    }

    setSelectedMode(null);
    setSelectedOption(null);
    setCustomKkStr("");
    return true;
  }, [selectedMode]);

  useEffect(() => {
    onBackStateChange?.(selectedMode ? handleBack : null);

    return () => onBackStateChange?.(null);
  }, [handleBack, onBackStateChange, selectedMode]);

  useEffect(() => {
    setServer(virt.serverOptions[0] || "");
  }, [virt.id, virt.serverOptions]);

  const handleSubmit = useCallback(() => {
    if (!selectedMode || !effectiveOption) {
      return;
    }
    setPaymentAmountRub(amountRub);
    setPaymentContext({
      orderKind: "account",
      game: virt.name,
      server,
      transferMethod: `${selectedMode.title}: ${effectiveOption.label}`,
      accountMode: selectedMode.title,
      accountOptionLabel: effectiveOption.label,
    });
    setPaymentOpen(true);
  }, [amountRub, effectiveOption, selectedMode, server, virt.name]);

  return {
    server,
    amountRub,
    handleSubmit,
    isSubmitting: false,
    modeOptions,
    selectMode,
    selectedMode,
    selectedOption,
    effectiveOption,
    setSelectedOption,
    setServer,
    paymentOpen,
    setPaymentOpen,
    paymentContext,
    paymentAmountRub,
    initData: webApp?.initData?.trim() ?? "",
    isCustomVirtsMode,
    customKkStr,
    setCustomKkStr,
  };
};
