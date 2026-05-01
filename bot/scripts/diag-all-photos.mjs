#!/usr/bin/env node
/**
 * Полный отчёт: какие env заданы, какие файлы ищутся, что реально есть на диске.
 *
 * Запуск (после `npm run build` в bot/):
 *   cd bot && node scripts/diag-all-photos.mjs
 *
 * На сервере то же из каталога, где лежит dist/ и .env.
 */
import { config } from "dotenv";
import { accessSync, constants, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const botRoot = resolve(scriptDir, "..");
config({ path: resolve(botRoot, ".env") });

const ok = (p) => (existsSync(p) ? (readable(p) ? "OK " : "!! ") : "-- ");

function readable(p) {
  try {
    accessSync(p, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function printBlock(title, lines) {
  console.log(`\n${"=".repeat(60)}\n${title}\n${"=".repeat(60)}`);
  for (const line of lines) {
    console.log(line);
  }
}

const {
  diagnoseOrderSuccessPhoto,
  diagnoseCompletedOrderReviewPhoto,
  ORDER_SUCCESS_FILE_NAMES,
} = await import("../dist/order-notify.js");

printBlock("Рантайм (как у скомпилированного order-notify.js)", [
  `process.cwd(): ${process.cwd()}`,
  `BOT_INSTALL_ROOT: ${process.env.BOT_INSTALL_ROOT?.trim() || "(нет)"}`,
  "",
  "Важно: systemd WorkingDirectory и путь к dist влияют на относительные пути в .env.",
]);

const d1 = diagnoseOrderSuccessPhoto();
printBlock("1) Заказ оформлен — ORDER_SUCCESS (photo_2, order-success…)", [
  `__dirname (dist): ${d1.runtimeDirname}`,
  `botRoot: ${d1.botRoot}`,
  `repoRoot: ${d1.repoRoot}`,
  `cwd: ${d1.cwd}`,
  `installRoots: ${JSON.stringify(d1.installRoots)}`,
  "",
  `ORDER_SUCCESS_IMAGE_PATH: ${d1.env_ORDER_SUCCESS_IMAGE_PATH ?? "(нет)"}`,
  `ORDER_SUCCESS_PHOTO_URL: ${d1.env_ORDER_SUCCESS_PHOTO_URL ?? "(нет)"}`,
  "",
  `Первый существующий файл: ${d1.firstExistingPath ?? "НЕТ"}`,
  `URL fallback: ${d1.urlFallback ?? "(нет)"}`,
  "",
  "Кандидаты:",
  ...d1.candidates.map((p) => `${ok(p)}${p}`),
]);

const d2 = diagnoseCompletedOrderReviewPhoto();
printBlock("2) Заказ выполнен — ORDER_COMPLETED / photo_3", [
  `ORDER_COMPLETED_REVIEW_PHOTO_URL: ${d2.env_ORDER_COMPLETED_REVIEW_PHOTO_URL ?? "(нет)"}`,
  `ORDER_COMPLETED_REVIEW_IMAGE_PATH: ${d2.env_ORDER_COMPLETED_REVIEW_IMAGE_PATH ?? "(нет)"}`,
  `ORDER_COMPLETED_REVIEW_PHOTO_PATH: ${d2.env_ORDER_COMPLETED_REVIEW_PHOTO_PATH ?? "(нет)"}`,
  "",
  `Первый существующий файл: ${d2.firstExistingPath ?? "НЕТ"}`,
  `URL fallback: ${d2.urlFallback ?? "(нет)"}`,
  "",
  "Кандидаты:",
  ...d2.candidates.map((p) => `${ok(p)}${p}`),
]);

// Welcome / About — та же геометрия путей, что в dist/index.js (botRoot = dist/..)
const fakeDist = d1.runtimeDirname;
const idxBotRoot = resolve(fakeDist, "..");
const idxRepoRoot = resolve(fakeDist, "../..");

const welcomeFiles = [];
const wEnv = process.env.WELCOME_PHOTO_PATH?.trim();
if (wEnv) {
  welcomeFiles.push(
    wEnv.startsWith("/") ? wEnv : resolve(idxBotRoot, wEnv),
  );
}
for (const name of [
  "photo_1.jpg",
  "photo_1.png",
  "photo_2026-04-07_20-21-06.jpg",
]) {
  welcomeFiles.push(resolve(idxBotRoot, "images", name));
  welcomeFiles.push(resolve(idxRepoRoot, "images", name));
}

const aboutFiles = [];
const aEnv = process.env.ABOUT_SHOP_PHOTO_PATH?.trim();
if (aEnv) {
  aboutFiles.push(
    aEnv.startsWith("/") ? aEnv : resolve(idxBotRoot, aEnv),
  );
}
for (const ext of ["jpg", "png", "jpeg", "webp"]) {
  aboutFiles.push(resolve(idxBotRoot, "images", `photo_4.${ext}`));
  aboutFiles.push(resolve(idxRepoRoot, "images", `photo_4.${ext}`));
}

printBlock("3) /start — WELCOME (photo_1…)", [
  `WELCOME_PHOTO_URL: ${process.env.WELCOME_PHOTO_URL?.trim() || "(нет)"}`,
  `WELCOME_PHOTO_PATH: ${process.env.WELCOME_PHOTO_PATH?.trim() || "(нет)"}`,
  "",
  "Файлы (как в index.ts):",
  ...[...new Set(welcomeFiles)].map((p) => `${ok(p)}${p}`),
]);

printBlock("4) «О магазине» — ABOUT_SHOP (photo_4…)", [
  `ABOUT_SHOP_PHOTO_URL: ${process.env.ABOUT_SHOP_PHOTO_URL?.trim() || "(нет)"}`,
  `ABOUT_SHOP_PHOTO_PATH: ${aEnv || "(нет)"}`,
  "",
  "Файлы:",
  ...[...new Set(aboutFiles)].map((p) => `${ok(p)}${p}`),
]);

printBlock("Имена для ORDER_SUCCESS (автопоиск)", [
  ...ORDER_SUCCESS_FILE_NAMES.map((n) => `  ${n}`),
  "",
  "photo_3*: только блок «заказ выполнен» (см. выше).",
]);

console.log("\nЛегенда: OK — файл есть и читается; !! — есть, нет прав чтения; -- нет файла\n");
