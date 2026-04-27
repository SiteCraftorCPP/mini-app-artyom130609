import type { MessageEntity } from "@grammyjs/types";

/**
 * Жирный для всего текста, кроме `custom_emoji` (смещения не пересекаются).
 * Длинные отрезки `bold` с `\n` иногда в клиентах (caption + custom_emoji) не
 * рисуются — дробим на части по строкам.
 */
export function addBoldGapsExcludingCustomEmoji(
  text: string,
  customEmojiOnly: MessageEntity[],
): MessageEntity[] {
  const em = customEmojiOnly
    .filter((e) => e.type === "custom_emoji")
    .sort((a, b) => a.offset - b.offset);
  const out: MessageEntity[] = [...em];
  let pos = 0;
  for (const c of em) {
    if (c.offset > pos) {
      for (const p of splitGapIntoBoldParts(text, pos, c.offset)) {
        out.push({ type: "bold", ...p });
      }
    }
    pos = c.offset + c.length;
  }
  if (pos < text.length) {
    for (const p of splitGapIntoBoldParts(text, pos, text.length)) {
      out.push({ type: "bold", ...p });
    }
  }
  return sortEntities(out);
}

/** Один кусок [gapStart, gapEnd) (не включая end) — несколько `bold` по `\n` с подстроками. */
function splitGapIntoBoldParts(
  text: string,
  gapStart: number,
  gapEnd: number,
): { offset: number; length: number }[] {
  if (gapStart >= gapEnd) {
    return [];
  }
  const parts: { offset: number; length: number }[] = [];
  let segStart = gapStart;
  for (let i = gapStart; i < gapEnd; i++) {
    if (text[i] === "\n") {
      parts.push({ offset: segStart, length: i - segStart + 1 });
      segStart = i + 1;
    }
  }
  if (segStart < gapEnd) {
    parts.push({ offset: segStart, length: gapEnd - segStart });
  }
  return parts;
}

/**
 * `custom_emoji` остаётся; весь остальной UTF-16 — `bold`. Без `custom_emoji` — весь caption жирный
 * (для фото/видео подписи без кастомных стикеров).
 */
export function captionEntitiesAllBoldExcludingCustomEmoji(
  text: string,
  entities: MessageEntity[],
): MessageEntity[] {
  const customOnly = entities.filter(
    (e): e is MessageEntity & { type: "custom_emoji" } => e.type === "custom_emoji",
  );
  if (text.length === 0) {
    return sortEntities([...customOnly]);
  }
  if (customOnly.length === 0) {
    return sortEntities([{ type: "bold", offset: 0, length: text.length }]);
  }
  return addBoldGapsExcludingCustomEmoji(text, customOnly);
}

export function sortEntities(entities: MessageEntity[]): MessageEntity[] {
  return [...entities].sort((a, b) => a.offset - b.offset);
}
