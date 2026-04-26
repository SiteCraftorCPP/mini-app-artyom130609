import type { Context } from "grammy";

/**
 * sendSticker нельзя для «emoji-stickers» (type custom_emoji) — 400: can't send emoji stickers in messages.
 * Такие id из бота с ID = custom_emoji_id → sendMessage + entities: [{ type: "custom_emoji", ... }].
 * Обычные .webp-стикеры: token выглядит как file_id (CAAC…) → sendSticker.
 */

function normId(id: string): string {
  return String(id).trim();
}

/** custom_emoji_id (длинное число-строка), не file_id. */
function isLikelyCustomEmojiIdString(s: string): boolean {
  return /^\d{12,}$/.test(s);
}

/**
 * Плейсхолдер: печатный «?», 1 UTF-16; сущности custom_emoji рисуют поверх. Не U+FFFC —
 * Telegram тогда обнуляет текст и пишет 400: text must be non-empty.
 */
const PLACEHOLDER = "?";

/**
 * Несколько custom emoji в одной строке (порядок = порядок id).
 */
export async function sendCustomEmojisInMessage(
  ctx: Pick<Context, "api" | "chat">,
  customEmojiIds: readonly string[],
): Promise<boolean> {
  const chatId = ctx.chat?.id;
  if (chatId === undefined || customEmojiIds.length === 0) {
    return false;
  }
  const ids = customEmojiIds.map(normId).filter(Boolean);
  if (ids.length === 0) return false;

  const text = PLACEHOLDER.repeat(ids.length);
  const entities = ids.map((custom_emoji_id, i) => ({
    type: "custom_emoji" as const,
    offset: i,
    length: 1,
    custom_emoji_id,
  }));

  try {
    await ctx.api.sendMessage(chatId, text, { entities });
    return true;
  } catch (e) {
    console.warn("[custom-emoji] sendMessage(entities) failed", e);
    return false;
  }
}

async function sendOneRegularSticker(
  ctx: Pick<Context, "api" | "chat">,
  fileId: string,
): Promise<boolean> {
  const chatId = ctx.chat?.id;
  if (chatId === undefined) return false;
  try {
    await ctx.api.sendSticker(chatId, fileId);
    return true;
  } catch (e) {
    console.warn("[sticker] sendSticker failed", e);
    return false;
  }
}

type Seg =
  | { kind: "custom"; ids: string[] }
  | { kind: "sticker"; fileId: string };

function buildSegments(tokens: readonly string[]): Seg[] {
  const segs: Seg[] = [];
  for (const raw of tokens) {
    const t = normId(raw);
    if (!t) continue;
    if (isLikelyCustomEmojiIdString(t)) {
      const last = segs[segs.length - 1];
      if (last?.kind === "custom") {
        last.ids.push(t);
      } else {
        segs.push({ kind: "custom", ids: [t] });
      }
    } else {
      segs.push({ kind: "sticker", fileId: t });
    }
  }
  return segs;
}

/**
 * Список токенов слева направо: длинные цифры = custom_emoji (одно или несколько подряд — одно сообщение);
 * иначе = file_id для обычного sendSticker.
 */
export async function sendVisualTokensInOrder(
  ctx: Pick<Context, "api" | "chat">,
  tokens: readonly string[],
): Promise<boolean> {
  const segs = buildSegments(tokens);
  let anyOk = false;
  for (const seg of segs) {
    if (seg.kind === "custom") {
      if (await sendCustomEmojisInMessage(ctx, seg.ids)) {
        anyOk = true;
      }
    } else {
      if (await sendOneRegularSticker(ctx, seg.fileId)) {
        anyOk = true;
      }
    }
  }
  return anyOk;
}
