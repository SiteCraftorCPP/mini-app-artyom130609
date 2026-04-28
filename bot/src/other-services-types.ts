/**
 * Каталог «Другие услуги» (v1) — дубли в мини-аппе: `src/shared/types/other-services-catalog.ts`
 *
 * Раздел (game) → опционально позиции на уровне раздела (`items`, если нет подразделов)
 * → подразделы (main) → позиции (items).
 */

export type OtherServicePaymentMode = "manager" | "info" | "pay";

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
  /** Показ в мини-аппе, если `paymentMode === "info"` */
  paymentInfo?: string;
  /** Если `paymentMode === "pay"` — кнопки «цена / оплатить» */
  payOptions?: OtherServicePayOption[];
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
  /** Позиции без подразделов (пока `mainSections` пуст). */
  items: OtherServiceItem[];
  mainSections: OtherServiceMain[];
};

export type OtherServicesStoreV1 = {
  v: 1;
  games: OtherServiceGame[];
};
