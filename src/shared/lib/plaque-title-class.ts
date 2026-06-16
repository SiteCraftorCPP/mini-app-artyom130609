import { cn } from "@/shared/utils";

/** Классы заголовка плашки: перенос длинных строк + уменьшение шрифта. */
export function plaqueTitleClass(
  title: string,
  tone: "service" | "virt" = "service",
): string {
  const n = title.trim().length;
  const wrap = "block w-full break-all [overflow-wrap:anywhere] hyphens-auto text-left";

  if (tone === "virt") {
    if (n > 28) {
      return cn(wrap, "text-[10px] leading-[1.2]");
    }
    if (n > 20) {
      return cn(wrap, "text-xs leading-[1.25]");
    }
    if (n > 14) {
      return cn(wrap, "text-sm leading-snug");
    }
    return cn(wrap, "text-[19px] leading-snug");
  }

  if (n > 36) {
    return cn(wrap, "text-[10px] leading-[1.2]");
  }
  if (n > 26) {
    return cn(wrap, "text-[11px] leading-[1.25]");
  }
  if (n > 18) {
    return cn(wrap, "text-sm leading-snug");
  }
  if (n > 12) {
    return cn(wrap, "text-base leading-snug");
  }
  return cn(wrap, "text-lg leading-snug");
}

export function plaqueNeedsTallLayout(title: string, hasSubtitle = false): boolean {
  return hasSubtitle || title.trim().length > 12;
}
