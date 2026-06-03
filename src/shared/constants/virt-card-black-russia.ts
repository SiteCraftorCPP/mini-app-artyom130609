import type { CSSProperties } from "react";

/** Figma: вся плашка 335.83×85.58 */
export const BR_VIRT_CARD_OUTER_WIDTH_PX = 335.83;
export const BR_VIRT_CARD_OUTER_HEIGHT_PX = 85.58;

/** Figma: левый объект (Rectangle 86) 223.17×81.25, #FF0003 */
export const BR_VIRT_CARD_LEFT_WIDTH_PX = 223.17;
export const BR_VIRT_CARD_SEGMENT_HEIGHT_PX = 81.25;

/** Figma: правый объект #B50B0A */
export const BR_VIRT_CARD_RIGHT_WIDTH_PX =
  BR_VIRT_CARD_OUTER_WIDTH_PX - BR_VIRT_CARD_LEFT_WIDTH_PX;

export const BR_VIRT_CARD_LEFT_WIDTH_PERCENT =
  (BR_VIRT_CARD_LEFT_WIDTH_PX / BR_VIRT_CARD_OUTER_WIDTH_PX) * 100;

export const BR_VIRT_CARD_RIGHT_WIDTH_PERCENT =
  (BR_VIRT_CARD_RIGHT_WIDTH_PX / BR_VIRT_CARD_OUTER_WIDTH_PX) * 100;

export const BR_VIRT_CARD_SEGMENT_INSET_Y_PX =
  (BR_VIRT_CARD_OUTER_HEIGHT_PX - BR_VIRT_CARD_SEGMENT_HEIGHT_PX) / 2;

/** Figma: текст «Black Russia» — Montserrat Black 900, 18px, #FFFFFF, line-height 100% */
export const BR_VIRT_CARD_TITLE_CLASS =
  "truncate px-3 text-center font-[Montserrat] text-[18px] font-black leading-none tracking-normal text-[#FFFFFF]";

/** Figma: логотип Rectangle 87 — 103.36×115.24, right 18.42, top −14.63, rotate −33.11° */
export const BR_VIRT_CARD_LOGO = {
  widthPx: 103.36,
  heightPx: 115.24,
  rotateDeg: -33.11,
  rightPx: 18.42,
  topPx: -14.63,
} as const;

export function brVirtCardLogoCss(): CSSProperties {
  const logo = BR_VIRT_CARD_LOGO;
  return {
    width: `${(logo.widthPx / BR_VIRT_CARD_OUTER_WIDTH_PX) * 100}%`,
    height: `${(logo.heightPx / BR_VIRT_CARD_OUTER_HEIGHT_PX) * 100}%`,
    right: `${(logo.rightPx / BR_VIRT_CARD_OUTER_WIDTH_PX) * 100}%`,
    top: `${(logo.topPx / BR_VIRT_CARD_OUTER_HEIGHT_PX) * 100}%`,
    transform: `rotate(${logo.rotateDeg}deg)`,
    transformOrigin: "center center",
  };
}
