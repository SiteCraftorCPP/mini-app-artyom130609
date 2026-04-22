import { InlineKeyboard, type Bot, type Context } from "grammy";

import {
  ADMIN_ORDERS_MOCK,
  getAdminOrderById,
  type AdminOrderRow,
} from "./admin-orders-mock.js";
import {
  BTN_ADMIN_CURRENT_ORDERS,
  BTN_ADMIN_MAIN,
  BTN_ADMIN_STATS,
  BTN_BACK_TO_ADMIN,
  BTN_BACK_TO_ORDER_LIST,
  BTN_CONFIRM_VIRT,
  BTN_COPY_ORDER_DATA,
  BTN_STATS_BACK,
  BTN_STATS_VIEW_ORDERS,
  MSG_PROFIT_CANCELLED,
  MSG_PROFIT_INVALID,
  PENDING_ORDERS_HEADER,
  STATS_HEADER,
  msgProfitPrompt,
  msgProfitSaved,
} from "./texts.js";

const CB = {
  list: "admin:lst",
  menu: "admin:menu",
  stats: "admin:st",
} as const;

const cbView = (id: string) => `admin:v:${id}`;
const cbCopy = (id: string) => `admin:c:${id}`;
const cbOk = (id: string) => `admin:ok:${id}`;

const MAX_DATA = 64;
function assertCbData(s: string) {
  if (s.length > MAX_DATA) {
    console.warn("admin: callback_data too long", s.length, s);
  }
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function stripAt(name: string): string {
  return name.replace(/^@/, "");
}

function formatListButtonLabel(o: AdminOrderRow): string {
  const u = stripAt(o.telegramUsername);
  return `#${o.id} (${o.categoryLabel}) - @${u}`;
}

function buildOrderDetailHtml(o: AdminOrderRow): string {
  const un = stripAt(o.telegramUsername);
  const userLink = `https://t.me/${un}`;
  const g = escapeHtml(o.game);
  const s = escapeHtml(o.server);
  const v = escapeHtml(o.virtAmountLabel);
  const t = escapeHtml(o.transferMethod);
  const bank = escapeHtml(o.bankAccount);
  const idLine = escapeHtml(o.publicOrderId);
  return [
    `<b>Детали заказа ${idLine}:</b>`,
    "",
    `🕒 Открыт: ${escapeHtml(o.openedAtLine)}`,
    `Пользователь: <a href="${escapeHtml(userLink)}">@${escapeHtml(un)}</a> (${escapeHtml(o.telegramUserId)})`,
    `Игра/Услуга: <i>${g}</i>`,
    `Сервер: <i>${s}</i>`,
    `Количество виртов: <i>${v}</i>`,
    `Способ передачи: <i>${t}</i>`,
    `Счет в банке: ${bank}`,
    `Сумма заказа в рублях: <b>${escapeHtml(String(o.amountRub))}</b>`,
  ].join("\n");
}

function buildOrderPlainForCopy(o: AdminOrderRow): string {
  const un = stripAt(o.telegramUsername);
  return [
    `Детали заказа ${o.publicOrderId}:`,
    "",
    `🕒 Открыт: ${o.openedAtLine}`,
    `Пользователь: @${un} (${o.telegramUserId})`,
    `Игра/Услуга: ${o.game}`,
    `Сервер: ${o.server}`,
    `Количество виртов: ${o.virtAmountLabel}`,
    `Способ передачи: ${o.transferMethod}`,
    `Счет в банке: ${o.bankAccount}`,
    `Сумма заказа в рублях: ${o.amountRub}`,
  ].join("\n");
}

function getStatsFromOrders(): { count: number; totalRub: number } {
  const count = ADMIN_ORDERS_MOCK.length;
  const totalRub = ADMIN_ORDERS_MOCK.reduce((s, o) => s + o.amountRub, 0);
  return { count, totalRub };
}

function buildStatsMessage(): string {
  const { count, totalRub } = getStatsFromOrders();
  return [
    STATS_HEADER,
    "",
    `📦 Количество заказов: ${count}`,
    `💵 Общая сумма: ${totalRub.toFixed(2)} RUB`,
  ].join("\n");
}

function buildStatsKeyboard() {
  return new InlineKeyboard()
    .text(BTN_STATS_VIEW_ORDERS, CB.list)
    .row()
    .text(BTN_STATS_BACK, CB.menu);
}

function adminMenuKeyboard() {
  return new InlineKeyboard()
    .text(BTN_ADMIN_CURRENT_ORDERS, CB.list)
    .row()
    .text(BTN_ADMIN_STATS, CB.stats);
}

function buildOrderListKeyboard() {
  const kb = new InlineKeyboard();
  for (const o of ADMIN_ORDERS_MOCK) {
    const d = cbView(o.id);
    assertCbData(d);
    kb.text(formatListButtonLabel(o), d).row();
  }
  assertCbData(CB.menu);
  kb.text(BTN_BACK_TO_ADMIN, CB.menu);
  return kb;
}

function buildOrderDetailKeyboard(id: string) {
  const dCopy = cbCopy(id);
  const dOk = cbOk(id);
  assertCbData(dCopy);
  assertCbData(dOk);
  return new InlineKeyboard()
    .text(BTN_COPY_ORDER_DATA, dCopy)
    .row()
    .text(BTN_CONFIRM_VIRT, dOk)
    .row()
    .text(BTN_BACK_TO_ORDER_LIST, CB.list);
}

async function clearReplyKeyboard(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (chatId === undefined) {
    return;
  }
  const m = await ctx.reply("\u2060", {
    reply_markup: { remove_keyboard: true },
  });
  try {
    await ctx.api.deleteMessage(chatId, m.message_id);
  } catch {
    /* не критично */
  }
}

export function installAdminModule(bot: Bot, adminIds: Set<number>) {
  /** Ожидание ввода чистой прибыли после «Подтвердить выдачу». */
  const awaitingProfitByUserId = new Map<number, string>();

  function clearAwaitingProfit(userId: number) {
    awaitingProfitByUserId.delete(userId);
  }

  async function requireAdmin(
    ctx: Context,
  ): Promise<
    (Context & { from: NonNullable<Context["from"]> }) | null
  > {
    if (ctx.from === undefined) {
      return null;
    }
    if (!adminIds.has(ctx.from.id)) {
      if (ctx.callbackQuery) {
        await ctx.answerCallbackQuery({ text: "Нет доступа.", show_alert: true });
      } else {
        await ctx.reply("Нет доступа.");
      }
      return null;
    }
    return ctx as Context & { from: NonNullable<Context["from"]> };
  }

  bot.command("admin", async (ctx) => {
    if (ctx.chat?.type !== "private") {
      return;
    }
    const a = await requireAdmin(ctx);
    if (a == null) {
      return;
    }
    if (ctx.from) {
      clearAwaitingProfit(ctx.from.id);
    }
    await clearReplyKeyboard(a);
    await a.reply(BTN_ADMIN_MAIN, {
      reply_markup: adminMenuKeyboard(),
    });
  });

  bot.callbackQuery(CB.menu, async (ctx) => {
    const a = await requireAdmin(ctx);
    if (a == null) {
      return;
    }
    if (ctx.from) {
      clearAwaitingProfit(ctx.from.id);
    }
    await ctx.answerCallbackQuery();
    await a.editMessageText(BTN_ADMIN_MAIN, {
      reply_markup: adminMenuKeyboard(),
    });
  });

  bot.callbackQuery(CB.stats, async (ctx) => {
    const a = await requireAdmin(ctx);
    if (a == null) {
      return;
    }
    if (ctx.from) {
      clearAwaitingProfit(ctx.from.id);
    }
    await ctx.answerCallbackQuery();
    const text = buildStatsMessage();
    try {
      await a.editMessageText(text, { reply_markup: buildStatsKeyboard() });
    } catch (e) {
      await a.reply(text, { reply_markup: buildStatsKeyboard() });
    }
  });

  bot.callbackQuery(CB.list, async (ctx) => {
    const a = await requireAdmin(ctx);
    if (a == null) {
      return;
    }
    if (ctx.from) {
      clearAwaitingProfit(ctx.from.id);
    }
    await ctx.answerCallbackQuery();
    const text = PENDING_ORDERS_HEADER;
    try {
      await a.editMessageText(text, { reply_markup: buildOrderListKeyboard() });
    } catch (e) {
      await a.reply(text, { reply_markup: buildOrderListKeyboard() });
    }
  });

  bot.callbackQuery(/^admin:v:([^:\s]+)$/, async (ctx) => {
    const a = await requireAdmin(ctx);
    if (a == null) {
      return;
    }
    const id = ctx.match[1] ?? "";
    const order = getAdminOrderById(id);
    if (!order) {
      await ctx.answerCallbackQuery({ text: "Заказ не найден", show_alert: true });
      return;
    }
    await ctx.answerCallbackQuery();
    const html = buildOrderDetailHtml(order);
    const editOptions = {
      parse_mode: "HTML" as const,
      link_preview_options: { is_disabled: true },
      reply_markup: buildOrderDetailKeyboard(id),
    };
    try {
      await a.editMessageText(html, editOptions);
    } catch (e) {
      await a.reply(html, editOptions);
    }
  });

  bot.callbackQuery(/^admin:c:([^:\s]+)$/, async (ctx) => {
    const a = await requireAdmin(ctx);
    if (a == null) {
      return;
    }
    const id = ctx.match[1] ?? "";
    const order = getAdminOrderById(id);
    if (!order) {
      await ctx.answerCallbackQuery({ text: "Заказ не найден", show_alert: true });
      return;
    }
    await ctx.answerCallbackQuery();
    const text = buildOrderPlainForCopy(order);
    await a.reply(`<pre>${escapeHtml(text)}</pre>`, { parse_mode: "HTML" });
  });

  bot.callbackQuery(/^admin:ok:([^:\s]+)$/, async (ctx) => {
    const a = await requireAdmin(ctx);
    if (a == null) {
      return;
    }
    const id = ctx.match[1] ?? "";
    const order = getAdminOrderById(id);
    if (!order) {
      await ctx.answerCallbackQuery({ text: "Заказ не найден", show_alert: true });
      return;
    }
    await ctx.answerCallbackQuery();
    if (ctx.from) {
      awaitingProfitByUserId.set(ctx.from.id, id);
    }
    const ref = order.publicOrderId ?? id;
    await a.reply(msgProfitPrompt(ref));
  });

  bot.on("message", async (ctx, next) => {
    if (ctx.message?.web_app_data != null) {
      return next();
    }
    if (ctx.chat?.type !== "private") {
      return next();
    }
    if (ctx.from === undefined) {
      return next();
    }
    if (!adminIds.has(ctx.from.id)) {
      return next();
    }
    const pendingOrderId = awaitingProfitByUserId.get(ctx.from.id);
    if (pendingOrderId === undefined) {
      return next();
    }
    const text = ctx.message?.text;
    if (text === undefined) {
      await ctx.reply(
        "Отправьте сумму цифрами одним сообщением. Чтобы отменить: /cancel",
      );
      return;
    }
    const t = text.trim();
    if (t.startsWith("/")) {
      if (/^\/cancel(@\S+)?$/i.test(t)) {
        clearAwaitingProfit(ctx.from.id);
        await ctx.reply(MSG_PROFIT_CANCELLED);
        return;
      }
      await ctx.reply(
        "Сначала введите число, либо отправьте /cancel для отмены.",
      );
      return;
    }
    const normalized = t.replace(/\s/g, "").replace(",", ".");
    if (!/^\d+(\.\d+)?$/.test(normalized)) {
      await ctx.reply(MSG_PROFIT_INVALID);
      return;
    }
    const value = Number(normalized);
    if (!Number.isFinite(value) || value < 0) {
      await ctx.reply(MSG_PROFIT_INVALID);
      return;
    }
    clearAwaitingProfit(ctx.from.id);
    const amountStr = value.toFixed(2);
    await ctx.reply(msgProfitSaved(pendingOrderId, amountStr));
    console.info(
      "[admin-profit]",
      "user=",
      ctx.from.id,
      "order=",
      pendingOrderId,
      "profitRub=",
      amountStr,
    );
  });
}
