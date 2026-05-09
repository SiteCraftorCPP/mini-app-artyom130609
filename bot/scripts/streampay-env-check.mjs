/**
 * Печать STREAMPAY_* из .env как видит процесс (как в index.ts: BOT_ENV_FILE → корень репо → bot/.env).
 * Запуск: cd bot && node scripts/streampay-env-check.mjs
 */
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const botRoot = resolve(__dirname, "..");

function loadEnv() {
  const explicit = process.env.BOT_ENV_FILE?.trim();
  const candidates = [
    explicit,
    resolve(botRoot, "../.env"),
    resolve(botRoot, ".env"),
  ].filter((p) => typeof p === "string" && p.length > 0);
  for (const p of candidates) {
    if (existsSync(p)) {
      config({ path: p, override: true });
    }
  }
}

loadEnv();

const keys = Object.keys(process.env)
  .filter((k) => k.startsWith("STREAMPAY"))
  .sort();
if (keys.length === 0) {
  console.log("Нет переменных STREAMPAY_* (проверь bot/.env и что файл читается).");
  process.exit(1);
}
for (const k of keys) {
  const v = process.env[k];
  const show = v === undefined ? "(undefined)" : JSON.stringify(v);
  console.log(`${k}=${show}`);
}
