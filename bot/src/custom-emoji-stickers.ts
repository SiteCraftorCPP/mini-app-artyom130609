import type { Context } from "grammy";

const fileIdByCustomEmojiId = new Map<string, string>();

function normId(id: string): string {
  return String(id).trim();
}

/** file_id (CAAC…); длинные чисто цифровые id — custom_emoji_id. */
function isLikelyCustomEmojiIdString(s: string): boolean {
  return /^\d{12,}$/.test(s);
}

/**
 * Каждый токен в .env: либо file_id, либо custom_emoji_id (длинное число из бота с ID) → getCustomEmojiStickers.
 */
async function resolveStickerTokenForSend(
  ctx: Pick<Context, "api">,
  token: string,
): Promise<string | null> {
  const id = normId(token);
  if (!id) return null;

  if (isLikelyCustomEmojiIdString(id)) {
    if (fileIdByCustomEmojiId.has(id)) {
      return fileIdByCustomEmojiId.get(id)!;
    }
    try {
      const stickers = await ctx.api.getCustomEmojiStickers([id]);
      const s = stickers[0];
      if (s?.file_id) {
        fileIdByCustomEmojiId.set(id, s.file_id);
        return s.file_id;
      }
      console.warn(
        "[sticker] getCustomEmojiStickers: пусто для id=",
        id,
      );
      return null;
    } catch (e) {
      console.warn("[sticker] getCustomEmojiStickers", id, e);
      return null;
    }
  }

  return id;
}

/**
 * Список из .env: через запятую. Поддерживаются file_id и custom_emoji_id (цифры, как вам присылал бот с ID).
 */
export async function sendStickerFileIdsInOrder(
  ctx: Pick<Context, "api" | "chat">,
  fileIds: readonly string[],
): Promise<boolean> {
  const chatId = ctx.chat?.id;
  if (chatId === undefined || fileIds.length === 0) {
    return false;
  }
  let anyOk = false;
  for (const raw of fileIds) {
    const sticker = await resolveStickerTokenForSend(ctx, raw);
    if (!sticker) continue;
    try {
      await ctx.api.sendSticker(chatId, sticker);
      anyOk = true;
    } catch (e) {
      console.warn("[sticker] sendSticker failed", e);
    }
  }
  return anyOk;
}

/**
 * id из code (sticker-ids) — те же custom_emoji_id, что и в .env-цифрах.
 */
export async function sendCustomEmojiStickersInOrder(
  ctx: Pick<Context, "api" | "chat">,
  customEmojiIds: readonly string[],
): Promise<boolean> {
  const chatId = ctx.chat?.id;
  if (chatId === undefined || customEmojiIds.length === 0) {
    return false;
  }

  let anyOk = false;
  for (const raw of customEmojiIds) {
    const fileId = await resolveStickerTokenForSend(ctx, raw);
    if (!fileId) {
      continue;
    }
    try {
      await ctx.api.sendSticker(chatId, fileId);
      anyOk = true;
    } catch (e) {
      console.warn("[custom-emoji] sendSticker", normId(raw), e);
    }
  }
  return anyOk;
}
