export const VIRT_REQUEST_FORM_CLASSNAMES = {
  /** Плотнее блок подпись → поле (как до увеличения высоты input). */
  formItem: "relative space-y-1",
  formMessage: "absolute left-0 top-full text-xs leading-none",
} as const;

export const VIRT_REQUEST_FORM_DEFAULTS = {
  zeroAmountFallback: "0",
} as const;

export const getAccountNumberPlaceholder = (virtName: string) =>
  `Номер банковского счета ${virtName}`;
