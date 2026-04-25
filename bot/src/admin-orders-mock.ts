/**
 * Тип и хелперы для админки заказов. Данные — в `orders-store` (JSON на диске).
 */
export type { AdminOrderRow } from "./orders-store.js";

const HISTORY_50_PAGE_SIZE = 8;

import {
  getActiveOrders,
  getAdminOrderByIdFromStore,
  getHistory50PageCount as getHistory50PageCountFromStore,
  getHistory50Slice as getHistory50SliceFromStore,
  getClosedOrders,
} from "./orders-store.js";

export { getActiveOrders, getClosedOrders };

/** @deprecated используйте getActiveOrders — оставлено для старых импортов */
export const ADMIN_ORDERS_MOCK: never[] = [];

export const ADMIN_ORDERS_ARCHIVE: never[] = [];
export const ADMIN_ORDERS_LAST_50: never[] = [];

export function getHistory50Slice(page: number) {
  return getHistory50SliceFromStore(page, HISTORY_50_PAGE_SIZE);
}

export function getHistory50PageCount(): number {
  return getHistory50PageCountFromStore(HISTORY_50_PAGE_SIZE);
}

export function normalizeOrderIdForLookup(s: string): string {
  return s.trim().replace(/^#+/, "");
}

export function getAdminOrderById(id: string) {
  return getAdminOrderByIdFromStore(id);
}
