/** Цвета плашек — 1:1 из Figma: слева (капсула) / справа (фон). */
export const VIRT_CARD_GRADIENT: Record<
  string,
  { from: string; to: string }
> = {
  "black-russia": { from: "#6D2222", to: "#FF0100" },
  "matryoshka-rp": { from: "#78007F", to: "#EC19EE" },
  "gta-v-rp": { from: "#E8B21F", to: "#E8B21F" },
  "grand-mobile-rp": { from: "#23223C", to: "#25265B" },
  "arizona-rp": { from: "#0053AB", to: "#00B6F5" },
  "majestic-rp": { from: "#BC2378", to: "#E34FA2" },
  "province-rp": { from: "#759C9B", to: "#EBF6EB" },
  "radmir-rp": { from: "#FF8000", to: "#FAB808" },
  "amazing-rp": { from: "#E6A519", to: "#FED731" },
};

/** Ширина левой капсулы с текстом (%), как в макете. */
export const VIRT_CARD_TEXT_PANEL_WIDTH: Partial<Record<string, string>> = {
  "black-russia": "62%",
  "matryoshka-rp": "64%",
  "gta-v-rp": "58%",
  "grand-mobile-rp": "66%",
  "arizona-rp": "60%",
  "majestic-rp": "62%",
  "province-rp": "64%",
  "radmir-rp": "58%",
  "amazing-rp": "62%",
};

/** Логотип справа — виден и частично обрезан краем. */
export const VIRT_CARD_LOGO_CLASS: Partial<Record<string, string>> = {
  "black-russia": "h-[118%] max-w-[44%] translate-x-[6%]",
  "matryoshka-rp": "h-[120%] max-w-[42%] translate-x-[4%]",
  "gta-v-rp": "h-[116%] max-w-[40%] translate-x-[8%]",
  "grand-mobile-rp": "h-[108%] max-w-[38%] translate-x-[4%]",
  "arizona-rp": "h-[114%] max-w-[44%] translate-x-[6%]",
  "majestic-rp": "h-[88%] max-w-[52%] translate-x-0",
  "province-rp": "h-[132%] max-w-[46%] translate-x-[8%]",
  "radmir-rp": "h-[118%] max-w-[42%] translate-x-[6%]",
  "amazing-rp": "h-[114%] max-w-[40%] translate-x-[8%]",
};

export function resolveVirtCardGradient(slug: string): { from: string; to: string } {
  return (
    VIRT_CARD_GRADIENT[slug] ?? {
      from: "#333333",
      to: "#666666",
    }
  );
}
