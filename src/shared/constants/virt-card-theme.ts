/** Figma: внешняя 335.83×85.58, внутренняя капсула 223.17×81.25 */
export const VIRT_CARD_OUTER_HEIGHT_PX = 85.58;
export const VIRT_CARD_INNER_HEIGHT_PX = 81.25;
/** 223.17 / 335.83 */
export const VIRT_CARD_INNER_WIDTH_PERCENT = 66.45;
export const VIRT_CARD_INNER_INSET_Y_PX =
  (VIRT_CARD_OUTER_HEIGHT_PX - VIRT_CARD_INNER_HEIGHT_PX) / 2;

export type VirtCardTheme = {
  /** Градиент всей плашки (Figma: Rectangle 335×86) */
  outerGradient: string;
  /** Градиент левой капсулы (Figma: Rectangle 86, 223×81) */
  innerGradient: string;
};

export type VirtCardLogoStyle = {
  widthPx: number;
  heightPx: number;
  rotateDeg: number;
  rightPx: number;
  topPx?: number;
};

/**
 * Цвета 1:1 из Figma.
 * Black Russia: outer #C75041→#DB7160, inner #FF0003→#B50B0A.
 */
export const VIRT_CARD_THEME: Record<string, VirtCardTheme> = {
  "black-russia": {
    outerGradient: "linear-gradient(90deg, #C75041 0%, #DB7160 100%)",
    innerGradient: "linear-gradient(90deg, #FF0003 0%, #B50B0A 100%)",
  },
  "matryoshka-rp": {
    outerGradient: "linear-gradient(90deg, #933899 0%, #78007F 100%)",
    innerGradient: "linear-gradient(90deg, #EC19EE 0%, #9A0BA3 100%)",
  },
  "gta-v-rp": {
    outerGradient: "linear-gradient(90deg, #D4A018 0%, #E8B21F 100%)",
    innerGradient: "linear-gradient(90deg, #F5D04A 0%, #E8B21F 100%)",
  },
  "grand-mobile-rp": {
    outerGradient: "linear-gradient(90deg, #2E3055 0%, #23223C 100%)",
    innerGradient: "linear-gradient(90deg, #25265B 0%, #1A1B35 100%)",
  },
  "arizona-rp": {
    outerGradient: "linear-gradient(90deg, #0068C4 0%, #0053AB 100%)",
    innerGradient: "linear-gradient(90deg, #00B6F5 0%, #007ACC 100%)",
  },
  "majestic-rp": {
    outerGradient: "linear-gradient(90deg, #D43A92 0%, #BC2378 100%)",
    innerGradient: "linear-gradient(90deg, #E34FA2 0%, #A01A62 100%)",
  },
  "province-rp": {
    outerGradient: "linear-gradient(90deg, #8FAFAE 0%, #759C9B 100%)",
    innerGradient: "linear-gradient(90deg, #EBF6EB 0%, #A8C4C3 100%)",
  },
  "radmir-rp": {
    outerGradient: "linear-gradient(90deg, #FF991A 0%, #FF8000 100%)",
    innerGradient: "linear-gradient(90deg, #FAB808 0%, #E69500 100%)",
  },
  "amazing-rp": {
    outerGradient: "linear-gradient(90deg, #F0B828 0%, #E6A519 100%)",
    innerGradient: "linear-gradient(90deg, #FED731 0%, #D49212 100%)",
  },
};

/** Figma Rectangle 87: 103.36×115.24, rotate −33.11° */
export const VIRT_CARD_LOGO_STYLE: Partial<Record<string, VirtCardLogoStyle>> = {
  "black-russia": {
    widthPx: 103.36,
    heightPx: 115.24,
    rotateDeg: -33.11,
    rightPx: 6,
    topPx: 50,
  },
  "matryoshka-rp": {
    widthPx: 98,
    heightPx: 108,
    rotateDeg: 0,
    rightPx: 4,
  },
  "gta-v-rp": {
    widthPx: 96,
    heightPx: 106,
    rotateDeg: 0,
    rightPx: 8,
  },
  "grand-mobile-rp": {
    widthPx: 92,
    heightPx: 100,
    rotateDeg: 0,
    rightPx: 6,
  },
  "arizona-rp": {
    widthPx: 100,
    heightPx: 108,
    rotateDeg: 0,
    rightPx: 6,
  },
  "majestic-rp": {
    widthPx: 120,
    heightPx: 82,
    rotateDeg: 0,
    rightPx: 0,
  },
  "province-rp": {
    widthPx: 110,
    heightPx: 118,
    rotateDeg: 0,
    rightPx: 8,
  },
  "radmir-rp": {
    widthPx: 98,
    heightPx: 110,
    rotateDeg: 0,
    rightPx: 6,
  },
  "amazing-rp": {
    widthPx: 96,
    heightPx: 106,
    rotateDeg: 0,
    rightPx: 8,
  },
};

export function resolveVirtCardTheme(slug: string): VirtCardTheme {
  return (
    VIRT_CARD_THEME[slug] ?? {
      outerGradient: "linear-gradient(90deg, #444444 0%, #333333 100%)",
      innerGradient: "linear-gradient(90deg, #666666 0%, #444444 100%)",
    }
  );
}

export function resolveVirtCardLogoStyle(slug: string): VirtCardLogoStyle {
  return (
    VIRT_CARD_LOGO_STYLE[slug] ?? {
      widthPx: 100,
      heightPx: 108,
      rotateDeg: 0,
      rightPx: 6,
    }
  );
}
