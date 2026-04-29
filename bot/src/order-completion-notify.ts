import type { Bot } from "grammy";

import type { AdminOrderRow } from "./orders-store.js";

const DEFAULT_OWNER_NOTIFY_IDS: readonly number[] = [1_944_803_821, 7_600_749_840];

function parseIdList(raw: string): number[] {
  const out: number[] = [];
  for (const part of raw.split(/[\s,;]+/)) {
    const s = part.trim();
    if (/^\d+$/.test(s)) {
      out.push(Number(s));
    }
  }
  return out;
}

/**
 * Кому слать блок «Номер заказа / Оборот / Чистая прибыль / Покупатель» после учёта прибыли.
 * Не зависит от того, какой админ нажал «выполнить» — только эти id (плюс опциональный тест).
 * ORDER_COMPLETION_NOTIFY_IDS — полностью задаёт список (тогда дефолт не подмешивается).
 * ORDER_COMPLETION_NOTIFY_TEST_ID — доп. id к списку (удобно для теста без смены основного env).
 */
export function resolveOrderCompletionNotifyRecipientIds(): number[] {
  const explicit = process.env.ORDER_COMPLETION_NOTIFY_IDS?.trim();
  const testId = process.env.ORDER_COMPLETION_NOTIFY_TEST_ID?.trim();
  let ids: number[];
  if (explicit) {
    ids = parseIdList(explicit);
  } else {
    ids = [...DEFAULT_OWNER_NOTIFY_IDS];
  }
  if (testId && /^\d+$/.test(testId)) {
    ids.push(Number(testId));
  }
  return [...new Set(ids)];
}

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
  const recipients = resolveOrderCompletionNotifyRecipientIds();
  if (recipients.length === 0) {
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
  for (const chatId of recipients) {
    try {
      await bot.api.sendMessage(chatId, text, {
        link_preview_options: { is_disabled: true },
      });
    } catch (e) {
      console.warn("[order-completion-notify] не удалось отправить", chatId, order.id, e);
    }
  }
}
