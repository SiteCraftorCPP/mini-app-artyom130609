import type { Context } from "grammy";

const fileIdByCustomEmojiId = new Map<string, string>();

function normId(id: string): string {
  return String(id).trim();
}

/**
 * Прямые file_id — единственный гарантированный способ получить те же стикеры, что и у «оригинала» в чате.
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
    const sticker = normId(raw);
    if (!sticker) continue;
    try {
      await ctx.api.sendSticker(chatId, sticker);
      anyOk = true;
    } catch (e) {
      console.warn("[sticker] sendSticker (file_id) failed", e);
    }
  }
  return anyOk;
}

/**
 * custom_emoji_id (длинные числа-строки) → getCustomEmojiStickers → file_id.
 * Запрашиваем по одному id и кэшируем по **нашему** запрошенному ключу, не по полю в ответе
 * (так нет путаницы, если в ответе другое представление id).
 */
export async function sendCustomEmojiStickersInOrder(
  ctx: Pick<Context, "api" | "chat">,
  customEmojiIds: readonly string[],
): Promise<boolean> {
  const chatId = ctx.chat?.id;
  if (chatId === undefined || customEmojiIds.length === 0) {
    return false;
  }

  const toResolve = [...new Set(customEmojiIds.map(normId))].filter(
    (id) => id.length > 0 && !fileIdByCustomEmojiId.has(id),
  );
  for (const id of toResolve) {
    try {
      const stickers = await ctx.api.getCustomEmojiStickers([id]);
      const s = stickers[0];
      if (s?.file_id) {
        fileIdByCustomEmojiId.set(id, s.file_id);
      } else {
        console.warn(
          "[custom-emoji] getCustomEmojiStickers: пусто для id — задайте WELCOME_STICKER_FILE_IDS / …_FILE_ID в .env с прямыми file_id (перешлите стикер боту, см. getUpdates / лог). id=",
          id,
        );
      }
    } catch (e) {
      console.warn("[custom-emoji] getCustomEmojiStickers", id, e);
    }
  }

  let anyOk = false;
  for (const raw of customEmojiIds) {
    const id = normId(raw);
    if (!id) continue;
    const fileId = fileIdByCustomEmojiId.get(id);
    if (!fileId) {
      continue;
    }
    try {
      await ctx.api.sendSticker(chatId, fileId);
      anyOk = true;
    } catch (e) {
      console.warn("[custom-emoji] sendSticker", id, e);
    }
  }
  return anyOk;
}
