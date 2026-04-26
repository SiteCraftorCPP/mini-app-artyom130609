import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export type PromoCode = {
  id: string;
  code: string;
  discount: number; // percentage
  activationsLeft: number | null; // null = infinite
};

function getPromoCodesFilePath(): string {
  const dataDir = resolve(__dirname, "../data");
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  return resolve(dataDir, "promo_codes.json");
}

function loadPromoCodes(): PromoCode[] {
  const p = getPromoCodesFilePath();
  if (!existsSync(p)) return [];
  try {
    return JSON.parse(readFileSync(p, "utf-8"));
  } catch (e) {
    console.error("Error reading promo_codes.json:", e);
    return [];
  }
}

function savePromoCodes(codes: PromoCode[]) {
  const p = getPromoCodesFilePath();
  writeFileSync(p, JSON.stringify(codes, null, 2));
}

export function getAllPromoCodes(): PromoCode[] {
  return loadPromoCodes();
}

export function addPromoCode(code: string, discount: number, activationsLeft: number | null): PromoCode {
  const codes = loadPromoCodes();
  const newCode: PromoCode = {
    id: Date.now().toString() + Math.floor(Math.random() * 1000).toString(),
    code,
    discount,
    activationsLeft,
  };
  codes.push(newCode);
  savePromoCodes(codes);
  return newCode;
}

export function deletePromoCode(id: string): boolean {
  const codes = loadPromoCodes();
  const filtered = codes.filter((c) => c.id !== id);
  if (filtered.length !== codes.length) {
    savePromoCodes(filtered);
    return true;
  }
  return false;
}

export function consumePromoCode(codeString: string): boolean {
  const codes = loadPromoCodes();
  const index = codes.findIndex((c) => c.code === codeString);
  if (index === -1) return false;

  const code = codes[index];
  if (code.activationsLeft !== null) {
    if (code.activationsLeft <= 0) return false;
    code.activationsLeft -= 1;
    savePromoCodes(codes);
  }
  return true;
}
