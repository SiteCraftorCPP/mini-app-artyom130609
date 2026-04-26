import type { Context } from "grammy";
import type { Sticker } from "@grammyjs/types";

/**
 * custom_emoji: sendMessage+entities. Подстрока = Sticker.emoji из getCustomEmojiStickers, иначе ENTITY_TEXT_INVALID.
 * getCustomEmojiStickers+sendSticker с file_id custom_emoji — 400. CAAC… — sendSticker.
 */

function normId(id: string): string {
  return String(id).trim();
}

function isLikelyCustomEmojiIdString(s: string): boolean {
  return /^\d{12,}$/.test(s);
}

const stickerByCustomEmojiId = new Map<string, Sticker>();

function rememberSticker(s: Sticker) {
  if (!s.custom_emoji_id) return;
  const k = String(s.custom_emoji_id);
  stickerByCustomEmojiId.set(k, s);
}

function getCachedStickerForRequestedId(id: string): Sticker | undefined {
  if (stickerByCustomEmojiId.has(id)) {
    return stickerByCustomEmojiId.get(id);
  }
  for (const s of stickerByCustomEmojiId.values()) {
    if (s.custom_emoji_id != null && String(s.custom_emoji_id) === id) {
      return s;
    }
  }
  return undefined;
}

async function ensureStickersInCache(
  ctx: Pick<Context, "api">,
  ids: readonly string[],
): Promise<void> {
  const unique = [...new Set(ids)];
  const missing = unique.filter((id) => getCachedStickerForRequestedId(id) === undefined);
  if (missing.length === 0) {
    return;
  }
  try {
    const list = await ctx.api.getCustomEmojiStickers(missing);
    for (const s of list) {
      rememberSticker(s);
    }
  } catch (e) {
    console.warn("[custom-emoji] getCustomEmojiStickers (batch)", e);
  }
  for (const id of missing) {
    if (getCachedStickerForRequestedId(id) !== undefined) {
      continue;
    }
    try {
      const [one] = await ctx.api.getCustomEmojiStickers([id]);
      if (one) {
        rememberSticker(one);
        stickerByCustomEmojiId.set(id, one);
      }
    } catch (e) {
      console.warn("[custom-emoji] getCustomEmojiStickers (one)", id, e);
    }
  }
}

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

  await ensureStickersInCache(ctx, ids);

  for (const id of ids) {
    const s = getCachedStickerForRequestedId(id);
    if (!s?.emoji || s.emoji.length === 0) {
      console.warn(
        "[custom-emoji] нет Sticker.emoji из API; проверьте custom_emoji_id, id=",
        id,
      );
      return false;
    }
  }

  let fullText = "";
  const entities: Array<{
    type: "custom_emoji";
    offset: number;
    length: number;
    custom_emoji_id: string;
  }> = [];

  for (const custom_emoji_id of ids) {
    const s = getCachedStickerForRequestedId(custom_emoji_id)!;
    const part = s.emoji as string;
    const offset = fullText.length;
    const length = part.length;
    fullText += part;
    entities.push({
      type: "custom_emoji",
      offset,
      length,
      custom_emoji_id,
    });
  }

  try {
    await ctx.api.sendMessage(chatId, fullText, { entities });
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
