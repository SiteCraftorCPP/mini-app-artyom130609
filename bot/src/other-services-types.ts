/**
 * Каталог «Другие услуги» (v1) — дубли в мини-аппе: `src/shared/types/other-services-catalog.ts`
 *
 * Два уровня: Раздел (game) → Подраздел (main) → позиции (items). Вложенных subsections нет.
 */

export type OtherServicePaymentMode = "manager" | "info";

export type OtherServiceItem = {
  id: string;
  description: string;
  paymentMode: OtherServicePaymentMode;
  /** Показ в мини-аппе, если `paymentMode === "info"` */
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
  /** Название на плашке в мини-аппе */
  name: string;
  mainSections: OtherServiceMain[];
};

export type OtherServicesStoreV1 = {
  v: 1;
  games: OtherServiceGame[];
};
