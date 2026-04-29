import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { PendingPaymentOrder } from "./payment-pending-store.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE_PATH = resolve(__dirname, "../data/kzt-receipt-sessions.v1.json");

export type KztSessionState = "await_photo" | "await_admin";

export type KztSession = {
  token: string;
  telegramUserId: number;
  state: KztSessionState;
  pending: PendingPaymentOrder;
  createdAt: number;
  receiptFileId?: string;
};

type FileShape = { v: 1; sessions: Record<string, KztSession> };

const sessions = new Map<string, KztSession>();

function loadFromDisk(): void {
  if (!existsSync(STORE_PATH)) {
    return;
  }
  try {
    const raw = readFileSync(STORE_PATH, "utf8");
    const j = JSON.parse(raw) as FileShape;
    if (j?.v !== 1 || typeof j.sessions !== "object" || j.sessions == null) {
      return;
    }
    for (const [k, v] of Object.entries(j.sessions)) {
      if (v && typeof v === "object" && v.token === k) {
        sessions.set(k, v);
      }
    }
  } catch {
    /* ignore */
  }
}

function persist(): void {
  mkdirSync(dirname(STORE_PATH), { recursive: true });
  const payload: FileShape = {
    v: 1,
    sessions: Object.fromEntries(sessions),
  };
  writeFileSync(STORE_PATH, JSON.stringify(payload, null, 2), "utf8");
}

loadFromDisk();

export function putKztSession(token: string, session: KztSession): void {
  sessions.set(token, session);
  persist();
}

export function getKztSession(token: string): KztSession | undefined {
  return sessions.get(token);
}

export function deleteKztSession(token: string): void {
  sessions.delete(token);
  persist();
}

export function updateKztSession(token: string, patch: Partial<KztSession>): void {
  const cur = sessions.get(token);
  if (!cur) {
    return;
  }
  sessions.set(token, { ...cur, ...patch });
  persist();
}
