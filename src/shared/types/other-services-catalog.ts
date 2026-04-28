/** Согласовано с `bot/src/other-services-types.ts` и JSON `get_other_services`. */

/** `info` / `pay` — legacy. */
export type OtherServicePaymentMode =
  | "manager"
  | "auto"
  | "manual"
  | "info"
  | "pay";

export type OtherServicePayOption = {
  id: string;
  priceLabel: string;
  payUrl: string;
  payLabel?: string;
};

export type OtherServiceItem = {
  id: string;
  description: string;
  paymentMode: OtherServicePaymentMode;
  paymentInfo?: string;
  payOptions?: OtherServicePayOption[];
  deliverText?: string;
  amountRub?: number;
};

export type OtherServiceMain = {
  id: string;
  name: string;
  description?: string;
  items: OtherServiceItem[];
};

export type OtherServiceGame = {
  id: string;
  name: string;
  items: OtherServiceItem[];
  mainSections: OtherServiceMain[];
};

export type OtherServicesCatalogV1 = {
  v: 1;
  games: OtherServiceGame[];
};
