import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type SupplyRow = {
  /** Внутренний id (uuid не нужен; показываем как порядковый номер). */
  id: string;
  /** Порядковый номер в актуальных поставках: 1..N (пересчитывается при рендере). */
  seq?: number;
  project: string;
  server: string;
  virtAmount: number;
  openedAtMs: number;
  closedAtMs?: number;
  /** Оборот (вводится при завершении), RUB */
  turnoverRub?: number;
  /** Чистая прибыль (вводится при завершении), RUB */
  profitRub?: number;
};

type StoreShapeV1 = {
  v: 1;
  supplies: SupplyRow[];
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE_PATH = resolve(__dirname, "../data/supplies.v1.json");

function safeParse(json: string): StoreShapeV1 | null {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (
      typeof parsed === "object" &&
      parsed != null &&
      // @ts-expect-error runtime check
      parsed.v === 1 &&
      // @ts-expect-error runtime check
      Array.isArray(parsed.supplies)
    ) {
      return parsed as StoreShapeV1;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function loadStore(): StoreShapeV1 {
  if (!existsSync(STORE_PATH)) {
    return { v: 1, supplies: [] };
  }
  const raw = readFileSync(STORE_PATH, "utf8");
  const parsed = safeParse(raw);
  return parsed ?? { v: 1, supplies: [] };
}

function saveStore(store: StoreShapeV1) {
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

function genId(): string {
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createSupply(input: {
  project: string;
  server: string;
  virtAmount: number;
  nowMs?: number;
}): SupplyRow {
  const store = loadStore();
  const nowMs = input.nowMs ?? Date.now();
  const row: SupplyRow = {
    id: genId(),
    project: input.project.trim(),
    server: input.server.trim(),
    virtAmount: input.virtAmount,
    openedAtMs: nowMs,
  };
  store.supplies.unshift(row);
  saveStore(store);
  return row;
}

export function closeSupply(
  id: string,
  input: { turnoverRub: number; profitRub: number; nowMs?: number },
): SupplyRow | null {
  const store = loadStore();
  const idx = store.supplies.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  const prev = store.supplies[idx]!;
  const nowMs = input.nowMs ?? Date.now();
  const next: SupplyRow = {
    ...prev,
    closedAtMs: nowMs,
    turnoverRub: input.turnoverRub,
    profitRub: input.profitRub,
  };
  store.supplies[idx] = next;
  saveStore(store);
  return next;
}

export function getSupplyById(id: string): SupplyRow | null {
  const store = loadStore();
  return store.supplies.find((s) => s.id === id) ?? null;
}

export function listActiveSupplies(): SupplyRow[] {
  const store = loadStore();
  const active = store.supplies.filter((s) => !s.closedAtMs);
  // Нумерация 1..N по текущему порядку (новые сверху)
  return active.map((s, i) => ({ ...s, seq: i + 1 }));
}

export function listClosedSupplies(): SupplyRow[] {
  const store = loadStore();
  return store.supplies.filter((s) => Boolean(s.closedAtMs));
}

export function listAllSupplies(): SupplyRow[] {
  const store = loadStore();
  return store.supplies.slice();
}

