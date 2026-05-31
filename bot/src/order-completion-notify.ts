import type { Bot } from "grammy";

import type { AdminOrderRow } from "./orders-store.js";

function formatBuyerLine(order: AdminOrderRow): string {
  const uid = order.telegramUserId?.trim() || "—";
  const u = order.telegramUsername?.trim().replace(/^@/, "");
  if (u) {
    return `@${u} (${uid})`;
  }
  return `ID: ${uid}`;
}

function formatOrderRef(order: AdminOrderRow): string {
  const pub = order.publicOrderId?.trim();
  if (pub) {
    return pub.startsWith("#") ? pub : `#${pub.replace(/^#/, "")}`;
  }
  const id = order.id?.trim();
  return id ? (id.startsWith("#") ? id : `#${id}`) : "—";
}

export async function notifyOrderCompletionToOwners(
  bot: Bot,
  order: AdminOrderRow,
  profitRub: number,
): Promise<void> {
  const channelIdRaw = process.env.ORDERS_CHANNEL_ID?.trim();
  if (!channelIdRaw) {
    console.warn("[order-completion-notify] ORDERS_CHANNEL_ID не задан, уведомление о закрытии заказа не отправлено");
    return;
  }

  const lines = [
    "Номер заказа:",
    formatOrderRef(order),
    "",
    "Оборот:",
    `${Number(order.amountRub).toFixed(2)} RUB`,
    "",
    "Чистая прибыль:",
    `${profitRub.toFixed(2)} RUB`,
    "",
    "Покупатель:",
    formatBuyerLine(order),
  ];
  const text = lines.join("\n");
  
  try {
    await bot.api.sendMessage(channelIdRaw, text, {
      link_preview_options: { is_disabled: true },
    });
    console.info("[order-completion-notify] отправлено в канал", formatOrderRef(order));
  } catch (e) {
    console.error("[order-completion-notify] не удалось отправить в канал", channelIdRaw, order.id, e);
  }
}
