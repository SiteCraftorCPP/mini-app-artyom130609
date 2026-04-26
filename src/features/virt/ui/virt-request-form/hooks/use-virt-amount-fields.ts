import { useCallback, useEffect, useState } from "react";

import { DEFAULT } from "@/shared/constants/default";

import {
  calculateAmountRub,
  calculateAmountVirts,
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
  const [amountVirtValue, setAmountVirtValue] = useState(
    initialAmountVirts ? String(Number(initialAmountVirts) / 1_000_000) : "",
  );

  useEffect(() => {
    setAmountRubValue(initialAmountRub);
    setAmountVirtValue(
      initialAmountVirts ? String(Number(initialAmountVirts) / 1_000_000) : "",
    );
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

      const inKK = nextAmountVirts ? String(Number(nextAmountVirts) / 1_000_000) : "";
      setAmountVirtValue(inKK);
      onAmountsCommit(value, nextAmountVirts);
    },
    [exchangeRate, onAmountsCommit],
  );

  const handleAmountVirtChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const inKK = event.target.value;

      setAmountVirtValue(inKK);
      const rawVirts = inKK ? String(Number(inKK) * 1_000_000) : "";
      onAmountVirtInput(rawVirts);
    },
    [onAmountVirtInput],
  );

  const handleAmountVirtDebounce = useCallback(
    (value: string) => {
      const rawVirts = value ? String(Number(value) * 1_000_000) : "";
      const nextAmountRub = rawVirts
        ? calculateAmountRub(rawVirts, getVirtExchangeRate(exchangeRate))
        : "";

      setAmountRubValue(nextAmountRub);
      onAmountsCommit(nextAmountRub, rawVirts);
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
