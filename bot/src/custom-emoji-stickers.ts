import type { Context } from "grammy";

const fileIdByCustomEmojiId = new Map<string, string>();

/**
 * Числа из @idstickerbot — это custom_emoji_id. Для sendSticker нужен file_id:
 * getCustomEmojiStickers([...ids]) → Sticker.file_id, кэшируем в процессе.
 */
export async function sendCustomEmojiStickersInOrder(
  ctx: Pick<Context, "api" | "chat">,
  customEmojiIds: readonly string[],
): Promise<boolean> {
  const chatId = ctx.chat?.id;
  if (chatId === undefined || customEmojiIds.length === 0) {
    return false;
  }

  const toResolve = [...new Set(customEmojiIds)].filter(
    (id) => !fileIdByCustomEmojiId.has(id),
  );
  if (toResolve.length > 0) {
    try {
      const stickers = await ctx.api.getCustomEmojiStickers(toResolve);
      for (const s of stickers) {
        if (s.custom_emoji_id && s.file_id) {
          fileIdByCustomEmojiId.set(s.custom_emoji_id, s.file_id);
        }
      }
    } catch (e) {
      console.warn("[custom-emoji] getCustomEmojiStickers", e);
    }
  }

  let anyOk = false;
  for (const id of customEmojiIds) {
    const fileId = fileIdByCustomEmojiId.get(id);
    if (!fileId) {
      console.warn("[custom-emoji] нет file_id для", id);
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
