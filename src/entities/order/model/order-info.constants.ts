export const ORDER_INFO_TEXT = {
  closedAt: "Дата закрытия:",
  copied: "Номер заказа скопирован",
  createdAt: "Дата оформления:",
  game: "Игра:",
  orderNumber: "Номер заказа:",
  server: "Сервер:",
  subject: "Номер счета/услуга/аккаунт:",
} as const;

export const ORDER_ADMIN_TEXT = {
  statsTitle: "💰 Статистика актуальных заказов на выдачу:",
  statsOrderCount: (n: number) => `📦 Количество заказов: ${n}`,
  /** Сумма полей заказа в рублях по всем актуальным заказам. */
  statsTotalRub: (formatted: string) =>
    `💵 Общая сумма (сейчас оформлено): ${formatted} RUB`,
  amountRub: "Сумма заказа в рублях:",
  /** Заказ выполнен (архив) — в поиске по номеру. */
  closedAt: "🕐 Закрыт:",
  bank: "Счет в банке:",
  copyAll: "Скопировать все данные",
  copyAllFailed: "Не удалось скопировать",
  copied: "Скопировано в буфер обмена",
  game: "Игра/Услуга:",
  opened: "🕒 Открыт:",
  history50Header: "Последние 50 заказов (нажмите, чтобы открыть полные данные):",
  periodStatsBackToMenu: "◀ К выбору периода",
  periodStatsBackToAccount: "◀ К аккаунту",
  pendingHeader: "Заказы, ожидающие выполнения:",
  title: (orderId: string) => `Детали заказа ${orderId}:`,
  transfer: "Способ передачи:",
  user: "Пользователь:",
  usernameLine: (username: string, userId: string) =>
    `@${username} (${userId})`,
  virtAmount: "Количество виртов:",
} as const;

export const ORDER_PERIOD_OPTIONS = [
  { key: "day", label: "Статистика за день" },
  { key: "month", label: "Статистика за месяц" },
  { key: "year", label: "Статистика за год" },
  { key: "dayPick", label: "Статистика за определённый день" },
  { key: "monthPick", label: "Статистика за определённый месяц" },
  { key: "yearPick", label: "Статистика за определённый год" },
  { key: "all", label: "За всё время" },
  { key: "range", label: "За определённый период" },
] as const;

export type OrderPeriodKey = (typeof ORDER_PERIOD_OPTIONS)[number]["key"];

export const ORDER_PERIOD_STATS_UI = {
  prompt: "Выберите период:",
  resultHint: (label: string) =>
    `Период: ${label}. Сейчас — демо-числа; после API здесь будут фактические данные.`,
  countLine: (n: number) => `📦 Заказов: ${n}`,
  totalLine: (rub: string) => `💵 Оборот: ${rub} RUB`,
} as const;

/** Мок-агрегаты по периоду (позже — API). */
export function getOrderPeriodMockStats(period: OrderPeriodKey): {
  count: number;
  totalRub: number;
} {
  const idx = ORDER_PERIOD_OPTIONS.findIndex((o) => o.key === period);
  const s = idx >= 0 ? idx + 1 : 1;
  return {
    count: 3 + (s % 18),
    totalRub: 12_000 + s * 1_241,
  };
}
