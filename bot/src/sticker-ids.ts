/**
 * custom_emoji_id (часто то, что отдают «боты с ID»), не file_id.
 * sendSticker требует file_id — в проде надежнее задать WELCOME_STICKER_FILE_IDS и т.д. в .env.
 * Иначе: getCustomEmojiStickers (см. custom-emoji-stickers.ts); при пустом ответе смотрите лог.
 */
export const CUSTOM_EMOJI_IDS = {
  dollar: "5283232570660634549",
  lightning: "5323761960829862762",
  barChart: "5258330865674494479",
  chain: "5260730055880876557",
} as const;

/** /start: три визуала (доллар → молния → бары), затем текст WELCOME. */
export const WELCOME_CUSTOM_EMOJI_ORDER = [
  CUSTOM_EMOJI_IDS.dollar,
  CUSTOM_EMOJI_IDS.lightning,
  CUSTOM_EMOJI_IDS.barChart,
] as const;

/** «О магазине»: все четыре, затем ABOUT_SHOP без дублирующих эмодзи в строках. */
export const ABOUT_CUSTOM_EMOJI_ORDER = [
  CUSTOM_EMOJI_IDS.dollar,
  CUSTOM_EMOJI_IDS.lightning,
  CUSTOM_EMOJI_IDS.barChart,
  CUSTOM_EMOJI_IDS.chain,
] as const;
