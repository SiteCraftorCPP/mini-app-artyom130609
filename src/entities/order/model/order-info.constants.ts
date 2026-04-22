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
  amountRub: "Сумма заказа в рублях:",
  bank: "Счет в банке:",
  copyAll: "Скопировать все данные",
  copyAllFailed: "Не удалось скопировать",
  copied: "Скопировано в буфер обмена",
  game: "Игра/Услуга:",
  opened: "🕒 Открыт:",
  pendingHeader: "Заказы, ожидающие выполнения:",
  title: (orderId: string) => `Детали заказа ${orderId}:`,
  transfer: "Способ передачи:",
  user: "Пользователь:",
  usernameLine: (username: string, userId: string) =>
    `@${username} (${userId})`,
  virtAmount: "Количество виртов:",
} as const;
