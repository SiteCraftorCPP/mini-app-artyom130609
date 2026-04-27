import { useCallback, useEffect, useState } from "react";

import { DEFAULT } from "@/shared/constants/default";

import {
  calculateAmountRub,
  calculateAmountVirts,
  roundKkTenthsFromVirts,
} from "@/features/virt/model";

const getVirtExchangeRate = (exchangeRate: number) => ({
  amountRub: exchangeRate,
  amountVirts: DEFAULT.MIN_AMOUNT_VIRT,
});

type UseVirtAmountFieldsParams = {
  exchangeRate: number;
  lastEditedForAmount: "amountRub" | "amountVirts";
  /** Промо: КК фиксировано, в ₫ пересчёт при смене курса. */
  lockVirtsForPromo: boolean;
  initialAmountRub: string;
  initialAmountVirts: string;
  onAmountRubInput: (value: string) => void;
  onAmountVirtInput: (value: string) => void;
  onAmountsCommit: (amountRub: string, amountVirts: string) => void;
};

export const useVirtAmountFields = ({
  exchangeRate,
  lastEditedForAmount,
  lockVirtsForPromo,
  initialAmountRub,
  initialAmountVirts,
  onAmountRubInput,
  onAmountVirtInput,
  onAmountsCommit,
}: UseVirtAmountFieldsParams) => {
  const [amountRubValue, setAmountRubValue] = useState(initialAmountRub);
  const [amountVirtValue, setAmountVirtValue] = useState(
    initialAmountVirts
      ? roundKkTenthsFromVirts(initialAmountVirts).kkDisplay
      : "",
  );

  useEffect(() => {
    setAmountRubValue(initialAmountRub);
    setAmountVirtValue(
      initialAmountVirts ? roundKkTenthsFromVirts(initialAmountVirts).kkDisplay : "",
    );
  }, [initialAmountRub, initialAmountVirts]);

  // При скидочном курсе (промо) эффективный курс меняется — пересчитываем
  // «вторую» величину, иначе локальный state не совпадёт с формой/итогом.
  useEffect(() => {
    if (lockVirtsForPromo && amountVirtValue.trim() !== "") {
      const n = Number(amountVirtValue);
      if (Number.isNaN(n) || n <= 0) {
        return;
      }
      const rawVirts = String(n * 1_000_000);
      const nextAmountRub = calculateAmountRub(
        rawVirts,
        getVirtExchangeRate(exchangeRate),
      );
      setAmountRubValue(nextAmountRub);
      onAmountsCommit(nextAmountRub, rawVirts);
      return;
    }
    if (lastEditedForAmount === "amountRub" && amountRubValue.trim() !== "") {
      const nextAmountVirts = calculateAmountVirts(
        amountRubValue,
        getVirtExchangeRate(exchangeRate),
      );
      const { kkDisplay, virtsRounded } = roundKkTenthsFromVirts(nextAmountVirts);
      setAmountVirtValue(kkDisplay);
      onAmountsCommit(amountRubValue, virtsRounded);
      return;
    }
    if (lastEditedForAmount === "amountVirts" && amountVirtValue.trim() !== "") {
      const n = Number(amountVirtValue);
      if (Number.isNaN(n) || n <= 0) {
        return;
      }
      const rawVirts = String(n * 1_000_000);
      const nextAmountRub = calculateAmountRub(
        rawVirts,
        getVirtExchangeRate(exchangeRate),
      );
      setAmountRubValue(nextAmountRub);
      onAmountsCommit(nextAmountRub, rawVirts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- намеренно только при смене курса (в т.ч. промо)
  }, [exchangeRate, lockVirtsForPromo]);

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
      const { kkDisplay, virtsRounded } = roundKkTenthsFromVirts(nextAmountVirts);
      setAmountVirtValue(kkDisplay);
      onAmountsCommit(value, virtsRounded);
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
