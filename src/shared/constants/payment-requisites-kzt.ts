/** Тенге (KZT) — ручной перевод; в личный кабинет FreeKassa не ведёт. */
/** Пересчёт суммы заказа в ₸: 1 ₽ = 6,9 ₸, округление до целого. */
export const KZT_PER_ONE_RUB = 6.9 as const;

export function rubToKztAmount(rub: number): number {
  return Math.round(rub * KZT_PER_ONE_RUB);
}

export const KZT_REQUISITES = {
  recipient: "Абзал М.",
  halyk: "4003 0351 1397 6778",
  kaspi: "4400 4303 1702 4294",
} as const;
