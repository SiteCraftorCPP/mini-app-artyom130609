import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type {
  OtherServiceGame,
  OtherServiceItem,
  OtherServiceMain,
  OtherServiceSubsection,
  OtherServicesDelivery,
  OtherServicesStoreV1,
} from "./other-services-types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../data");
const STORE_PATH = resolve(DATA_DIR, "other-services.v1.json");

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function safeLoad(): OtherServicesStoreV1 {
  if (!existsSync(STORE_PATH)) {
    return { v: 1, games: [] };
  }
  try {
    const raw = readFileSync(STORE_PATH, "utf8");
    const p = JSON.parse(raw) as unknown;
    if (
      typeof p === "object" &&
      p != null &&
      (p as OtherServicesStoreV1).v === 1 &&
      Array.isArray((p as OtherServicesStoreV1).games)
    ) {
      return p as OtherServicesStoreV1;
    }
  } catch {
    /* ignore */
  }
  return { v: 1, games: [] };
}

function save(data: OtherServicesStoreV1) {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf8");
}

export function getOtherServicesV1(): OtherServicesStoreV1 {
  return safeLoad();
}

export function setOtherServicesV1(data: OtherServicesStoreV1) {
  save({ ...data, v: 1 });
}

export function getGame(projectKey: string): OtherServiceGame | undefined {
  return safeLoad().games.find((g) => g.projectKey === projectKey);
}

export function upsertEmptyGame(projectKey: string): OtherServiceGame {
  const s = safeLoad();
  const i = s.games.findIndex((g) => g.projectKey === projectKey);
  if (i >= 0) {
    return s.games[i]!;
  }
  const g: OtherServiceGame = { projectKey, mainSections: [] };
  s.games.push(g);
  save(s);
  return g;
}

export function removeGame(projectKey: string): boolean {
  const s = safeLoad();
  const before = s.games.length;
  s.games = s.games.filter((g) => g.projectKey !== projectKey);
  if (s.games.length === before) {
    return false;
  }
  save(s);
  return true;
}

export function addMainSection(projectKey: string, name: string): OtherServiceMain | null {
  const s = safeLoad();
  const g = s.games.find((x) => x.projectKey === projectKey);
  if (!g) {
    return null;
  }
  const m: OtherServiceMain = { id: genId("m"), name: name.trim(), subsections: [] };
  g.mainSections.push(m);
  save(s);
  return m;
}

export function removeMainSection(projectKey: string, mainId: string): boolean {
  const s = safeLoad();
  const g = s.games.find((x) => x.projectKey === projectKey);
  if (!g) {
    return false;
  }
  const n = g.mainSections.length;
  g.mainSections = g.mainSections.filter((m) => m.id !== mainId);
  if (g.mainSections.length === n) {
    return false;
  }
  save(s);
  return true;
}

export function addSubsection(
  projectKey: string,
  mainId: string,
  name: string,
): OtherServiceSubsection | null {
  const s = safeLoad();
  const g = s.games.find((x) => x.projectKey === projectKey);
  const m = g?.mainSections.find((x) => x.id === mainId);
  if (!g || !m) {
    return null;
  }
  const sub: OtherServiceSubsection = { id: genId("s"), name: name.trim(), items: [] };
  m.subsections.push(sub);
  save(s);
  return sub;
}

export function removeSubsection(projectKey: string, mainId: string, subId: string): boolean {
  const s = safeLoad();
  const g = s.games.find((x) => x.projectKey === projectKey);
  const m = g?.mainSections.find((x) => x.id === mainId);
  if (!g || !m) {
    return false;
  }
  const n = m.subsections.length;
  m.subsections = m.subsections.filter((s) => s.id !== subId);
  if (m.subsections.length === n) {
    return false;
  }
  save(s);
  return true;
}

export function addItem(
  projectKey: string,
  mainId: string,
  subId: string,
  input: {
    description: string;
    price: string;
    delivery: OtherServicesDelivery;
    autoText?: string;
    manualAdminHint?: string;
  },
): OtherServiceItem | null {
  const s = safeLoad();
  const g = s.games.find((x) => x.projectKey === projectKey);
  const m = g?.mainSections.find((x) => x.id === mainId);
  const sub = m?.subsections.find((x) => x.id === subId);
  if (!g || !m || !sub) {
    return null;
  }
  const it: OtherServiceItem = {
    id: genId("i"),
    description: input.description.trim(),
    price: input.price.trim(),
    delivery: input.delivery,
    ...(input.delivery === "auto" && input.autoText
      ? { autoText: input.autoText.trim() }
      : {}),
    ...(input.delivery === "manual" && input.manualAdminHint
      ? { manualAdminHint: input.manualAdminHint.trim() }
      : {}),
  };
  sub.items.push(it);
  save(s);
  return it;
}

export function removeItem(
  projectKey: string,
  mainId: string,
  subId: string,
  itemId: string,
): boolean {
  const s = safeLoad();
  const g = s.games.find((x) => x.projectKey === projectKey);
  const m = g?.mainSections.find((x) => x.id === mainId);
  const sub = m?.subsections.find((x) => x.id === subId);
  if (!g || !m || !sub) {
    return false;
  }
  const n = sub.items.length;
  sub.items = sub.items.filter((i) => i.id !== itemId);
  if (sub.items.length === n) {
    return false;
  }
  save(s);
  return true;
}
