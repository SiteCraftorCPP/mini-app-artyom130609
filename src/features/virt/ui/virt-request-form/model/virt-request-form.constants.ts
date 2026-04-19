export const VIRT_REQUEST_FORM_CLASSNAMES = {
  formItem: "relative space-y-2",
  formMessage: "absolute left-0 top-full text-xs leading-none",
} as const;

export const VIRT_REQUEST_FORM_DEFAULTS = {
  zeroAmountFallback: "0",
} as const;

export const getAccountNumberPlaceholder = (virtName: string) =>
  `Номер банковского счета ${virtName}`;
