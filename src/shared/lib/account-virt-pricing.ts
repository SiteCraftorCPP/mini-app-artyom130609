/** Парсинг ввода «кк» (запятая или точка). */
export function parseKkFromUserInput(s: string): number | null {
  const t = s.trim().replace(",", ".");
  if (!t) {
    return null;
  }
  const n = parseFloat(t);
  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }
  return n;
}

/**
 * Black Russia: rubPerKk за каждые 1кк + accountFeeRub за аккаунт.
 * Пример: 6кк при 100/100 → 6·100+100 = 700 ₽
 */
export function accountWithVirtsPriceRub(
  kk: number,
  p: { accountFeeRub: number; rubPerKk: number },
): number {
  return Math.round(kk * p.rubPerKk + p.accountFeeRub);
}

export function formatKkLabelForOrder(kk: number): string {
  const s =
    kk % 1 === 0
      ? String(kk)
      : kk.toLocaleString("ru-RU", { maximumFractionDigits: 2 });
  return `${s}кк`;
}
