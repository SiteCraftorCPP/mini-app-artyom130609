#!/usr/bin/env node
/**
 * Устаревший короткий вывод только по ORDER_SUCCESS.
 * Полный отчёт (оформлен / выполнен / welcome / о магазине):
 *   npm run diag:photos
 *   node scripts/diag-all-photos.mjs
 */
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const botRoot = resolve(scriptDir, "..");
config({ path: resolve(botRoot, ".env") });

const { diagnoseOrderSuccessPhoto } = await import("../dist/order-notify.js");
const d = diagnoseOrderSuccessPhoto();

console.log("=== ORDER PHOTO DIAG (как в рантайме бота) ===\n");
console.log("runtimeDirname (dist):", d.runtimeDirname);
console.log("botRoot:", d.botRoot);
console.log("repoRoot:", d.repoRoot);
console.log("cwd:", d.cwd);
console.log("installRoots:", d.installRoots);
console.log("env ORDER_SUCCESS_IMAGE_PATH:", d.env_ORDER_SUCCESS_IMAGE_PATH ?? "(нет)");
console.log("env ORDER_SUCCESS_PHOTO_URL:", d.env_ORDER_SUCCESS_PHOTO_URL ?? "(нет)");
console.log("env BOT_INSTALL_ROOT:", d.env_BOT_INSTALL_ROOT ?? "(нет)");
console.log("\n--- первый существующий файл ---");
console.log(d.firstExistingPath ?? "НЕТ — ни один путь из списка не существует");
console.log("\n--- URL fallback (если файла нет) ---");
console.log(d.urlFallback ?? "(нет)");
console.log("\n--- все кандидаты по порядку ---");
for (const p of d.candidates) {
  const ok = existsSync(p) ? "OK" : "--";
  console.log(ok, p);
}
