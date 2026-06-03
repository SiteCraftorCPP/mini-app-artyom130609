/** Figma: внешняя 335.83×85.58, внутренняя капсула 223.17×81.25 */
export const VIRT_CARD_OUTER_HEIGHT_PX = 85.58;
export const VIRT_CARD_INNER_HEIGHT_PX = 81.25;
export const VIRT_CARD_INNER_WIDTH_PERCENT = 66.45;
export const VIRT_CARD_INNER_INSET_Y_PX =
  (VIRT_CARD_OUTER_HEIGHT_PX - VIRT_CARD_INNER_HEIGHT_PX) / 2;

export type VirtCardTheme = {
  /** Фон всей плашки (тёмный, справа под логотип) — 1-й цвет пары */
  outer: string;
  /** Градиент левой капсулы: яркий → чуть темнее (2-й цвет пары) */
  innerGradient: string;
};

/**
 * Цвета 1:1 из Figma.
 * Пара пользователя: outer (тёмный фон) + inner (яркая капсула слева с градиентом).
 */
export const VIRT_CARD_THEME: Record<string, VirtCardTheme> = {
  "black-russia": {
    outer: "#6D2222",
    innerGradient: "linear-gradient(90deg, #FF0100 0%, #B50B0A 100%)",
  },
  "matryoshka-rp": {
    outer: "#78007F",
    innerGradient: "linear-gradient(90deg, #EC19EE 0%, #9A0BA3 100%)",
  },
  "gta-v-rp": {
    outer: "#E8B21F",
    innerGradient: "linear-gradient(90deg, #F5D04A 0%, #E8B21F 100%)",
  },
  "grand-mobile-rp": {
    outer: "#23223C",
    innerGradient: "linear-gradient(90deg, #25265B 0%, #1A1B35 100%)",
  },
  "arizona-rp": {
    outer: "#0053AB",
    innerGradient: "linear-gradient(90deg, #00B6F5 0%, #007ACC 100%)",
  },
  "majestic-rp": {
    outer: "#BC2378",
    innerGradient: "linear-gradient(90deg, #E34FA2 0%, #A01A62 100%)",
  },
  "province-rp": {
    outer: "#759C9B",
    innerGradient: "linear-gradient(90deg, #EBF6EB 0%, #A8C4C3 100%)",
  },
  "radmir-rp": {
    outer: "#FF8000",
    innerGradient: "linear-gradient(90deg, #FAB808 0%, #E69500 100%)",
  },
  "amazing-rp": {
    outer: "#E6A519",
    innerGradient: "linear-gradient(90deg, #FED731 0%, #D49212 100%)",
  },
};

/** Логотип справа в тёмной зоне, частично обрезан. */
export const VIRT_CARD_LOGO_CLASS: Partial<Record<string, string>> = {
  "black-russia": "h-[115px] w-auto max-w-[112px] translate-x-[4px]",
  "matryoshka-rp": "h-[112px] w-auto max-w-[108px] translate-x-[2px]",
  "gta-v-rp": "h-[110px] w-auto max-w-[100px] translate-x-[6px]",
  "grand-mobile-rp": "h-[104px] w-auto max-w-[96px] translate-x-[2px]",
  "arizona-rp": "h-[108px] w-auto max-w-[110px] translate-x-[4px]",
  "majestic-rp": "h-[86px] w-auto max-w-[130px] translate-x-0",
  "province-rp": "h-[118px] w-auto max-w-[120px] translate-x-[6px]",
  "radmir-rp": "h-[112px] w-auto max-w-[108px] translate-x-[4px]",
  "amazing-rp": "h-[110px] w-auto max-w-[100px] translate-x-[6px]",
};

export function resolveVirtCardTheme(slug: string): VirtCardTheme {
  return (
    VIRT_CARD_THEME[slug] ?? {
      outer: "#333333",
      innerGradient: "linear-gradient(90deg, #666666 0%, #444444 100%)",
    }
  );
}

/** @deprecated используй resolveVirtCardTheme */
export function resolveVirtCardGradient(slug: string): { from: string; to: string } {
  const t = resolveVirtCardTheme(slug);
  return { from: t.outer, to: t.outer };
}

export const VIRT_CARD_TEXT_PANEL_WIDTH: Partial<Record<string, string>> = {};
