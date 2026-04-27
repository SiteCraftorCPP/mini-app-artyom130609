/**
 * Каталог «Другие услуги» (v1) — дублируйте согласованные поля в мини-аппе
 * `src/shared/types/other-services-catalog.ts`.
 */

export type OtherServicesDelivery = "manager" | "auto" | "manual";

export type OtherServiceItem = {
  id: string;
  description: string;
  price: string;
  delivery: OtherServicesDelivery;
  /** Текст при `auto` — заранее в админке, покупатель видит после оплаты/оформления. */
  autoText?: string;
  /** Подсказка админу при `manual` (какие данные вписать при выдаче). */
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

/** Одна игра = ключ как в `VIRTS_ICONS` / мини-аппе. */
export type OtherServiceGame = {
  projectKey: string;
  mainSections: OtherServiceMain[];
};

export type OtherServicesStoreV1 = {
  v: 1;
  games: OtherServiceGame[];
};
