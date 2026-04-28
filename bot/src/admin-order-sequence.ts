import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE_PATH = resolve(__dirname, "../data/admin-order-seq.v1.json");

type StoreShape = { v: 1; next: number };

function load(): StoreShape {
  if (!existsSync(STORE_PATH)) {
    return { v: 1, next: 0 };
  }
  try {
    const j = JSON.parse(readFileSync(STORE_PATH, "utf8")) as unknown;
    if (
      typeof j === "object" &&
      j != null &&
      (j as StoreShape).v === 1 &&
      typeof (j as StoreShape).next === "number" &&
      Number.isFinite((j as StoreShape).next) &&
      (j as StoreShape).next >= 0
    ) {
      return j as StoreShape;
    }
  } catch {
    /* ignore */
  }
  return { v: 1, next: 0 };
}

/**
 * Следующий порядковый номер для админ-уведомления (только бот, клиентам не показываем).
 * Первый вызов даёт #1 и т.д.
 */
export function bumpAdminOrderSequence(): number {
  mkdirSync(dirname(STORE_PATH), { recursive: true });
  const s = load();
  s.next += 1;
  writeFileSync(STORE_PATH, JSON.stringify(s, null, 2), "utf8");
  return s.next;
}
