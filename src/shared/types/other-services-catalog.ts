/** Согласовано с `bot/src/other-services-types.ts` и JSON `get_other_services`. */

export type OtherServicePaymentMode = "manager" | "info";

export type OtherServiceItem = {
  id: string;
  description: string;
  paymentMode: OtherServicePaymentMode;
  paymentInfo?: string;
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
  mainSections: OtherServiceMain[];
};

export type OtherServicesCatalogV1 = {
  v: 1;
  games: OtherServiceGame[];
};
