export function formatNumberWithSpaces(number: number | string): string {
  const num = typeof number === "string" ? parseFloat(number) : number;

  if (isNaN(num)) {
    return "";
  }

  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function formatNumberShort(number: number | string): string {
  const num = typeof number === "string" ? parseFloat(number) : number;

  if (isNaN(num)) {
    return "0";
  }

  if (num >= 1000000) {
    return formatNumberWithSpaces((num / 1000000).toFixed(1)) + "M";
  } else if (num >= 1000) {
    return formatNumberWithSpaces((num / 1000).toFixed(1)) + "K";
  }

  return `${formatNumberWithSpaces(number)}`;
}

export const formatNumberDot = (value: string): string => {
  return value.replace(/,/g, ".");
};
