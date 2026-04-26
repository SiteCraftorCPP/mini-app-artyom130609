/** Чтение только в рантайме (после loadEnv в index), не при импорте модуля. */

function parseFileIdList(raw: string | undefined): string[] | undefined {
  if (!raw?.trim()) return undefined;
  const list = raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length > 0 ? list : undefined;
}

/** Прямые file_id для sendSticker (как в ответе Telegram, обычно начинаются с CAAC…). Надёжнее, чем custom_emoji_id. */
export function getWelcomeStickerFileIdsFromEnv(): string[] | undefined {
  return parseFileIdList(process.env.WELCOME_STICKER_FILE_IDS);
}

export function getHowStickerFileIdFromEnv(): string | undefined {
  const s = process.env.HOW_STICKER_FILE_ID?.trim();
  return s || undefined;
}

export function getAboutStickerFileIdsFromEnv(): string[] | undefined {
  return parseFileIdList(process.env.ABOUT_STICKER_FILE_IDS);
}
