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

export type Virt = {
  accountNumber: string;
  accountLevelOptions?: AccountPurchaseOption[];
  accountVirtOptions?: AccountPurchaseOption[];
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
