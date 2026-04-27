/** Согласовано с `bot/src/other-services-types.ts` и JSON `get_other_services`. */

export type OtherServicesDelivery = "manager" | "auto" | "manual";

export type OtherServiceItem = {
  id: string;
  description: string;
  price: string;
  delivery: OtherServicesDelivery;
  autoText?: string;
  manualAdminHint?: string;
};

export type OtherServiceSubsection = {
  id: string;
  name: string;
  items: OtherServiceItem[];
};

export type OtherServiceMain = {
  id: string;
  name: string;
  subsections: OtherServiceSubsection[];
};

export type OtherServiceGame = {
  projectKey: string;
  mainSections: OtherServiceMain[];
};

export type OtherServicesCatalogV1 = {
  v: 1;
  games: OtherServiceGame[];
};
