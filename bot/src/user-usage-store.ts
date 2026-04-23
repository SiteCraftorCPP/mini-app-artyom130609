import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type UserUsageRecord = {
  /** Unix ms */
  firstSeenAt: number;
  /** Unix ms */
  lastSeenAt: number;
};

type StoreShapeV1 = {
  v: 1;
  users: Record<string, UserUsageRecord>;
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE_PATH = resolve(__dirname, "../data/user-usage.v1.json");

function safeParse(json: string): StoreShapeV1 | null {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (
      typeof parsed === "object" &&
      parsed != null &&
      // @ts-expect-error runtime check
      parsed.v === 1 &&
      // @ts-expect-error runtime check
      typeof parsed.users === "object" &&
      // @ts-expect-error runtime check
      parsed.users != null
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
    return { v: 1, users: {} };
  }
  const raw = readFileSync(STORE_PATH, "utf8");
  const parsed = safeParse(raw);
  return parsed ?? { v: 1, users: {} };
}

function saveStore(store: StoreShapeV1) {
  mkdirSync(dirname(STORE_PATH), { recursive: true });
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export function touchUserUsage(telegramUserId: number, now = Date.now()) {
  const store = loadStore();
  const key = String(telegramUserId);
  const prev = store.users[key];
  if (!prev) {
    store.users[key] = { firstSeenAt: now, lastSeenAt: now };
  } else {
    store.users[key] = { firstSeenAt: prev.firstSeenAt, lastSeenAt: now };
  }
  saveStore(store);
}

export function getUniqueUserCount(): number {
  const store = loadStore();
  return Object.keys(store.users).length;
}

export function getAllUserIds(): number[] {
  const store = loadStore();
  const ids: number[] = [];
  for (const k of Object.keys(store.users)) {
    const n = Number(k);
    if (Number.isFinite(n) && n > 0) ids.push(n);
  }
  return ids;
}

