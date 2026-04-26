import {
  ORDER_SUCCESS_CUSTOM_EMOJI_IDS,
  ORDER_SUCCESS_MANAGER_CUSTOM_EMOJI_IDS,
} from "./sticker-ids.js";

/** Чтение только в рантайме (после loadEnv в index), не при импорте модуля. */

function parseFileIdList(raw: string | undefined): string[] | undefined {
  if (!raw?.trim()) return undefined;
  const list = raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length > 0 ? list : undefined;
}

/**
 * WELCOME_STICKER_FILE_IDS: ровно 2 id — 1) «рука» в начале 1-й строки, 2) «указатель» в конце 2-й.
 * Или custom_emoji_id, или file_id (CAAC…).
 */
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

/**
 * ORDER_SUCCESS_STICKER_IDS: 3 id через запятую — (1) в начале «Заказ #… оформлен!»,
 * (2) у строки срока выдачи, (3) в конце «…кнопку ниже».
 * Или из кода (ORDER_SUCCESS_CUSTOM_EMOJI_IDS), если нет/ростой формат.
 */
export function getOrderSuccessStickerIdsFromEnv(): {
  success: string;
  clock: string;
  pointer: string;
} {
  const list = parseFileIdList(process.env.ORDER_SUCCESS_STICKER_IDS);
  if (list?.length === 3) {
    return { success: list[0]!, clock: list[1]!, pointer: list[2]! };
  }
  if (list && list.length > 0) {
    console.warn(
      "[sticker-env] ORDER_SUCCESS_STICKER_IDS: нужно ровно 3 id — взяты из кода (sticker-ids).",
    );
  }
  return { ...ORDER_SUCCESS_CUSTOM_EMOJI_IDS };
}

/**
 * ORDER_SUCCESS_MANAGER_STICKER_IDS: 2 id — (1) в начале «Заказ #… оформлен!»,
 * (2) в конце «…через кнопку ниже» (как у сценария с менеджером, без 3-го id часов).
 */
export function getOrderSuccessManagerStickerIdsFromEnv(): {
  success: string;
  pointer: string;
} {
  const list = parseFileIdList(process.env.ORDER_SUCCESS_MANAGER_STICKER_IDS);
  if (list?.length === 2) {
    return { success: list[0]!, pointer: list[1]! };
  }
  if (list && list.length > 0) {
    console.warn(
      "[sticker-env] ORDER_SUCCESS_MANAGER_STICKER_IDS: нужно ровно 2 id — взяты из кода (sticker-ids).",
    );
  }
  return { ...ORDER_SUCCESS_MANAGER_CUSTOM_EMOJI_IDS };
}
