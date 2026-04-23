import { useWebApp } from "@vkruglikov/react-telegram-web-app";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  BUY_ACCOUNT_OPTIONS_TEXT,
  VIRT_FORM_TEXT,
} from "@/shared/constants/text";
import { showErrorMessage, showSuccessMessage } from "@/shared/lib/notify";
import { notifyVirtOrderSuccessFromMiniApp } from "@/shared/lib/telegram-virt-order-notify";

import SortLevelIcon from "@/assets/icon/sort-level.svg";
import SortVirtIcon from "@/assets/icon/sort-virt.svg";

import {
  type AccountPurchaseOption,
  type BuyAccountPurchaseMode,
  type Virt,
  useSubmitBuyAccountRequest,
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
  const submitBuyAccountRequest = useSubmitBuyAccountRequest();
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

  const handleSubmit = useCallback(async () => {
    if (!selectedMode || !selectedOption) {
      return;
    }

    try {
      const result = await submitBuyAccountRequest.mutateAsync({
        amountRub,
        id: virt.id,
        mode: selectedMode.mode,
        option: selectedOption,
        server,
      });

      showSuccessMessage(VIRT_FORM_TEXT.paymentSuccess);
      void notifyVirtOrderSuccessFromMiniApp(webApp, {
        orderKind: "account",
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        game: virt.name,
        server,
        amountRub,
        bankAccount: "—",
        virtAmountLabel: selectedOption.label,
        transferMethod: `${selectedMode.title}: ${selectedOption.label}`,
      });
    } catch {
      showErrorMessage(VIRT_FORM_TEXT.paymentError);
    }
  }, [
    amountRub,
    selectedMode,
    selectedOption,
    server,
    submitBuyAccountRequest,
    virt.id,
    webApp,
  ]);

  return {
    server,
    amountRub,
    handleSubmit,
    isSubmitting: submitBuyAccountRequest.isPending,
    modeOptions,
    selectMode,
    selectedMode,
    selectedOption,
    setSelectedOption,
    setServer,
  };
};
