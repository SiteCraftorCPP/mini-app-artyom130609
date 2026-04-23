import { InlineKeyboard, type Bot, type Context } from "grammy";

import {
  ADMIN_ORDERS_MOCK,
  getAdminOrderById,
  getHistory50PageCount,
  getHistory50Slice,
  type AdminOrderRow,
} from "./admin-orders-mock.js";
import {
  BTN_ADMIN_CURRENT_ORDERS,
  BTN_ADMIN_FIND_ORDER,
  BTN_ADMIN_HISTORY_50,
  BTN_ADMIN_MAIN,
  BTN_ADMIN_STATS,
  BTN_BACK_TO_ADMIN,
  BTN_BACK_TO_HISTORY_50,
  BTN_BACK_TO_ORDER_LIST,
  BTN_CONFIRM_VIRT,
  BTN_COPY_ORDER_DATA,
  BTN_ORDER_PERIOD_STATS,
  BTN_ADMIN_USER_STATS,
  BTN_ADMIN_BROADCASTS,
  BTN_BROADCAST_BACK,
  BTN_BROADCAST_BUY_VIRTS,
  BTN_STAT_PERIOD_CHOOSE,
  BTN_STATS_BACK,
  BTN_STATS_VIEW_ORDERS,
  buildOrderPeriodStatsMessage,
  BTN_CANCEL_PROFIT_INPUT,
  MSG_ORDER_LOOKUP_PROMPT,
  MSG_ORDER_NOT_FOUND,
  MSG_PROFIT_CANCELLED,
  MSG_PROFIT_INVALID,
  PENDING_ORDERS_HEADER,
  STAT_PERIOD_TITLES,
  STATS_HEADER,
  msgProfitPrompt,
  msgProfitSaved,
} from "./texts.js";
import { getAllUserIds, getUniqueUserCount } from "./user-usage-store.js";

const CB = {
  list: "admin:lst",
  menu: "admin:menu",
  stats: "admin:st",
  find: "admin:find",
  userStats: "admin:ust",
  broadcasts: "admin:bc",
} as const;

const cbView = (id: string) => `admin:v:${id}`;
const cbCopy = (id: string) => `admin:c:${id}`;
const cbOk = (id: string) => `admin:ok:${id}`;
/** Отмена ввода чистой прибыли (инлайн, без /cancel). */
const CB_PROFIT_Q = "a:qpf";

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
  const head = [
    `<b>Детали заказа ${idLine}:</b>`,
    "",
    `🕒 Открыт: ${escapeHtml(o.openedAtLine)}`,
  ];
  if (o.closedAtLine) {
    head.push(`🕐 Закрыт: ${escapeHtml(o.closedAtLine)}`);
  }
  return [
    ...head,
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
  const head = [
    `Детали заказа ${o.publicOrderId}:`,
    "",
    `🕒 Открыт: ${o.openedAtLine}`,
  ];
  if (o.closedAtLine) {
    head.push(`🕐 Закрыт: ${o.closedAtLine}`);
  }
  return [
    ...head,
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
  assertCbData("ah:0");
  assertCbData("a:st");
  return new InlineKeyboard()
    .text(BTN_ADMIN_CURRENT_ORDERS, CB.list)
    .row()
    .text(BTN_ADMIN_STATS, CB.stats)
    .row()
    .text(BTN_ADMIN_FIND_ORDER, CB.find)
    .row()
    .text(BTN_ADMIN_HISTORY_50, "ah:0")
    .row()
    .text(BTN_ORDER_PERIOD_STATS, "a:st")
    .row()
    .text(BTN_ADMIN_USER_STATS, CB.userStats)
    .row()
    .text(BTN_ADMIN_BROADCASTS, CB.broadcasts);
}

function buildUserStatsMessage(): string {
  const count = getUniqueUserCount();
  return [
    "👥 Статистика пользователей",
    "",
    `Пользователей воспользовалось ботом: ${count}`,
  ].join("\n");
}

function buildUserStatsKeyboard() {
  assertCbData(CB.menu);
  return new InlineKeyboard().text(BTN_BACK_TO_ADMIN, CB.menu);
}

type BroadcastPreset = {
  key: string;
  title: string;
  body: string;
};

const BROADCAST_PRESETS: BroadcastPreset[] = [
  {
    key: "promo1",
    title: "Рассылка #1 (шаблон)",
    body: [
      "📣 Рассылка",
      "",
      "Текст рассылки (шаблон).",
      "Отредактируйте под себя в коде: bot/src/admin.ts",
    ].join("\n"),
  },
  {
    key: "promo2",
    title: "Рассылка #2 (шаблон)",
    body: [
      "📣 Рассылка",
      "",
      "Второй шаблон рассылки.",
      "Отредактируйте под себя в коде: bot/src/admin.ts",
    ].join("\n"),
  },
];

function buildBroadcastMenuText(): string {
  return ["📣 Рассылка", "", "Выберите рассылку:"].join("\n");
}

function buildBroadcastMenuKeyboard() {
  const kb = new InlineKeyboard();
  for (const p of BROADCAST_PRESETS) {
    const d = `admin:bc:${p.key}`;
    assertCbData(d);
    kb.text(p.title, d).row();
  }
  assertCbData(CB.menu);
  kb.text(BTN_BACK_TO_ADMIN, CB.menu);
  return kb;
}

function buildBroadcastPreviewKeyboard(miniAppUrl: string) {
  assertCbData(CB.broadcasts);
  return new InlineKeyboard()
    .webApp(BTN_BROADCAST_BUY_VIRTS, miniAppUrl)
    .row()
    .text(BTN_BROADCAST_BACK, CB.broadcasts)
    .row()
    .text(BTN_BACK_TO_ADMIN, CB.menu);
}

function buildHistory50IntroText(page: number, pageCount: number): string {
  return [
    "📋 Последние 50 заказов (полные данные, как в «Найти заказ»).",
    "",
    `Стр. ${page + 1} / ${pageCount} — нажмите заказ в кнопках ниже.`,
  ].join("\n");
}

function buildHistory50Keyboard(page: number): InlineKeyboard {
  const pageCount = getHistory50PageCount();
  const slice = getHistory50Slice(page);
  const kb = new InlineKeyboard();
  for (const o of slice) {
    const d = `hv:${o.id}:${page}`;
    assertCbData(d);
    kb.text(formatListButtonLabel(o), d).row();
  }
  if (page > 0 || page < pageCount - 1) {
    if (page > 0) {
      const p = `ah:${page - 1}`;
      assertCbData(p);
      kb.text("⬅️ Пред. стр.", p);
    }
    if (page < pageCount - 1) {
      const p = `ah:${page + 1}`;
      assertCbData(p);
      kb.text("➡️ След. стр.", p);
    }
    kb.row();
  }
  assertCbData(CB.menu);
  kb.text(BTN_BACK_TO_ADMIN, CB.menu);
  return kb;
}

function buildOrderPeriodMenuKeyboard(): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (let i = 0; i < STAT_PERIOD_TITLES.length; i += 1) {
    const t = STAT_PERIOD_TITLES[i]!;
    const d = `a:s${i}` as const;
    assertCbData(d);
    kb.text(t, d).row();
  }
  assertCbData(CB.menu);
  kb.text(BTN_BACK_TO_ADMIN, CB.menu);
  return kb;
}

function buildOrderPeriodResultKeyboard(): InlineKeyboard {
  assertCbData("a:st");
  return new InlineKeyboard()
    .text(BTN_STAT_PERIOD_CHOOSE, "a:st")
    .row()
    .text(BTN_BACK_TO_ADMIN, CB.menu);
}

function buildOrderDetailKeyboard(
  id: string,
  mode: "list" | "find" | "hist50",
  histPage = 0,
) {
  const order = getAdminOrderById(id);
  const isClosed = Boolean(order?.closedAtLine);
  const dCopy = cbCopy(id);
  assertCbData(dCopy);
  const kb = new InlineKeyboard().text(BTN_COPY_ORDER_DATA, dCopy).row();
  if (!isClosed) {
    const dOk = cbOk(id);
    assertCbData(dOk);
    kb.text(BTN_CONFIRM_VIRT, dOk).row();
  }
  if (mode === "find") {
    assertCbData(CB.menu);
    kb.text(BTN_BACK_TO_ADMIN, CB.menu);
  } else if (mode === "hist50") {
    const d = `ah:${histPage}`;
    assertCbData(d);
    kb.text(BTN_BACK_TO_HISTORY_50, d);
  } else {
    assertCbData(CB.list);
    kb.text(BTN_BACK_TO_ORDER_LIST, CB.list);
  }
  return kb;
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

function backToAdminKeyboard() {
  assertCbData(CB.menu);
  return new InlineKeyboard().text(BTN_BACK_TO_ADMIN, CB.menu);
}

function profitCancelKeyboard() {
  assertCbData(CB_PROFIT_Q);
  return new InlineKeyboard().text(BTN_CANCEL_PROFIT_INPUT, CB_PROFIT_Q);
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
  const awaitingOrderLookup = new Set<number>();

  function clearAwaitingProfit(userId: number) {
    awaitingProfitByUserId.delete(userId);
  }

  function clearAwaitingOrderLookup(userId: number) {
    awaitingOrderLookup.delete(userId);
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
      clearAwaitingOrderLookup(ctx.from.id);
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
      clearAwaitingOrderLookup(ctx.from.id);
    }
    await ctx.answerCallbackQuery();
    await a.editMessageText(BTN_ADMIN_MAIN, {
      reply_markup: adminMenuKeyboard(),
    });
  });

  bot.callbackQuery(CB.userStats, async (ctx) => {
    const a = await requireAdmin(ctx);
    if (a == null) {
      return;
    }
    if (ctx.from) {
      clearAwaitingProfit(ctx.from.id);
      clearAwaitingOrderLookup(ctx.from.id);
    }
    await ctx.answerCallbackQuery();
    const text = buildUserStatsMessage();
    try {
      await a.editMessageText(text, { reply_markup: buildUserStatsKeyboard() });
    } catch {
      await a.reply(text, { reply_markup: buildUserStatsKeyboard() });
    }
  });

  bot.callbackQuery(CB.broadcasts, async (ctx) => {
    const a = await requireAdmin(ctx);
    if (a == null) {
      return;
    }
    if (ctx.from) {
      clearAwaitingProfit(ctx.from.id);
      clearAwaitingOrderLookup(ctx.from.id);
    }
    await ctx.answerCallbackQuery();
    const text = buildBroadcastMenuText();
    const kb = buildBroadcastMenuKeyboard();
    try {
      await a.editMessageText(text, { reply_markup: kb });
    } catch {
      await a.reply(text, { reply_markup: kb });
    }
  });

  bot.callbackQuery(/^admin:bc:([a-zA-Z0-9_-]+)$/, async (ctx) => {
    const a = await requireAdmin(ctx);
    if (a == null) {
      return;
    }
    if (ctx.from) {
      clearAwaitingProfit(ctx.from.id);
      clearAwaitingOrderLookup(ctx.from.id);
    }
    const key = ctx.match[1] ?? "";
    const preset = BROADCAST_PRESETS.find((p) => p.key === key);
    await ctx.answerCallbackQuery();
    if (!preset) {
      await a.reply("Рассылка не найдена.", { reply_markup: backToAdminKeyboard() });
      return;
    }

    const miniAppUrl =
      process.env.MINI_APP_URL?.trim() ||
      process.env.APP_DOMAIN?.trim() ||
      "https://artshopvirts.space";

    const count = getAllUserIds().length;
    const text = [
      preset.body,
      "",
      `Получателей в базе: ${count}`,
      "",
      "Кнопка ниже откроет мини-апп «Купить вирты».",
    ].join("\n");

    const kb = buildBroadcastPreviewKeyboard(miniAppUrl);
    try {
      await a.editMessageText(text, { reply_markup: kb });
    } catch {
      await a.reply(text, { reply_markup: kb });
    }
  });

  bot.callbackQuery(CB.stats, async (ctx) => {
    const a = await requireAdmin(ctx);
    if (a == null) {
      return;
    }
    if (ctx.from) {
      clearAwaitingProfit(ctx.from.id);
      clearAwaitingOrderLookup(ctx.from.id);
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
      clearAwaitingOrderLookup(ctx.from.id);
    }
    await ctx.answerCallbackQuery();
    const text = PENDING_ORDERS_HEADER;
    try {
      await a.editMessageText(text, { reply_markup: buildOrderListKeyboard() });
    } catch (e) {
      await a.reply(text, { reply_markup: buildOrderListKeyboard() });
    }
  });

  bot.callbackQuery(CB.find, async (ctx) => {
    const a = await requireAdmin(ctx);
    if (a == null) {
      return;
    }
    if (ctx.from) {
      clearAwaitingProfit(ctx.from.id);
      awaitingOrderLookup.add(ctx.from.id);
    }
    await ctx.answerCallbackQuery();
    const kb = new InlineKeyboard().text(BTN_BACK_TO_ADMIN, CB.menu);
    const text = MSG_ORDER_LOOKUP_PROMPT;
    try {
      await a.editMessageText(text, { reply_markup: kb });
    } catch (e) {
      await a.reply(text, { reply_markup: kb });
    }
  });

  bot.callbackQuery(/^ah:(\d+)$/, async (ctx) => {
    const a = await requireAdmin(ctx);
    if (a == null) {
      return;
    }
    if (ctx.from) {
      clearAwaitingProfit(ctx.from.id);
      clearAwaitingOrderLookup(ctx.from.id);
    }
    await ctx.answerCallbackQuery();
    const maxP = getHistory50PageCount();
    let page = parseInt(ctx.match[1] ?? "0", 10);
    if (Number.isNaN(page) || page < 0) {
      page = 0;
    }
    if (page > maxP - 1) {
      page = Math.max(0, maxP - 1);
    }
    const text = buildHistory50IntroText(page, maxP);
    const kb = buildHistory50Keyboard(page);
    try {
      await a.editMessageText(text, { reply_markup: kb });
    } catch (e) {
      await a.reply(text, { reply_markup: kb });
    }
  });

  bot.callbackQuery("a:st", async (ctx) => {
    const a = await requireAdmin(ctx);
    if (a == null) {
      return;
    }
    if (ctx.from) {
      clearAwaitingProfit(ctx.from.id);
      clearAwaitingOrderLookup(ctx.from.id);
    }
    await ctx.answerCallbackQuery();
    const text = [
      "📊 Статистика заказов",
      "",
      "Выберите период (сейчас — демо, позже — из API):",
    ].join("\n");
    const kb = buildOrderPeriodMenuKeyboard();
    try {
      await a.editMessageText(text, { reply_markup: kb });
    } catch (e) {
      await a.reply(text, { reply_markup: kb });
    }
  });

  bot.callbackQuery(/^a:s([0-7])$/, async (ctx) => {
    const a = await requireAdmin(ctx);
    if (a == null) {
      return;
    }
    if (ctx.from) {
      clearAwaitingProfit(ctx.from.id);
      clearAwaitingOrderLookup(ctx.from.id);
    }
    const idx = parseInt(ctx.match[1] ?? "0", 10);
    await ctx.answerCallbackQuery();
    const text = buildOrderPeriodStatsMessage(idx);
    const kb = buildOrderPeriodResultKeyboard();
    try {
      await a.editMessageText(text, { reply_markup: kb });
    } catch (e) {
      await a.reply(text, { reply_markup: kb });
    }
  });

  bot.callbackQuery(/^hv:([^:\s]+):(\d+)$/, async (ctx) => {
    const a = await requireAdmin(ctx);
    if (a == null) {
      return;
    }
    if (ctx.from) {
      clearAwaitingProfit(ctx.from.id);
      clearAwaitingOrderLookup(ctx.from.id);
    }
    const id = ctx.match[1] ?? "";
    const page = parseInt(ctx.match[2] ?? "0", 10) || 0;
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
      reply_markup: buildOrderDetailKeyboard(id, "hist50", page),
    };
    try {
      await a.editMessageText(html, editOptions);
    } catch (e) {
      await a.reply(html, editOptions);
    }
  });

  bot.callbackQuery(/^admin:v:([^:\s]+)$/, async (ctx) => {
    const a = await requireAdmin(ctx);
    if (a == null) {
      return;
    }
    if (ctx.from) {
      clearAwaitingProfit(ctx.from.id);
      clearAwaitingOrderLookup(ctx.from.id);
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
      reply_markup: buildOrderDetailKeyboard(id, "list"),
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
    if (order.closedAtLine) {
      await ctx.answerCallbackQuery({
        text: "Заказ уже закрыт — выдачу не подтвердить.",
        show_alert: true,
      });
      return;
    }
    await ctx.answerCallbackQuery();
    if (ctx.from) {
      awaitingProfitByUserId.set(ctx.from.id, id);
      clearAwaitingOrderLookup(ctx.from.id);
    }
    const ref = order.publicOrderId ?? id;
    await a.reply(msgProfitPrompt(ref), {
      reply_markup: profitCancelKeyboard(),
    });
  });

  bot.callbackQuery(CB_PROFIT_Q, async (ctx) => {
    const a = await requireAdmin(ctx);
    if (a == null) {
      return;
    }
    if (ctx.from) {
      clearAwaitingProfit(ctx.from.id);
    }
    await ctx.answerCallbackQuery();
    const text = [MSG_PROFIT_CANCELLED, "", BTN_ADMIN_MAIN].join("\n");
    try {
      await a.editMessageText(text, { reply_markup: adminMenuKeyboard() });
    } catch (e) {
      await a.reply(text, { reply_markup: adminMenuKeyboard() });
    }
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
    if (awaitingOrderLookup.has(ctx.from.id)) {
      const text = ctx.message?.text;
      if (text === undefined) {
        await ctx.reply(
          "Отправьте номер заказа одним сообщением (текстом).",
          { reply_markup: backToAdminKeyboard() },
        );
        return;
      }
      const t = text.trim();
      if (t.startsWith("/")) {
        await ctx.reply(
          "Сначала введите номер заказа без / или нажмите кнопку ниже.",
          { reply_markup: backToAdminKeyboard() },
        );
        return;
      }
      if (t.length < 1) {
        await ctx.reply(MSG_ORDER_NOT_FOUND, {
          reply_markup: backToAdminKeyboard(),
        });
        return;
      }
      const order = getAdminOrderById(t);
      if (!order) {
        await ctx.reply(MSG_ORDER_NOT_FOUND, {
          reply_markup: backToAdminKeyboard(),
        });
        return;
      }
      clearAwaitingOrderLookup(ctx.from.id);
      const html = buildOrderDetailHtml(order);
      await ctx.reply(html, {
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
        reply_markup: buildOrderDetailKeyboard(order.id, "find"),
      });
      return;
    }
    const pendingOrderId = awaitingProfitByUserId.get(ctx.from.id);
    if (pendingOrderId === undefined) {
      return next();
    }
    const text = ctx.message?.text;
    if (text === undefined) {
      await ctx.reply("Отправьте сумму цифрами одним сообщением.", {
        reply_markup: profitCancelKeyboard(),
      });
      return;
    }
    const t = text.trim();
    if (t.startsWith("/")) {
      await ctx.reply(
        "Введите число без / — или нажмите «Отмена» в том сообщении, где запрос прибыли.",
        { reply_markup: profitCancelKeyboard() },
      );
      return;
    }
    const normalized = t.replace(/\s/g, "").replace(",", ".");
    if (!/^\d+(\.\d+)?$/.test(normalized)) {
      await ctx.reply(MSG_PROFIT_INVALID, {
        reply_markup: profitCancelKeyboard(),
      });
      return;
    }
    const value = Number(normalized);
    if (!Number.isFinite(value) || value < 0) {
      await ctx.reply(MSG_PROFIT_INVALID, {
        reply_markup: profitCancelKeyboard(),
      });
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
