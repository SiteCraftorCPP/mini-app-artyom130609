import type { CSSProperties } from "react";

/** Figma: внешняя 335.83×85.58, внутренняя капсула 223.17×81.25 */
export const VIRT_CARD_OUTER_WIDTH_PX = 335.83;
export const VIRT_CARD_OUTER_HEIGHT_PX = 85.58;
export const VIRT_CARD_INNER_HEIGHT_PX = 81.25;
/** 223.17 / 335.83 */
export const VIRT_CARD_INNER_WIDTH_PERCENT = 66.45;
export const VIRT_CARD_INNER_INSET_Y_PX =
  (VIRT_CARD_OUTER_HEIGHT_PX - VIRT_CARD_INNER_HEIGHT_PX) / 2;
export const VIRT_CARD_INNER_INSET_X_PX = 2.17;

export type VirtCardTheme = {
  /** Градиент всей плашки (Figma: 335.83×85.58) */
  outerGradient: string;
  /** Градиент левой капсулы (Figma: 223.17×81.25) */
  innerGradient: string;
};

export type VirtCardLogoStyle = {
  widthPx: number;
  heightPx: number;
  rotateDeg: number;
  /** От правого края плашки (Figma) */
  rightPx: number;
  /** От верхнего края плашки (может быть отрицательным) */
  topPx: number;
  /** Точка вращения (Figma) */
  transformOrigin?: string;
  /** Доп. сдвиг после rotate, px от плашки 335.83×85.58 */
  translateXPx?: number;
  translateYPx?: number;
};

/** Black Russia — только цвета из Figma, без выдуманных оттенков. */
export const VIRT_CARD_THEME: Record<string, VirtCardTheme> = {
  "black-russia": {
    outerGradient: "linear-gradient(90deg, #C75041 0%, #DB7160 100%)",
    innerGradient: "linear-gradient(90deg, #FF0003 0%, #B50B0A 100%)",
  },
  "matryoshka-rp": {
    outerGradient: "linear-gradient(90deg, #78007F 0%, #EC19EE 100%)",
    innerGradient: "linear-gradient(90deg, #EC19EE 0%, #78007F 100%)",
  },
  "gta-v-rp": {
    outerGradient: "linear-gradient(90deg, #E8B21F 0%, #E8B21F 100%)",
    innerGradient: "linear-gradient(90deg, #E8B21F 0%, #E8B21F 100%)",
  },
  "grand-mobile-rp": {
    outerGradient: "linear-gradient(90deg, #23223C 0%, #25265B 100%)",
    innerGradient: "linear-gradient(90deg, #25265B 0%, #23223C 100%)",
  },
  "arizona-rp": {
    outerGradient: "linear-gradient(90deg, #0053AB 0%, #00B6F5 100%)",
    innerGradient: "linear-gradient(90deg, #00B6F5 0%, #0053AB 100%)",
  },
  "majestic-rp": {
    outerGradient: "linear-gradient(90deg, #BC2378 0%, #E34FA2 100%)",
    innerGradient: "linear-gradient(90deg, #E34FA2 0%, #BC2378 100%)",
  },
  "province-rp": {
    outerGradient: "linear-gradient(90deg, #759C9B 0%, #EBF6EB 100%)",
    innerGradient: "linear-gradient(90deg, #EBF6EB 0%, #759C9B 100%)",
  },
  "radmir-rp": {
    outerGradient: "linear-gradient(90deg, #FF8000 0%, #FAB808 100%)",
    innerGradient: "linear-gradient(90deg, #FAB808 0%, #FF8000 100%)",
  },
  "amazing-rp": {
    outerGradient: "linear-gradient(90deg, #E6A519 0%, #FED731 100%)",
    innerGradient: "linear-gradient(90deg, #FED731 0%, #E6A519 100%)",
  },
};

/**
 * Figma Rectangle 87 (Black Russia):
 * 103.36×115.24, rotate −33.11°. translateXPx подобран под overflow после rotate.
 */
export const VIRT_CARD_LOGO_STYLE: Partial<Record<string, VirtCardLogoStyle>> = {
  "black-russia": {
    widthPx: 103.36,
    heightPx: 115.24,
    rotateDeg: -33.11,
    rightPx: 38,
    topPx: -11,
    transformOrigin: "50% 52%",
    translateXPx: -22,
  },
  "matryoshka-rp": {
    widthPx: 98,
    heightPx: 108,
    rotateDeg: 0,
    rightPx: 12,
    topPx: -8,
  },
  "gta-v-rp": {
    widthPx: 96,
    heightPx: 106,
    rotateDeg: 0,
    rightPx: 10,
    topPx: -6,
  },
  "grand-mobile-rp": {
    widthPx: 92,
    heightPx: 100,
    rotateDeg: 0,
    rightPx: 10,
    topPx: -4,
  },
  "arizona-rp": {
    widthPx: 100,
    heightPx: 108,
    rotateDeg: 0,
    rightPx: 12,
    topPx: -8,
  },
  "majestic-rp": {
    widthPx: 120,
    heightPx: 82,
    rotateDeg: 0,
    rightPx: 4,
    topPx: 2,
  },
  "province-rp": {
    widthPx: 110,
    heightPx: 118,
    rotateDeg: 0,
    rightPx: 8,
    topPx: -14,
  },
  "radmir-rp": {
    widthPx: 98,
    heightPx: 110,
    rotateDeg: 0,
    rightPx: 10,
    topPx: -10,
  },
  "amazing-rp": {
    widthPx: 96,
    heightPx: 106,
    rotateDeg: 0,
    rightPx: 10,
    topPx: -6,
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
      rightPx: 12,
      topPx: -6,
    }
  );
}

/** Figma px → % относительно плашки 335.83×85.58 (масштаб на любой ширине). */
export function virtCardLogoCss(logo: VirtCardLogoStyle): CSSProperties {
  const transforms: string[] = [];
  if (logo.rotateDeg !== 0) {
    transforms.push(`rotate(${logo.rotateDeg}deg)`);
  }
  if (logo.translateXPx) {
    transforms.push(
      `translateX(${(logo.translateXPx / VIRT_CARD_OUTER_WIDTH_PX) * 100}%)`,
    );
  }
  if (logo.translateYPx) {
    transforms.push(
      `translateY(${(logo.translateYPx / VIRT_CARD_OUTER_HEIGHT_PX) * 100}%)`,
    );
  }

  return {
    width: `${(logo.widthPx / VIRT_CARD_OUTER_WIDTH_PX) * 100}%`,
    height: `${(logo.heightPx / VIRT_CARD_OUTER_HEIGHT_PX) * 100}%`,
    right: `${(logo.rightPx / VIRT_CARD_OUTER_WIDTH_PX) * 100}%`,
    top: `${(logo.topPx / VIRT_CARD_OUTER_HEIGHT_PX) * 100}%`,
    transform: transforms.length > 0 ? transforms.join(" ") : undefined,
    transformOrigin: logo.transformOrigin ?? "center center",
  };
}
