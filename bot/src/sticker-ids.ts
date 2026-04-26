/**
 * custom_emoji_id: sendMessage/подпись + caption_entities, не sendSticker.
 */
export const CUSTOM_EMOJI_IDS = {
  dollar: "5283232570660634549",
  lightning: "5323761960829862762",
  barChart: "5258330865674494479",
  chain: "5260730055880876557",
} as const;

/**
 * /start, подпись к баннеру: (1) в начале первой строки, (2) в конце второй — вместо 👋 и 👇.
 */
export const WELCOME_HAND_POINTER_IDS = [
  "5402498632739996967",
  "5231102735817918643",
] as const;

/**
 * «Заказ оформлен» (фото): галочка в 1-й строке, часы в 2-й, указатель в конце последней.
 */
export const ORDER_SUCCESS_CUSTOM_EMOJI_IDS = {
  success: "5233307140667492238",
  clock: "5258419835922030550",
  pointer: "5231102735817918643",
} as const;

/** «О магазине»: 🪙 ⚡ 🍑 ⛓ — по одной иконке в начале каждой из 4 строк. */
export const ABOUT_CUSTOM_EMOJI_ORDER = [
  CUSTOM_EMOJI_IDS.dollar,
  CUSTOM_EMOJI_IDS.lightning,
  CUSTOM_EMOJI_IDS.barChart,
  CUSTOM_EMOJI_IDS.chain,
] as const;
