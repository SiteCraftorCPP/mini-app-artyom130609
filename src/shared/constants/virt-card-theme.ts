/** Цвета градиентов плашек — 1:1 из Figma (слева → справа). */
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

/** Логотип справа: масштаб и сдвиг (частично обрезан краем плашки). */
export const VIRT_CARD_LOGO_CLASS: Partial<Record<string, string>> = {
  "black-russia": "h-[138%] max-w-[50%] translate-x-[14%]",
  "matryoshka-rp": "h-[142%] max-w-[48%] translate-x-[10%]",
  "gta-v-rp": "h-[136%] max-w-[46%] translate-x-[12%]",
  "grand-mobile-rp": "h-[128%] max-w-[44%] translate-x-[8%]",
  "arizona-rp": "h-[132%] max-w-[50%] translate-x-[10%]",
  "majestic-rp": "h-[92%] max-w-[58%] translate-x-[2%]",
  "province-rp": "h-[175%] max-w-[52%] translate-x-[16%]",
  "radmir-rp": "h-[138%] max-w-[48%] translate-x-[12%]",
  "amazing-rp": "h-[134%] max-w-[46%] translate-x-[14%]",
};

export function resolveVirtCardGradient(slug: string): { from: string; to: string } {
  return (
    VIRT_CARD_GRADIENT[slug] ?? {
      from: "#333333",
      to: "#666666",
    }
  );
}
