export type VirtGradientToken =
  | "amazing"
  | "blue"
  | "dark"
  | "pink"
  | "province"
  | "purple"
  | "radmir"
  | "red"
  | "yellow";

export type AccountPurchaseOption = {
  amountRub: number;
  id: string;
  label: string;
};

export type AccountVirtsCustomPricing = {
  rubPerKk: number;
  accountFeeRub: number;
};

export type Virt = {
  accountNumber: string;
  accountLevelOptions?: AccountPurchaseOption[];
  accountVirtOptions?: AccountPurchaseOption[];
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
