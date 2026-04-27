export type VirtGradientToken =
  | "blue"
  | "dark"
  | "pink"
  | "purple"
  | "red"
  | "yellow"
  | "orange"
  | "grey"
  | "gold";

export type AccountPurchaseOption = {
  amountRub: number;
  id: string;
  label: string;
};

export type AccountVirtsCustomPricing = {
  /** ₽ за каждые 1кк виртов на аккаунте */
  rubPerKk: number;
  /** ₽ фиксировано за сам аккаунт (к любой сумме кк) */
  accountFeeRub: number;
};

export type Virt = {
  accountNumber: string;
  accountLevelOptions?: AccountPurchaseOption[];
  /**
   * Фиксированные варианты «по виртам» (дропдаун). Не задавать вместе с
   * `accountVirtsCustomPricing`.
   */
  accountVirtOptions?: AccountPurchaseOption[];
  /**
   * Произвольное кол-во кк на аккаунте; цена: kk * rubPerKk + accountFeeRub
   * (только Black Russia).
   */
  accountVirtsCustomPricing?: AccountVirtsCustomPricing;
  amountRub: number;
  amountVirts: number;
  exchangeRate: number;
  gradientToken: VirtGradientToken;
  id: string;
  logo: string | null;
  minAmountRub: number;
  name: string;
  promoCode: string;
  serverLabel: string;
  serverOptions: string[];
  slug: string;
};
