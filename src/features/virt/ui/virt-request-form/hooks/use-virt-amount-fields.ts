import { useCallback, useEffect, useState } from "react";

import { DEFAULT } from "@/shared/constants/default";

import {
  calculateAmountRub,
  calculateAmountVirts,
  formatAmountVirtsShort,
} from "@/features/virt/model";

const getVirtExchangeRate = (exchangeRate: number) => ({
  amountRub: exchangeRate,
  amountVirts: DEFAULT.MIN_AMOUNT_VIRT,
});

type UseVirtAmountFieldsParams = {
  exchangeRate: number;
  initialAmountRub: string;
  initialAmountVirts: string;
  onAmountRubInput: (value: string) => void;
  onAmountVirtInput: (value: string) => void;
  onAmountsCommit: (amountRub: string, amountVirts: string) => void;
};

export const useVirtAmountFields = ({
  exchangeRate,
  initialAmountRub,
  initialAmountVirts,
  onAmountRubInput,
  onAmountVirtInput,
  onAmountsCommit,
}: UseVirtAmountFieldsParams) => {
  const [amountRubValue, setAmountRubValue] = useState(initialAmountRub);
  const [amountVirtValue, setAmountVirtValue] = useState(initialAmountVirts);

  useEffect(() => {
    setAmountRubValue(initialAmountRub);
    setAmountVirtValue(formatAmountVirtsShort(initialAmountVirts));
  }, [initialAmountRub, initialAmountVirts]);

  const handleAmountRubChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextAmountRub = event.target.value;

      setAmountRubValue(nextAmountRub);
      onAmountRubInput(nextAmountRub);
    },
    [onAmountRubInput],
  );

  const handleAmountRubDebounce = useCallback(
    (value: string) => {
      const nextAmountVirts = value
        ? calculateAmountVirts(value, getVirtExchangeRate(exchangeRate))
        : "";

      setAmountVirtValue(formatAmountVirtsShort(nextAmountVirts));
      onAmountsCommit(value, nextAmountVirts);
    },
    [exchangeRate, onAmountsCommit],
  );

  const handleAmountVirtChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextAmountVirts = event.target.value;

      setAmountVirtValue(nextAmountVirts);
      onAmountVirtInput(nextAmountVirts);
    },
    [onAmountVirtInput],
  );

  const handleAmountVirtDebounce = useCallback(
    (value: string) => {
      const nextAmountRub = value
        ? calculateAmountRub(value, getVirtExchangeRate(exchangeRate))
        : "";

      setAmountRubValue(nextAmountRub);
      onAmountsCommit(nextAmountRub, value);
    },
    [exchangeRate, onAmountsCommit],
  );

  return {
    amountRubValue,
    amountVirtValue,
    handleAmountRubChange,
    handleAmountRubDebounce,
    handleAmountVirtChange,
    handleAmountVirtDebounce,
  };
};
