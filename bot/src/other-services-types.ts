/**
 * Каталог «Другие услуги» (v1) — дубли в мини-аппе: `src/shared/types/other-services-catalog.ts`
 */

/** `info` / `pay` — legacy в старых JSON. */
export type OtherServicePaymentMode = "manager" | "auto" | "manual" | "info" | "pay";

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
  /** Legacy: произвольный текст после «текста» в админке */
  paymentInfo?: string;
  /** Legacy: внешние ссылки оплаты */
  payOptions?: OtherServicePayOption[];
  /** Автовыдача: текст в ЛС после оплаты FreeKassa */
  deliverText?: string;
  /** Авто / ручная — сумма ₽ (оплата через FreeKassa в мини-аппе) */
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

export type OtherServicesStoreV1 = {
  v: 1;
  games: OtherServiceGame[];
};
