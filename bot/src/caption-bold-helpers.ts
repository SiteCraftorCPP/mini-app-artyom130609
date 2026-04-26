import type { MessageEntity } from "@grammyjs/types";

/**
 * Жирный для всего текста, кроме `custom_emoji` (смещения не пересекаются).
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
      out.push({ type: "bold", offset: pos, length: c.offset - pos });
    }
    pos = c.offset + c.length;
  }
  if (pos < text.length) {
    out.push({ type: "bold", offset: pos, length: text.length - pos });
  }
  return sortEntities(out);
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
