import type { Context } from "grammy";
import type { MessageEntity, Sticker } from "@grammyjs/types";

import { captionEntitiesAllBoldExcludingCustomEmoji } from "./caption-bold-helpers.js";

/**
 * custom_emoji: subtext = Sticker.emoji (getCustomEmojiStickers). sendSticker+file_id custom_emoji = 400.
 * CAAC…: sendSticker. В подписях: caption_entities, в тексте: entities.
 */

function normId(id: string): string {
  return String(id).trim();
}

export function isLikelyCustomEmojiIdString(s: string): boolean {
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

export type CustomEmojiCaption = {
  text: string;
  entities: MessageEntity[];
};

/**
 * Склейка базовых эмодзи подряд (как в приветствии) — дальше joinCaptionWithBody(…, WELCOME).
 */
export async function buildCustomEmojiPrefixCaption(
  ctx: Pick<Context, "api" | "chat">,
  customEmojiIds: readonly string[],
): Promise<CustomEmojiCaption | null> {
  const ids = customEmojiIds.map(normId).filter(Boolean);
  if (ids.length === 0) {
    return null;
  }
  await ensureStickersInCache(ctx, ids);
  for (const id of ids) {
    const s = getCachedStickerForRequestedId(id);
    if (!s?.emoji || s.emoji.length === 0) {
      console.warn("[custom-emoji] нет Sticker.emoji, id=", id);
      return null;
    }
  }
  let fullText = "";
  const entities: CustomEmojiCaption["entities"] = [];
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
  return { text: fullText, entities };
}

export function joinCaptionWithBody(
  prefix: CustomEmojiCaption,
  body: string,
  gap: string = "\n\n",
): CustomEmojiCaption {
  const text = prefix.text + gap + body;
  return {
    text,
    entities: captionEntitiesAllBoldExcludingCustomEmoji(text, prefix.entities),
  };
}

/**
 * /start: первая строка = [hand] + line1, вторая = line2 + [pointer] (как 👋 / 👇 в макете).
 */
export async function buildWelcomeHandPointerCaption(
  ctx: Pick<Context, "api" | "chat">,
  handId: string,
  pointerId: string,
  line1Text: string,
  line2Text: string,
): Promise<CustomEmojiCaption | null> {
  const hId = normId(handId);
  const pId = normId(pointerId);
  if (!hId || !pId) {
    return null;
  }
  await ensureStickersInCache(ctx, [hId, pId]);
  const hS = getCachedStickerForRequestedId(hId);
  const pS = getCachedStickerForRequestedId(pId);
  if (!hS?.emoji || !pS?.emoji) {
    console.warn("[custom-emoji] welcome: нет Sticker.emoji для hand/pointer");
    return null;
  }
  const he = hS.emoji as string;
  const pe = pS.emoji as string;
  const afterHand = " ";
  const beforePointer = " ";
  const text = he + afterHand + line1Text + "\n\n" + line2Text + beforePointer + pe;
  const entities: MessageEntity[] = [
    {
      type: "custom_emoji",
      offset: 0,
      length: he.length,
      custom_emoji_id: hId,
    },
    {
      type: "custom_emoji",
      offset: text.length - pe.length,
      length: pe.length,
      custom_emoji_id: pId,
    },
  ];
  return { text, entities: captionEntitiesAllBoldExcludingCustomEmoji(text, entities) };
}

/**
 * id[i] + пробел + lineTexts[i] на каждой строке. ids.length === lineTexts.length.
 */
export async function buildMultilineCustomEmojiLinesCaption(
  ctx: Pick<Context, "api" | "chat">,
  customEmojiIds: readonly string[],
  lineTexts: readonly string[],
): Promise<CustomEmojiCaption | null> {
  if (customEmojiIds.length === 0 || lineTexts.length === 0) {
    return null;
  }
  if (customEmojiIds.length !== lineTexts.length) {
    console.warn(
      "[custom-emoji] multiline: число id и строк не совпало",
      customEmojiIds.length,
      lineTexts.length,
    );
    return null;
  }
  const ids = customEmojiIds.map(normId);
  await ensureStickersInCache(ctx, ids);
  for (const id of ids) {
    const s = getCachedStickerForRequestedId(id);
    if (!s?.emoji || s.emoji.length === 0) {
      console.warn("[custom-emoji] multiline: нет emoji, id=", id);
      return null;
    }
  }
  const entities: MessageEntity[] = [];
  let fullText = "";
  const n = ids.length;

  for (let i = 0; i < n; i++) {
    const custom_emoji_id = ids[i]!;
    const s = getCachedStickerForRequestedId(custom_emoji_id)!;
    const em = s.emoji as string;
    const offset = fullText.length;
    const length = em.length;
    entities.push({ type: "custom_emoji", offset, length, custom_emoji_id });
    const line = lineTexts[i]!;
    fullText += em + " " + line;
    if (i < n - 1) {
      fullText += "\n\n";
    }
  }
  return {
    text: fullText,
    entities: captionEntitiesAllBoldExcludingCustomEmoji(fullText, entities),
  };
}

export type OrderSuccessThreeEmojisParts = {
  line1: string;
  delivery: string;
  paren: string;
  body: string;
  lastBeforePointer: string;
};

/** Заказ + менеджер: (1) у «Заказ #… оформлен!», (2) в конце «…через кнопку ниже». */
export type OrderManagerSuccessTwoEmojisParts = {
  line1: string;
  whatToDo: string;
  lineLast: string;
};

/**
 * Фото «заказ + менеджер»: (1) начало 1-й строки, (2) конец последней (указатель).
 */
export async function buildOrderManagerSuccessTwoEmojisCaption(
  api: Context["api"],
  ids: { success: string; pointer: string },
  p: OrderManagerSuccessTwoEmojisParts,
): Promise<CustomEmojiCaption | null> {
  const sId = normId(ids.success);
  const pId = normId(ids.pointer);
  if (!sId || !pId) {
    return null;
  }
  await ensureStickersInCache({ api } as Pick<Context, "api">, [sId, pId]);
  const s0 = getCachedStickerForRequestedId(sId);
  const s1 = getCachedStickerForRequestedId(pId);
  if (!s0?.emoji || !s1?.emoji) {
    console.warn("[custom-emoji] order-manager: нет Sticker.emoji");
    return null;
  }
  const h1 = s0.emoji as string;
  const h2 = s1.emoji as string;
  const text =
    h1 + "  " + p.line1 + "\n\n" + p.whatToDo + "\n" + p.lineLast + " " + h2;
  const offPointer = text.length - h2.length;
  const entities: MessageEntity[] = [
    { type: "custom_emoji", offset: 0, length: h1.length, custom_emoji_id: sId },
    {
      type: "custom_emoji",
      offset: offPointer,
      length: h2.length,
      custom_emoji_id: pId,
    },
  ];
  return { text, entities: captionEntitiesAllBoldExcludingCustomEmoji(text, entities) };
}

/** Выполнение заказа (фото отзыва): (1) строка «Заказ #… выполнен», (2) вирты / данные аккаунта, (3) отзыв. */
export type OrderCompletedThreeEmojisParts =
  | {
      kind: "virt";
      line1: string;
      line2: string;
      line3: string;
    }
  | {
      kind: "account";
      line1: string;
      accountData: string;
      line3: string;
    };

export async function buildOrderCompletedThreeEmojisCaption(
  api: Context["api"],
  ids: { first: string; second: string; third: string },
  p: OrderCompletedThreeEmojisParts,
): Promise<CustomEmojiCaption | null> {
  const fId = normId(ids.first);
  const sId = normId(ids.second);
  const tId = normId(ids.third);
  const idArr = [fId, sId, tId].filter((x) => x.length > 0);
  if (idArr.length !== 3) {
    return null;
  }
  await ensureStickersInCache({ api } as Pick<Context, "api">, idArr);
  const s0 = getCachedStickerForRequestedId(fId);
  const s1 = getCachedStickerForRequestedId(sId);
  const s2 = getCachedStickerForRequestedId(tId);
  if (!s0?.emoji || !s1?.emoji || !s2?.emoji) {
    console.warn("[custom-emoji] order-completed: нет Sticker.emoji");
    return null;
  }
  const h1 = s0.emoji as string;
  const h2 = s1.emoji as string;
  const h3 = s2.emoji as string;

  const middle =
    p.kind === "virt"
      ? h2 + " " + p.line2
      : h2 + " " + "Данные для входа в аккаунт:\n" + p.accountData;

  const text = h1 + "  " + p.line1 + "\n\n" + middle + "\n\n" + h3 + " " + p.line3;
  const off2 = (h1 + "  " + p.line1 + "\n\n").length;
  const off3 = (h1 + "  " + p.line1 + "\n\n" + middle + "\n\n").length;

  const entities: MessageEntity[] = [
    { type: "custom_emoji", offset: 0, length: h1.length, custom_emoji_id: fId },
    { type: "custom_emoji", offset: off2, length: h2.length, custom_emoji_id: sId },
    { type: "custom_emoji", offset: off3, length: h3.length, custom_emoji_id: tId },
  ];

  return { text, entities: captionEntitiesAllBoldExcludingCustomEmoji(text, entities) };
}

/**
 * Фото «заказ оформлен»): (1) начало 1-й строки, (2) начало строки срока, (3) конец последней.
 */
export async function buildOrderSuccessThreeEmojisCaption(
  api: Context["api"],
  ids: { success: string; clock: string; pointer: string },
  p: OrderSuccessThreeEmojisParts,
): Promise<CustomEmojiCaption | null> {
  const sId = normId(ids.success);
  const cId = normId(ids.clock);
  const pId = normId(ids.pointer);
  const idArr = [sId, cId, pId].filter((x) => x.length > 0);
  if (idArr.length !== 3) {
    return null;
  }
  await ensureStickersInCache({ api } as Pick<Context, "api">, idArr);
  const a = (i: 0 | 1 | 2) => getCachedStickerForRequestedId(idArr[i]!);
  const s0 = a(0);
  const s1 = a(1);
  const s2 = a(2);
  if (!s0?.emoji || !s1?.emoji || !s2?.emoji) {
    console.warn("[custom-emoji] order-success: нет Sticker.emoji");
    return null;
  }
  const h1 = s0.emoji as string;
  const h2 = s1.emoji as string;
  const h3 = s2.emoji as string;
  const text =
    h1 + "  " + p.line1 +
    "\n\n" + h2 + " " + p.delivery +
    "\n" + p.paren +
    "\n\n" + p.body +
    "\n\n" + p.lastBeforePointer + " " + h3;
  const off2 = (h1 + "  " + p.line1 + "\n\n").length;
  const off3 = text.length - h3.length;
  const entities: MessageEntity[] = [
    { type: "custom_emoji", offset: 0, length: h1.length, custom_emoji_id: sId },
    { type: "custom_emoji", offset: off2, length: h2.length, custom_emoji_id: cId },
    { type: "custom_emoji", offset: off3, length: h3.length, custom_emoji_id: pId },
  ];
  return { text, entities: captionEntitiesAllBoldExcludingCustomEmoji(text, entities) };
}

type SendMessageExtra = NonNullable<Parameters<Context["api"]["sendMessage"]>[2]>;

export async function sendCustomEmojisInMessage(
  ctx: Pick<Context, "api" | "chat">,
  customEmojiIds: readonly string[],
  extra?: SendMessageExtra,
): Promise<boolean> {
  const chatId = ctx.chat?.id;
  if (chatId === undefined || customEmojiIds.length === 0) {
    return false;
  }
  const cap = await buildCustomEmojiPrefixCaption(ctx, customEmojiIds);
  if (!cap) {
    return false;
  }
  try {
    await ctx.api.sendMessage(chatId, cap.text, { entities: cap.entities, ...extra });
    return true;
  } catch (e) {
    console.warn("[custom-emoji] sendMessage(entities) failed", e);
    return false;
  }
}

type SendStickerExtra = NonNullable<Parameters<Context["api"]["sendSticker"]>[2]>;

async function sendOneRegularSticker(
  ctx: Pick<Context, "api" | "chat">,
  fileId: string,
  extra?: SendStickerExtra,
): Promise<boolean> {
  const chatId = ctx.chat?.id;
  if (chatId === undefined) return false;
  try {
    await ctx.api.sendSticker(chatId, fileId, extra);
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
  options?: { removeReplyKeyboardOnFirstMessage?: boolean },
): Promise<boolean> {
  const segs = buildSegments(tokens);
  let anyOk = false;
  let first = true;
  for (const seg of segs) {
    const removeFirst =
      first && options?.removeReplyKeyboardOnFirstMessage === true;
    first = false;
    if (seg.kind === "custom") {
      if (await sendCustomEmojisInMessage(
        ctx,
        seg.ids,
        removeFirst ? { reply_markup: { remove_keyboard: true } } : undefined,
      )) {
        anyOk = true;
      }
    } else {
      if (await sendOneRegularSticker(
        ctx,
        seg.fileId,
        removeFirst ? { reply_markup: { remove_keyboard: true } } : undefined,
      )) {
        anyOk = true;
      }
    }
  }
  return anyOk;
}
