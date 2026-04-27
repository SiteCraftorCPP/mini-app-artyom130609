import { formatNumberDot } from "@/shared/lib/format-numbers";

const THOUSAND_SUFFIXES = ["k", "к"];
const MILLION_SUFFIXES = ["kk", "кк", "m", "м"];

const parseAmountWithSuffix = (value: string) => {
  const normalizedValue = formatNumberDot(value).trim().toLowerCase();

  const millionSuffix = MILLION_SUFFIXES.find((suffix) =>
    normalizedValue.endsWith(suffix),
  );
  if (millionSuffix) {
    return (
      Number(
        normalizedValue
          .slice(0, -millionSuffix.length)
          .replace(/[^\d.]/g, ""),
      ) * 1_000_000
    );
  }

  const thousandSuffix = THOUSAND_SUFFIXES.find((suffix) =>
    normalizedValue.endsWith(suffix),
  );
  if (thousandSuffix) {
    return (
      Number(
        normalizedValue
          .slice(0, -thousandSuffix.length)
          .replace(/[^\d.]/g, ""),
      ) * 1_000
    );
  }

  return Number(normalizedValue.replace(/[^\d.]/g, ""));
};

const normalizeAmount = (value: string) => {
  const normalizedAmount = parseAmountWithSuffix(value);

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    return 0;
  }

  return normalizedAmount;
};

export const calculateAmountVirts = (
  amountRubValue: string,
  exchangeRate: { amountRub: number; amountVirts: number },
) => {
  const normalizedAmountRub = normalizeAmount(amountRubValue);

  if (exchangeRate.amountRub <= 0) {
    return "0";
  }

  return String(
    Math.round(
      (normalizedAmountRub * exchangeRate.amountVirts) / exchangeRate.amountRub,
    ),
  );
};

export const calculateAmountRub = (
  amountVirtsValue: string,
  exchangeRate: { amountRub: number; amountVirts: number },
) => {
  const normalizedAmountVirts = normalizeAmount(amountVirtsValue);

  if (exchangeRate.amountVirts <= 0) {
    return "0";
  }

  return String(
    Number(
      (
        (normalizedAmountVirts * exchangeRate.amountRub) /
        exchangeRate.amountVirts
      ).toFixed(2),
    ),
  );
};

const trimTrailingZeros = (value: number) =>
  value.toFixed(1).replace(/\.0$/, "");

export const formatAmountVirtsShort = (value: string) => {
  const normalizedAmount = normalizeAmount(value);

  if (!normalizedAmount) {
    return "";
  }

  if (normalizedAmount >= 1_000_000) {
    return `${trimTrailingZeros(normalizedAmount / 1_000_000)}кк`;
  }

  if (normalizedAmount >= 1_000) {
    return `${trimTrailingZeros(normalizedAmount / 1_000)}к`;
  }

  return String(normalizedAmount);
};

/** Отображение КК и согласованных целых виртов при пересчёте из ₽ (округление до 0.1 КК). */
export function roundKkTenthsFromVirts(virtsStr: string): {
  kkDisplay: string;
  virtsRounded: string;
} {
  if (!virtsStr.trim()) {
    return { kkDisplay: "", virtsRounded: "" };
  }
  const virts = Number(virtsStr);
  if (!Number.isFinite(virts) || virts < 0) {
    return { kkDisplay: "", virtsRounded: "0" };
  }
  const kk = virts / 1_000_000;
  const kkRounded = Math.round(kk * 10) / 10;
  const virtsRounded = String(Math.round(kkRounded * 1_000_000));
  return { kkDisplay: String(kkRounded), virtsRounded };
}
