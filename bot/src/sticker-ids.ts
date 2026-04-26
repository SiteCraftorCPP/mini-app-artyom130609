/**
 * custom_emoji_id (длинные числа из ботов с ID). В чате они рисуются через
 * sendMessage + entities: custom_emoji (см. custom-emoji-stickers.ts), не sendSticker.
 * Для обычного .webp-стикера (не custom emoji) в .env — file_id: CAAC…
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
