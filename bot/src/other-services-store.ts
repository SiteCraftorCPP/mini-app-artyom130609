import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

import type {
  OtherServiceGame,
  OtherServiceItem,
  OtherServiceMain,
  OtherServicesStoreV1,
} from "./other-services-types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const BUILTIN_DEFAULT = resolve(__dirname, "../data", "other-services.v1.json");

/**
 * Каталог «Другие услуги» — JSON на диске.
 * На сервере: если `bot/data` нельзя писать (EACCES), задай в `.env` либо
 * `OTHER_SERVICES_V1_PATH=/var/lib/.../other-services.v1.json`, либо `BOT_DATA_DIR=/var/lib/...`
 * (файл будет `.../other-services.v1.json`).
 * Если env не задан, при EACCES на встроенном пути пишем в `~/.artshopvirts/other-services.v1.json`.
 */
function envPrimaryPath(): string {
  const fromEnv = process.env.OTHER_SERVICES_V1_PATH?.trim();
  if (fromEnv) {
    return resolve(fromEnv);
  }
  const dir = process.env.BOT_DATA_DIR?.trim();
  if (dir) {
    return resolve(dir, "other-services.v1.json");
  }
  return BUILTIN_DEFAULT;
}

function homeFallbackPath(): string {
  return join(homedir(), ".artshopvirts", "other-services.v1.json");
}

function useAutoHomeOnEacces(): boolean {
  return !process.env.OTHER_SERVICES_V1_PATH?.trim() && !process.env.BOT_DATA_DIR?.trim();
}

/** Текущий путь: после первого чтения/успешной записи стабилен. */
let storeFilePath: string | null = null;

function isEacces(e: unknown): boolean {
  return e !== null && typeof e === "object" && (e as NodeJS.ErrnoException).code === "EACCES";
}

/**
 * Куда смотрим при load и куда пишем по умолчанию (пока нет EACCES-fallback).
 */
function pickReadPath(): string {
  if (storeFilePath) {
    return storeFilePath;
  }
  const primary = envPrimaryPath();
  const homeF = homeFallbackPath();
  if (existsSync(primary)) {
    storeFilePath = primary;
    return primary;
  }
  if (existsSync(homeF)) {
    storeFilePath = homeF;
    return homeF;
  }
  storeFilePath = primary;
  return primary;
}

function ensureDirForFile(filePath: string) {
  const d = dirname(filePath);
  if (!existsSync(d)) {
    mkdirSync(d, { recursive: true, mode: 0o755 });
  }
}

function writeStoreJsonTo(path: string, data: OtherServicesStoreV1) {
  ensureDirForFile(path);
  writeFileSync(path, JSON.stringify(data, null, 2), { encoding: "utf8", mode: 0o644 });
}

function save(data: OtherServicesStoreV1) {
  const payload = { ...data, v: 1 as const };
  const target = storeFilePath ?? pickReadPath();
  try {
    writeStoreJsonTo(target, payload);
  } catch (e) {
    if (isEacces(e) && useAutoHomeOnEacces() && target === BUILTIN_DEFAULT) {
      const alt = homeFallbackPath();
      try {
        writeStoreJsonTo(alt, payload);
        storeFilePath = alt;
        console.warn(
          "[other-services] EACCES on %s — using %s. Set OTHER_SERVICES_V1_PATH or chown bot/data.",
          BUILTIN_DEFAULT,
          alt,
        );
        return;
      } catch (e2) {
        console.error("[other-services] fallback write failed", e2);
        throw e2;
      }
    }
    throw e;
  }
  storeFilePath = target;
}

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

function migrateLegacySubToMain(subRaw: unknown): OtherServiceMain {
  if (!subRaw || typeof subRaw !== "object") {
    return { id: genId("m"), name: "", items: [] };
  }
  const o = subRaw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : genId("m");
  const name = typeof o.name === "string" ? o.name : "Подраздел";
  const items = Array.isArray(o.items) ? o.items.map(migrateItem) : [];
  const d = o.description;
  const description = typeof d === "string" && d.trim() ? d.trim() : undefined;
  return description ? { id, name, description, items } : { id, name, items };
}

/** Старый main с `subsections` раскрываем в несколько `main` на одном уровне. */
function migrateMainEntry(raw: unknown): OtherServiceMain[] {
  if (!raw || typeof raw !== "object") {
    return [{ id: genId("m"), name: "", items: [] }];
  }
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : genId("m");
  const name = typeof o.name === "string" ? o.name : "";
  const baseItems = Array.isArray(o.items) ? o.items.map(migrateItem) : [];
  const subsections = Array.isArray(o.subsections) ? o.subsections : [];
  const descM =
    typeof o.description === "string" && o.description.trim() ? o.description.trim() : undefined;
  if (subsections.length === 0) {
    return descM
      ? [{ id, name, description: descM, items: baseItems }]
      : [{ id, name, items: baseItems }];
  }
  const fromSubs: OtherServiceMain[] = subsections.map((sr) => migrateLegacySubToMain(sr));
  if (baseItems.length > 0) {
    const first: OtherServiceMain = descM
      ? { id, name, description: descM, items: baseItems }
      : { id, name, items: baseItems };
    return [first, ...fromSubs];
  }
  return fromSubs;
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
  const mainSections = Array.isArray(o.mainSections) ? o.mainSections.flatMap(migrateMainEntry) : [];
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
  const p = pickReadPath();
  if (!existsSync(p)) {
    return { v: 1, games: [] };
  }
  try {
    const raw = readFileSync(p, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return migrateStore(parsed);
  } catch {
    return { v: 1, games: [] };
  }
}

export function getActiveOtherServicesStorePath(): string {
  return storeFilePath ?? pickReadPath();
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
    name: name.trim() || "Подраздел",
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

export function setMainDescription(gameId: string, mainId: string, text: string): boolean {
  const s = safeLoad();
  const g = s.games.find((x) => x.id === gameId);
  const m = g?.mainSections.find((x) => x.id === mainId);
  if (!g || !m) {
    return false;
  }
  const t = text.trim();
  if (t) {
    m.description = t;
  } else {
    delete m.description;
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

/** Позиция внутри подраздела. */
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
  const it = makeItem(input);
  m.items.push(it);
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
