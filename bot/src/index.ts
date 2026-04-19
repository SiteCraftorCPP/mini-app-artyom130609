import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "dotenv";
import { Bot, InputFile, type Context } from "grammy";

import { aboutBackKeyboard, mainMenuKeyboard } from "./keyboards.js";
import {
  ABOUT_SHOP,
  BTN_ABOUT,
  BTN_HOW_TO_ORDER,
  VIDEO_CAPTION,
  WELCOME,
} from "./texts.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const explicit = process.env.BOT_ENV_FILE?.trim();
  const candidates = [
    explicit,
    resolve(__dirname, "../.env"),
    resolve(__dirname, "../../.env"),
  ].filter((p): p is string => Boolean(p));
  for (const p of candidates) {
    if (existsSync(p)) {
      config({ path: p });
      return;
    }
  }
  config();
}

loadEnv();

const token = process.env.TELEGRAM_BOT_TOKEN;
const miniAppUrl =
  process.env.MINI_APP_URL?.trim() ||
  process.env.APP_DOMAIN?.trim() ||
  "https://artshopvirts.space";

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN не задан в .env");
  process.exit(1);
}

const bot = new Bot(token);

function resolveInstructionVideoPath(): string | null {
  const fromEnv = process.env.INSTRUCTION_VIDEO_PATH?.trim();
  const base = resolve(__dirname, "..");
  const candidates = [
    fromEnv && fromEnv.length > 0 ? resolve(base, fromEnv) : null,
    resolve(base, "images", "photo_2026-04-07_20-21-06.mp4"),
    resolve(base, "images", "photo_2026-04-07_20-21-06.mov"),
    resolve(base, "images", "photo_2026-04-07_20-21-06"),
  ].filter((p): p is string => Boolean(p));

  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

async function sendWelcome(ctx: Context) {
  await ctx.reply(WELCOME, {
    reply_markup: mainMenuKeyboard(miniAppUrl),
  });
}

bot.command("start", async (ctx) => {
  await sendWelcome(ctx);
});

bot.hears(BTN_HOW_TO_ORDER, async (ctx) => {
  const path = resolveInstructionVideoPath();
  if (!path) {
    await ctx.reply(
      "Видео «Как оформить заказ» пока не загружено. Положите файл в папку bot/images/ (см. INSTRUCTION_VIDEO_PATH в .env).",
    );
    return;
  }
  await ctx.replyWithVideo(new InputFile(path), {
    caption: VIDEO_CAPTION,
  });
});

bot.hears(BTN_ABOUT, async (ctx) => {
  await ctx.reply(ABOUT_SHOP, {
    reply_markup: aboutBackKeyboard(),
  });
});

bot.callbackQuery("about:back", async (ctx) => {
  try {
    await ctx.deleteMessage();
  } catch {
    /* сообщение уже удалено или недоступно */
  }
  await ctx.answerCallbackQuery();
});

bot.catch((err) => {
  console.error("Bot error:", err);
});

await bot.start({
  onStart: (botInfo) => {
    console.log(`Бот @${botInfo.username} запущен (long polling)`);
    console.log(`Mini App URL: ${miniAppUrl}`);
  },
});
