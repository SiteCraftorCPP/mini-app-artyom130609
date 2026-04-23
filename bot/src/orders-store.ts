import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parseRublesAmountFromUserText } from "./money-input.js";

export type AdminOrderRow = {
  id: string;
  publicOrderId: string;
  categoryLabel: string;
  telegramUsername: string;
  telegramUserId: string;
  game: string;
  server: string;
  virtAmountLabel: string;
  transferMethod: string;
  bankAccount: string;
  /** Сумма заказа в RUB (не перезаписывается при фиксации прибыли). */
  amountRub: number;
  openedAtLine: string;
  closedAtLine?: string;
  /** Чистая прибыль по заказу (RUB), вводит админ при закрытии. */
  profitRub?: number;
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE_PATH = resolve(__dirname, "../data/admin-orders.v1.json");

type StoreShapeV1 = {
  v: 1;
  /** Актуальные (в выдачу) */
  active: AdminOrderRow[];
  /** Завершённые (самые новые в начале) */
  closed: AdminOrderRow[];
};

function safeParse(json: string): StoreShapeV1 | null {
  try {
    const p = JSON.parse(json) as unknown;
    if (
      typeof p === "object" &&
      p != null &&
      (p as StoreShapeV1).v === 1 &&
      Array.isArray((p as StoreShapeV1).active) &&
      Array.isArray((p as StoreShapeV1).closed)
    ) {
      return p as StoreShapeV1;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function coerceAmountRub(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw;
  }
  if (typeof raw === "string") {
    const n = parseRublesAmountFromUserText(raw);
    if (n !== null) {
      return n;
    }
  }
  return 0;
}

function coerceProfitRub(raw: unknown): number | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw;
  }
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = parseRublesAmountFromUserText(raw);
    if (n !== null) {
      return n;
    }
  }
  return undefined;
}

function normalizeOrderRow(o: AdminOrderRow): AdminOrderRow {
  return {
    ...o,
    amountRub: coerceAmountRub((o as AdminOrderRow).amountRub),
    profitRub: coerceProfitRub((o as AdminOrderRow).profitRub),
  };
}

function loadStore(): StoreShapeV1 {
  if (!existsSync(STORE_PATH)) {
    return { v: 1, active: [], closed: [] };
  }
  const raw = readFileSync(STORE_PATH, "utf8");
  const parsed = safeParse(raw) ?? { v: 1, active: [], closed: [] };
  return {
    v: 1,
    active: parsed.active.map((row) => normalizeOrderRow(row)),
    closed: parsed.closed.map((row) => normalizeOrderRow(row)),
  };
}

function saveStore(s: StoreShapeV1) {
  mkdirSync(dirname(STORE_PATH), { recursive: true });
  writeFileSync(STORE_PATH, JSON.stringify(s, null, 2), "utf8");
}

function normalizeId(s: string): string {
  return s.trim().replace(/^#+/, "");
}

function orderMatchesId(o: AdminOrderRow, n: string): boolean {
  return normalizeId(o.id) === n || normalizeId(o.publicOrderId) === n;
}

export function getActiveOrders(): AdminOrderRow[] {
  return loadStore().active.slice();
}

/** Все завершённые (новые сверху), для «История 50» — слайсы. */
export function getClosedOrders(): AdminOrderRow[] {
  return loadStore().closed.slice();
}

export function getAdminOrderByIdFromStore(id: string): AdminOrderRow | undefined {
  const n = normalizeId(id);
  const s = loadStore();
  return (
    s.active.find((o) => orderMatchesId(o, n)) ||
    s.closed.find((o) => orderMatchesId(o, n))
  );
}

/**
 * Создать/обновить актуальный заказ (после оплаты / успешной заявки в мини-аппе).
 */
export function addOrUpdateActiveOrder(row: AdminOrderRow): void {
  const s = loadStore();
  const nId = normalizeId(row.id);
  const nPub = normalizeId(row.publicOrderId);
  const idx = s.active.findIndex(
    (o) => orderMatchesId(o, nId) || orderMatchesId(o, nPub),
  );
  if (idx >= 0) {
    s.active[idx] = row;
  } else {
    s.active.unshift(row);
  }
  saveStore(s);
}

/**
 * Админ ввёл чистую прибыль — заказ уходит в завершённые.
 */
export function closeActiveOrder(
  publicOrInternalId: string,
  closedAtLine: string,
  options?: { profitRub?: number },
): AdminOrderRow | null {
  const n = normalizeId(publicOrInternalId);
  const s = loadStore();
  const idx = s.active.findIndex((o) => orderMatchesId(o, n));
  if (idx < 0) {
    return null;
  }
  const [row] = s.active.splice(idx, 1);
  if (!row) {
    return null;
  }
  const closed: AdminOrderRow = {
    ...row,
    closedAtLine,
    ...(options?.profitRub !== undefined
      ? { profitRub: options.profitRub }
      : {}),
  };
  s.closed.unshift(closed);
  const max = 200;
  if (s.closed.length > max) {
    s.closed.length = max;
  }
  saveStore(s);
  return closed;
}

export function getHistory50Slice(
  page: number,
  pageSize: number,
): AdminOrderRow[] {
  const closed = loadStore().closed;
  const start = page * pageSize;
  return closed.slice(start, start + pageSize);
}

export function getHistory50PageCount(pageSize: number): number {
  const n = loadStore().closed.length;
  if (n === 0) {
    return 0;
  }
  return Math.ceil(n / pageSize);
}
