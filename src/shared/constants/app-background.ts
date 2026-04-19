/** Макет фона (светящиеся круги). Без blur/filter — только radial-gradient в CSS. */
export const APP_BACKGROUND_FRAME = {
  height: 1346,
  width: 402,
} as const;

export const APP_BACKGROUND_GLOWS = {
  large: [
    { height: 419, width: 419, x: -330, y: -90 },
    { height: 419, width: 419, x: 386, y: 264 },
    { height: 419, width: 419, x: -330, y: 657 },
    { height: 419, width: 419, x: 332, y: 946 },
  ],
  small: [
    { height: 109, width: 109, x: 199, y: 148 },
    { height: 109, width: 109, x: 19, y: 399 },
    { height: 109, width: 109, x: 261, y: 680 },
  ],
} as const;
