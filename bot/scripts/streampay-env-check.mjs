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

const priv = process.env.STREAMPAY_PRIVATE_KEY_HEX?.trim();
const pub = process.env.STREAMPAY_PUBLIC_KEY_HEX?.trim();
if (priv && pub) {
  try {
    const { createPrivateKey, createPublicKey } = await import("node:crypto");
    const STREAMPAY_PRIVATE_DER_PREFIX_HEX = "302e020100300506032b657004220420";
    const normalizePrivate = (hex) => {
      const s = hex.toLowerCase().replace(/^0x/, "");
      if (/^[0-9a-f]{64}$/.test(s)) return s;
      if (/^[0-9a-f]{128}$/.test(s)) return s.slice(0, 64);
      throw new Error("bad private hex");
    };
    const seed = normalizePrivate(priv);
    const privKey = createPrivateKey({
      key: Buffer.concat([
        Buffer.from(STREAMPAY_PRIVATE_DER_PREFIX_HEX, "hex"),
        Buffer.from(seed, "hex"),
      ]),
      format: "der",
      type: "pkcs8",
    });
    const derived = createPublicKey(privKey)
      .export({ type: "spki", format: "der" })
      .subarray(-32)
      .toString("hex");
    const pubNorm = pub.toLowerCase().replace(/^0x/, "");
    console.log(
      `\nKey pair check: derived public ${derived === pubNorm ? "MATCHES" : "MISMATCH"} STREAMPAY_PUBLIC_KEY_HEX`,
    );
    if (derived !== pubNorm) {
      console.log(`  derived: ${derived}`);
      console.log(`  env pub: ${pubNorm}`);
    }
  } catch (e) {
    console.warn("\nKey pair check failed:", e instanceof Error ? e.message : e);
  }
}

const apiBase = (process.env.STREAMPAY_API_BASE_URL || "").trim() || "https://api.streampay.org";
const curUrl = `${apiBase.replace(/\/$/, "")}/api/payment/currencies`;
try {
  const r = await fetch(curUrl);
  const text = await r.text();
  const preview = text.length > 1200 ? `${text.slice(0, 1200)}…` : text;
  console.log(`\nProbe GET ${curUrl}\n  status: ${r.status}\n  body: ${preview}`);
} catch (e) {
  console.warn("\nProbe currencies failed:", e instanceof Error ? e.message : e);
}
