import type { StoredPostPaymentNotice } from "@/features/payment/post-payment-notice-storage";

function formatOrderRef(orderNumber: string): string {
  const t = orderNumber.trim().replace(/^#+/, "");
  return `#${t}`;
}

/** Заголовок окна (как вопрос в FAQ): одна строка со статусом. */
export function buildPostPaymentReturnTitle(orderNumber: string): string {
  return `✅ Заказ ${formatOrderRef(orderNumber)} успешно оформлен!`;
}

/** Текст ответа (как тело ответа в FAQ): без дубля заголовка. */
export function buildPostPaymentReturnBody(n: StoredPostPaymentNotice): string {
  if (n.orderKind === "other_service" && n.otherMode === "auto") {
    return [
      "Оплата прошла успешно.",
      "",
      "Товар отправлен в чат с ботом.",
      "",
      "Чтобы посмотреть заказ в приложении, нажмите кнопку ниже 👇",
    ].join("\n");
  }
  if (n.orderKind === "other_service" && n.otherMode === "manual") {
    return [
      "🕔 Срок выдачи: от 5 минут до 24 часов",
      "(среднее время — ~20 минут)",
      "",
      "Информация по заказу будет отправлена в этот чат.",
      "",
      "Чтобы узнать детали заказа, нажмите кнопку ниже 👇",
    ].join("\n");
  }
  if (n.orderKind === "account") {
    return [
      "🕔 Срок выдачи: от 5 минут до 24 часов",
      "(среднее время — ~20 минут)",
      "",
      "Информация по заказу будет отправлена в этот чат.",
      "",
      "Чтобы узнать детали заказа, нажмите кнопку ниже 👇",
    ].join("\n");
  }
  return [
    "🕔 Срок выдачи: от 5 минут до 24 часов",
    "(среднее время — ~20 минут)",
    "",
    "После зачисления виртов на ваш счёт вы получите уведомление в этом чате.",
    "",
    "Чтобы узнать детали заказа, нажмите кнопку ниже 👇",
  ].join("\n");
}
