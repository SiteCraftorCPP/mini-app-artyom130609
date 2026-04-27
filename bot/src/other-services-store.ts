import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type {
  OtherServiceGame,
  OtherServiceItem,
  OtherServiceMain,
  OtherServiceSubsection,
  OtherServicesStoreV1,
} from "./other-services-types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../data");
const STORE_PATH = resolve(DATA_DIR, "other-services.v1.json");

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

const LEGACY_GAME_LABEL: Record<string, string> = {
  "black-russia": "Black Russia",
  "matryoshka-rp": "Матрешка РП",
  "gta-v-rp": "GTA V RP",
  "majestic-rp": "Majestic RP",
  "arizona-rp": "Arizona RP",
  "radmir-rp": "Radmir RP",
  "province-rp": "Province RP",
  "amazing-rp": "Amazing RP",
  "grand-mobile-rp": "Grand Mobile RP",
};

function migrateItem(raw: unknown): OtherServiceItem {
  if (!raw || typeof raw !== "object") {
    return { id: genId("i"), description: "", paymentMode: "manager" };
  }
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : genId("i");
  const description = typeof o.description === "string" ? o.description : "";
  if (o.paymentMode === "manager" || o.paymentMode === "info") {
    return {
      id,
      description,
      paymentMode: o.paymentMode,
      paymentInfo: typeof o.paymentInfo === "string" ? o.paymentInfo : undefined,
    };
  }
  const del = o.delivery;
  if (del === "manager") {
    return { id, description, paymentMode: "manager" };
  }
  if (del === "auto" && typeof o.autoText === "string") {
    return { id, description, paymentMode: "info", paymentInfo: o.autoText };
  }
  if (del === "manual") {
    const h = o.manualAdminHint;
    return {
      id,
      description,
      paymentMode: "info",
      paymentInfo: typeof h === "string" && h ? h : "Выдача вручную после оплаты",
    };
  }
  return { id, description, paymentMode: "manager" };
}

function migrateSubsection(raw: unknown): OtherServiceSubsection {
  if (!raw || typeof raw !== "object") {
    return { id: genId("s"), name: "", items: [] };
  }
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : genId("s");
  const name = typeof o.name === "string" ? o.name : "";
  const items = Array.isArray(o.items) ? o.items.map(migrateItem) : [];
  return { id, name, items };
}

function migrateMain(raw: unknown): OtherServiceMain {
  if (!raw || typeof raw !== "object") {
    return { id: genId("m"), name: "", subsections: [], items: [] };
  }
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : genId("m");
  const name = typeof o.name === "string" ? o.name : "";
  const subsections = Array.isArray(o.subsections) ? o.subsections.map(migrateSubsection) : [];
  const items = Array.isArray(o.items) ? o.items.map(migrateItem) : [];
  return { id, name, subsections, items };
}

function migrateGame(raw: unknown): OtherServiceGame {
  if (!raw || typeof raw !== "object") {
    return { id: genId("g"), name: "Игра", mainSections: [] };
  }
  const o = raw as Record<string, unknown>;
  const id =
    typeof o.id === "string" ? o.id : typeof o.projectKey === "string" ? o.projectKey : genId("g");
  const name =
    typeof o.name === "string"
      ? o.name
      : typeof o.projectKey === "string"
        ? (LEGACY_GAME_LABEL[o.projectKey] ?? o.projectKey)
        : "Игра";
  const mainSections = Array.isArray(o.mainSections) ? o.mainSections.map(migrateMain) : [];
  return { id, name, mainSections };
}

function migrateStore(raw: unknown): OtherServicesStoreV1 {
  if (!raw || typeof raw !== "object") {
    return { v: 1, games: [] };
  }
  const o = raw as Record<string, unknown>;
  if (o.v !== 1 || !Array.isArray(o.games)) {
    return { v: 1, games: [] };
  }
  return { v: 1, games: o.games.map(migrateGame) };
}

function safeLoad(): OtherServicesStoreV1 {
  if (!existsSync(STORE_PATH)) {
    return { v: 1, games: [] };
  }
  try {
    const raw = readFileSync(STORE_PATH, "utf8");
    const p = JSON.parse(raw) as unknown;
    return migrateStore(p);
  } catch {
    return { v: 1, games: [] };
  }
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

export function getGameById(gameId: string): OtherServiceGame | undefined {
  return safeLoad().games.find((g) => g.id === gameId);
}

export function createGame(name: string): OtherServiceGame {
  const s = safeLoad();
  const g: OtherServiceGame = { id: genId("g"), name: name.trim() || "Без названия", mainSections: [] };
  s.games.push(g);
  save(s);
  return g;
}

export function removeGame(gameId: string): boolean {
  const s = safeLoad();
  const before = s.games.length;
  s.games = s.games.filter((g) => g.id !== gameId);
  if (s.games.length === before) {
    return false;
  }
  save(s);
  return true;
}

export function addMainSection(gameId: string, name: string): OtherServiceMain | null {
  const s = safeLoad();
  const g = s.games.find((x) => x.id === gameId);
  if (!g) {
    return null;
  }
  const m: OtherServiceMain = {
    id: genId("m"),
    name: name.trim() || "Раздел",
    subsections: [],
    items: [],
  };
  g.mainSections.push(m);
  save(s);
  return m;
}

export function removeMainSection(gameId: string, mainId: string): boolean {
  const s = safeLoad();
  const g = s.games.find((x) => x.id === gameId);
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

export function addSubsection(gameId: string, mainId: string, name: string): OtherServiceSubsection | null {
  const s = safeLoad();
  const g = s.games.find((x) => x.id === gameId);
  const m = g?.mainSections.find((x) => x.id === mainId);
  if (!g || !m) {
    return null;
  }
  if (m.items.length > 0) {
    return null;
  }
  const sub: OtherServiceSubsection = { id: genId("s"), name: name.trim() || "Подраздел", items: [] };
  m.subsections.push(sub);
  save(s);
  return sub;
}

export function removeSubsection(gameId: string, mainId: string, subId: string): boolean {
  const s = safeLoad();
  const g = s.games.find((x) => x.id === gameId);
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

function makeItem(input: { description: string; paymentMode: "manager" | "info"; paymentInfo?: string }): OtherServiceItem {
  const it: OtherServiceItem = {
    id: genId("i"),
    description: input.description.trim(),
    paymentMode: input.paymentMode,
  };
  if (input.paymentMode === "info" && input.paymentInfo?.trim()) {
    it.paymentInfo = input.paymentInfo.trim();
  }
  return it;
}

/** Товар в корне раздела (только если подразделов нет) */
export function addItemToMain(
  gameId: string,
  mainId: string,
  input: { description: string; paymentMode: "manager" | "info"; paymentInfo?: string },
): OtherServiceItem | null {
  const s = safeLoad();
  const g = s.games.find((x) => x.id === gameId);
  const m = g?.mainSections.find((x) => x.id === mainId);
  if (!g || !m) {
    return null;
  }
  if (m.subsections.length > 0) {
    return null;
  }
  const it = makeItem(input);
  m.items.push(it);
  save(s);
  return it;
}

export function addItemToSub(
  gameId: string,
  mainId: string,
  subId: string,
  input: { description: string; paymentMode: "manager" | "info"; paymentInfo?: string },
): OtherServiceItem | null {
  const s = safeLoad();
  const g = s.games.find((x) => x.id === gameId);
  const m = g?.mainSections.find((x) => x.id === mainId);
  const sub = m?.subsections.find((x) => x.id === subId);
  if (!g || !m || !sub) {
    return null;
  }
  const it = makeItem(input);
  sub.items.push(it);
  save(s);
  return it;
}

export function removeItemFromMain(gameId: string, mainId: string, itemId: string): boolean {
  const s = safeLoad();
  const g = s.games.find((x) => x.id === gameId);
  const m = g?.mainSections.find((x) => x.id === mainId);
  if (!g || !m) {
    return false;
  }
  const n = m.items.length;
  m.items = m.items.filter((i) => i.id !== itemId);
  if (m.items.length === n) {
    return false;
  }
  save(s);
  return true;
}

export function removeItemFromSub(
  gameId: string,
  mainId: string,
  subId: string,
  itemId: string,
): boolean {
  const s = safeLoad();
  const g = s.games.find((x) => x.id === gameId);
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
