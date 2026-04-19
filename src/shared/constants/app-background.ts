/** Макет фона (светящиеся круги). Мелкие круги не рендерим — меньше «точек» в WebView. */
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
} as const;
