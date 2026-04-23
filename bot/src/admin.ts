import { InlineKeyboard, type Bot, type Context } from "grammy";

import {
  getActiveOrders,
  getAdminOrderById,
  getHistory50PageCount,
  getHistory50Slice,
  type AdminOrderRow,
} from "./admin-orders-mock.js";
import { parseRublesAmountFromUserText } from "./money-input.js";
import { closeActiveOrder } from "./orders-store.js";
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
  BTN_ADMIN_SUPPLIES,
  BTN_SUPPLIES_ACTIVE,
  BTN_SUPPLIES_BACK,
  BTN_SUPPLIES_CANCEL_INPUT,
  BTN_SUPPLIES_FINISH,
  BTN_SUPPLIES_HISTORY,
  BTN_SUPPLIES_NEW,
  BTN_SUPPLIES_STATS,
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
import { sendOrderCompletedToBuyer } from "./order-notify.js";
import {
  closeSupply,
  createSupply,
  getSupplyById,
  listActiveSupplies,
  listClosedSupplies,
  type SupplyRow,
} from "./supplies-store.js";

const CB = {
  list: "admin:lst",
  menu: "admin:menu",
  stats: "admin:st",
  find: "admin:find",
  userStats: "admin:ust",
  broadcasts: "admin:bc",
  supplies: "admin:sup",
} as const;

const cbView = (id: string) => `admin:v:${id}`;
const cbCopy = (id: string) => `admin:c:${id}`;
const cbOk = (id: string) => `admin:ok:${id}`;
/** Отмена ввода чистой прибыли (инлайн, без /cancel). */
const CB_PROFIT_Q = "a:qpf";
const CB_SUPPLY_CANCEL = "sup:cancel";

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
  return `#${o.publicOrderId} (${o.categoryLabel}) - @${u}`;
}

function buildOrderDetailHtml(o: AdminOrderRow): string {
  const un = stripAt(o.telegramUsername);
  const userLink = `https://t.me/${un}`;
  const idLine = escapeHtml(o.publicOrderId);
  const amountStr = o.amountRub.toFixed(2);
  const head = [
    `<b>Детали заказа <code>${idLine}</code>:</b>`,
    "",
    `🕒 Открыт: <code>${escapeHtml(o.openedAtLine)}</code>`,
  ];
  if (o.closedAtLine) {
    head.push(`🕐 Закрыт: <code>${escapeHtml(o.closedAtLine)}</code>`);
  }
  return [
    ...head,
    `Пользователь: <a href="${escapeHtml(userLink)}">@${escapeHtml(un)}</a> (<code>${escapeHtml(o.telegramUserId)}</code>)`,
    `Игра/Услуга: <code>${escapeHtml(o.game)}</code>`,
    `Сервер: <code>${escapeHtml(o.server)}</code>`,
    `Количество виртов: <code>${escapeHtml(o.virtAmountLabel)}</code>`,
    `Способ передачи: <code>${escapeHtml(o.transferMethod)}</code>`,
    `Счет в банке: <code>${escapeHtml(o.bankAccount)}</code>`,
    `Сумма заказа в рублях: <b><code>${escapeHtml(amountStr)}</code></b>`,
    ...(typeof o.profitRub === "number"
      ? [
          `Чистая прибыль (фикс.): <b><code>${escapeHtml(o.profitRub.toFixed(2))}</code></b> RUB`,
        ]
      : []),
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
    `Сумма заказа в рублях: ${o.amountRub.toFixed(2)}`,
    ...(typeof o.profitRub === "number"
      ? [`Чистая прибыль (фикс.): ${o.profitRub.toFixed(2)} RUB`]
      : []),
  ].join("\n");
}

function getStatsFromOrders(): { count: number; totalRub: number } {
  const list = getActiveOrders();
  const count = list.length;
  const totalRub = list.reduce((s, o) => s + o.amountRub, 0);
  return { count, totalRub };
}

function buildStatsMessage(): string {
  const { count, totalRub } = getStatsFromOrders();
  return [
    STATS_HEADER,
    "",
    "Общая сумма в рублях по всем заказам, которые сейчас в списке «актуальные» (это только справка, без подтверждения выдачи):",
    `<b>${totalRub.toFixed(2)} RUB</b>`,
    "",
    `Заказов в списке: ${count}.`,
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
    .text(BTN_ADMIN_BROADCASTS, CB.broadcasts)
    .row()
    .text(BTN_ADMIN_SUPPLIES, CB.supplies);
}

function formatDateTime(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function supplyLabelShort(s: SupplyRow): string {
  const n = s.seq ? `#${s.seq}` : "#?";
  const p = s.project.trim();
  const srv = s.server.trim();
  return `${n} ${p} / ${srv}`;
}

function buildSuppliesMenuText(): string {
  return ["📦 Поставки", "", "Выберите действие:"].join("\n");
}

function buildSuppliesMenuKeyboard() {
  assertCbData("sup:new");
  assertCbData("sup:act");
  assertCbData("sup:his");
  assertCbData("sup:st");
  assertCbData(CB.menu);
  return new InlineKeyboard()
    .text(BTN_SUPPLIES_NEW, "sup:new")
    .row()
    .text(BTN_SUPPLIES_ACTIVE, "sup:act")
    .row()
    .text(BTN_SUPPLIES_HISTORY, "sup:his")
    .row()
    .text(BTN_SUPPLIES_STATS, "sup:st")
    .row()
    .text(BTN_BACK_TO_ADMIN, CB.menu);
}

function buildSuppliesActiveText(active: SupplyRow[]): string {
  if (active.length === 0) {
    return ["🔥 Актуальные поставки", "", "Пока пусто."].join("\n");
  }
  return [
    "🔥 Актуальные поставки",
    "",
    "Нажмите поставку, чтобы открыть.",
  ].join("\n");
}

function buildSuppliesActiveKeyboard(active: SupplyRow[]) {
  const kb = new InlineKeyboard();
  for (const s of active) {
    const d = `sup:v:${s.id}`;
    assertCbData(d);
    kb.text(supplyLabelShort(s), d).row();
  }
  assertCbData(CB.supplies);
  kb.text(BTN_SUPPLIES_BACK, CB.supplies).row();
  kb.text(BTN_BACK_TO_ADMIN, CB.menu);
  return kb;
}

function buildSupplyDetailText(s: SupplyRow, seq: number | null): string {
  const n = seq ? `#${seq}` : "Поставка";
  const lines = [
    `📦 Поставка ${n}`,
    "",
    `Проект: ${s.project}`,
    `Сервер: ${s.server}`,
    `Вирты: ${s.virtAmount}`,
    "",
    `🕒 Открыта: ${formatDateTime(s.openedAtMs)}`,
  ];
  if (s.closedAtMs) {
    lines.push(`🕐 Закрыта: ${formatDateTime(s.closedAtMs)}`);
    if (typeof s.turnoverRub === "number") {
      lines.push(`💵 Оборот: ${s.turnoverRub.toFixed(2)} RUB`);
    }
    if (typeof s.profitRub === "number") {
      lines.push(`💰 Чистая прибыль: ${s.profitRub.toFixed(2)} RUB`);
    }
  }
  return lines.join("\n");
}

function buildSupplyDetailKeyboard(s: SupplyRow) {
  const kb = new InlineKeyboard();
  if (!s.closedAtMs) {
    const d = `sup:fin:${s.id}`;
    assertCbData(d);
    kb.text(BTN_SUPPLIES_FINISH, d).row();
  }
  assertCbData("sup:act");
  kb.text(BTN_SUPPLIES_BACK, "sup:act").row();
  kb.text(BTN_BACK_TO_ADMIN, CB.menu);
  return kb;
}

function buildSuppliesHistoryText(closed: SupplyRow[]): string {
  if (closed.length === 0) {
    return ["📜 История поставок", "", "Пока пусто."].join("\n");
  }
  return [
    "📜 История поставок",
    "",
    "Нажмите поставку, чтобы открыть.",
  ].join("\n");
}

function buildSuppliesHistoryKeyboard(closed: SupplyRow[]) {
  const kb = new InlineKeyboard();
  const shown = closed
    .slice()
    .sort((a, b) => (b.closedAtMs ?? 0) - (a.closedAtMs ?? 0))
    .slice(0, 50);
  for (const s of shown) {
    const d = `sup:h:${s.id}`;
    assertCbData(d);
    kb.text(`Поставка • ${formatDateTime(s.openedAtMs)}`, d).row();
  }
  assertCbData(CB.supplies);
  kb.text(BTN_SUPPLIES_BACK, CB.supplies).row();
  kb.text(BTN_BACK_TO_ADMIN, CB.menu);
  return kb;
}

function buildSuppliesStatsMenuText(): string {
  return ["📊 Статистика поставок", "", "Выберите период:"].join("\n");
}

function buildSuppliesStatsMenuKeyboard() {
  const kb = new InlineKeyboard();
  for (let i = 0; i < STAT_PERIOD_TITLES.length; i += 1) {
    const t = STAT_PERIOD_TITLES[i]!;
    const d = `sup:s${i}` as const;
    assertCbData(d);
    kb.text(t, d).row();
  }
  assertCbData(CB.supplies);
  kb.text(BTN_SUPPLIES_BACK, CB.supplies).row();
  kb.text(BTN_BACK_TO_ADMIN, CB.menu);
  return kb;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function startOfYear(d: Date) {
  return new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
}

function computeSupplyStatsForRange(fromMs: number, toMs: number) {
  const closed = listClosedSupplies().filter((s) => {
    const t = s.closedAtMs ?? 0;
    return t >= fromMs && t <= toMs;
  });
  const turnoverSum = closed.reduce((acc, s) => acc + (s.turnoverRub ?? 0), 0);
  const profitSum = closed.reduce((acc, s) => acc + (s.profitRub ?? 0), 0);
  const mostExpensive =
    closed
      .filter((s) => typeof s.turnoverRub === "number")
      .sort((a, b) => (b.turnoverRub ?? 0) - (a.turnoverRub ?? 0))[0] ?? null;
  return { turnoverSum, profitSum, mostExpensive, count: closed.length };
}

function buildSuppliesStatsResultMessage(periodIndex: number): string {
  const label =
    periodIndex >= 0 && periodIndex < STAT_PERIOD_TITLES.length
      ? STAT_PERIOD_TITLES[periodIndex]
      : "Период";
  const now = new Date();

  // Для "определённых" периодов без ввода пока даём подсказку.
  if ([3, 4, 5, 7].includes(periodIndex)) {
    return [
      `📊 Поставки • ${label}`,
      "",
      "Для этого режима нужен ввод даты/периода в чат.",
      "Сделаю это следующим шагом (формат: 23.04.2026 или 04.2026 или 2026, период: 01.04.2026-23.04.2026).",
    ].join("\n");
  }

  const from =
    periodIndex === 0
      ? startOfDay(now)
      : periodIndex === 1
        ? startOfMonth(now)
        : periodIndex === 2
          ? startOfYear(now)
          : new Date(0);
  const to = now;
  const { turnoverSum, profitSum, mostExpensive, count } =
    computeSupplyStatsForRange(from.getTime(), to.getTime());

  const lines = [
    `📊 Поставки • ${label}`,
    "",
    `✅ Завершённых поставок: ${count}`,
    `💵 Оборот: ${turnoverSum.toFixed(2)} RUB`,
    `💰 Чистая прибыль: ${profitSum.toFixed(2)} RUB`,
  ];
  if (mostExpensive && typeof mostExpensive.turnoverRub === "number") {
    lines.push(
      `🏆 Самая дорогая поставка: ${mostExpensive.turnoverRub.toFixed(2)} RUB`,
    );
  }
  return lines.join("\n");
}

function buildSuppliesStatsResultKeyboard() {
  assertCbData("sup:st");
  return new InlineKeyboard()
    .text(BTN_STAT_PERIOD_CHOOSE, "sup:st")
    .row()
    .text(BTN_SUPPLIES_BACK, CB.supplies)
    .row()
    .text(BTN_BACK_TO_ADMIN, CB.menu);
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
  if (pageCount === 0) {
    return [
      "📋 История заказов",
      "",
      "Пока пусто — заказы сюда попадут после появления данных.",
    ].join("\n");
  }
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
  for (const o of getActiveOrders()) {
    const d = cbView(o.id);
    assertCbData(d);
    kb.text(formatListButtonLabel(o), d).row();
  }
  assertCbData(CB.menu);
  kb.text(BTN_BACK_TO_ADMIN, CB.menu);
  return kb;
}

function buildPendingOrdersListText(): string {
  if (getActiveOrders().length === 0) {
    return [PENDING_ORDERS_HEADER, "", "Пока нет оплаченных заказов в выдачу."].join(
      "\n",
    );
  }
  return PENDING_ORDERS_HEADER;
}

function backToAdminKeyboard() {
  assertCbData(CB.menu);
  return new InlineKeyboard().text(BTN_BACK_TO_ADMIN, CB.menu);
}

function profitCancelKeyboard() {
  assertCbData(CB_PROFIT_Q);
  assertCbData(CB.menu);
  return new InlineKeyboard()
    .text(BTN_CANCEL_PROFIT_INPUT, CB_PROFIT_Q)
    .row()
    .text(BTN_BACK_TO_ADMIN, CB.menu);
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
  const sendBuyerCompleted = (telegramUserId: number, orderNumber: string) => {
    void sendOrderCompletedToBuyer(bot, { telegramUserId, orderNumber }).catch(
      (e) => console.error("[order-complete] уведомление покупателю:", e),
    );
  };
  /** Ожидание ввода чистой прибыли после «Подтвердить выдачу». */
  const awaitingProfitByUserId = new Map<number, string>();
  const awaitingOrderLookup = new Set<number>();
  /** Новый ввод поставки: проект → сервер → вирты. */
  const awaitingSupplyCreateByUserId = new Map<
    number,
    { step: "project" | "server" | "virts"; draft: Partial<Pick<SupplyRow, "project" | "server" | "virtAmount">> }
  >();
  /** Завершение поставки: сначала оборот, потом прибыль. */
  const awaitingSupplyCloseByUserId = new Map<
    number,
    { step: "turnover" | "profit"; supplyId: string; turnoverRub?: number }
  >();

  function clearAwaitingProfit(userId: number) {
    awaitingProfitByUserId.delete(userId);
  }

  function clearAwaitingOrderLookup(userId: number) {
    awaitingOrderLookup.delete(userId);
  }

  function clearAwaitingSupplyCreate(userId: number) {
    awaitingSupplyCreateByUserId.delete(userId);
  }

  function clearAwaitingSupplyClose(userId: number) {
    awaitingSupplyCloseByUserId.delete(userId);
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
      clearAwaitingSupplyCreate(ctx.from.id);
      clearAwaitingSupplyClose(ctx.from.id);
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
      clearAwaitingSupplyCreate(ctx.from.id);
      clearAwaitingSupplyClose(ctx.from.id);
    }
    await ctx.answerCallbackQuery();
    await a.editMessageText(BTN_ADMIN_MAIN, {
      reply_markup: adminMenuKeyboard(),
    });
  });

  bot.callbackQuery(CB.supplies, async (ctx) => {
    const a = await requireAdmin(ctx);
    if (a == null) return;
    if (ctx.from) {
      clearAwaitingProfit(ctx.from.id);
      clearAwaitingOrderLookup(ctx.from.id);
      clearAwaitingSupplyCreate(ctx.from.id);
      clearAwaitingSupplyClose(ctx.from.id);
    }
    await ctx.answerCallbackQuery();
    const text = buildSuppliesMenuText();
    const kb = buildSuppliesMenuKeyboard();
    try {
      await a.editMessageText(text, { reply_markup: kb });
    } catch {
      await a.reply(text, { reply_markup: kb });
    }
  });

  bot.callbackQuery("sup:new", async (ctx) => {
    const a = await requireAdmin(ctx);
    if (a == null) return;
    if (ctx.from) {
      clearAwaitingSupplyClose(ctx.from.id);
      awaitingSupplyCreateByUserId.set(ctx.from.id, { step: "project", draft: {} });
    }
    await ctx.answerCallbackQuery();
    await a.reply("Введите проект (одним сообщением):", {
      reply_markup: new InlineKeyboard().text(BTN_SUPPLIES_CANCEL_INPUT, CB_SUPPLY_CANCEL),
    });
  });

  bot.callbackQuery(CB_SUPPLY_CANCEL, async (ctx) => {
    const a = await requireAdmin(ctx);
    if (a == null) return;
    if (ctx.from) {
      clearAwaitingSupplyCreate(ctx.from.id);
      clearAwaitingSupplyClose(ctx.from.id);
    }
    await ctx.answerCallbackQuery();
    await a.reply("Операция отменена.", { reply_markup: adminMenuKeyboard() });
  });

  bot.callbackQuery("sup:act", async (ctx) => {
    const a = await requireAdmin(ctx);
    if (a == null) return;
    if (ctx.from) {
      clearAwaitingSupplyCreate(ctx.from.id);
      clearAwaitingSupplyClose(ctx.from.id);
    }
    await ctx.answerCallbackQuery();
    const active = listActiveSupplies();
    const text = buildSuppliesActiveText(active);
    const kb = buildSuppliesActiveKeyboard(active);
    try {
      await a.editMessageText(text, { reply_markup: kb });
    } catch {
      await a.reply(text, { reply_markup: kb });
    }
  });

  bot.callbackQuery(/^sup:v:([^:\s]+)$/, async (ctx) => {
    const a = await requireAdmin(ctx);
    if (a == null) return;
    if (ctx.from) {
      clearAwaitingSupplyCreate(ctx.from.id);
      clearAwaitingSupplyClose(ctx.from.id);
    }
    const id = ctx.match[1] ?? "";
    const supply = getSupplyById(id);
    if (!supply) {
      await ctx.answerCallbackQuery({ text: "Поставка не найдена", show_alert: true });
      return;
    }
    const active = listActiveSupplies();
    const seq = active.find((s) => s.id === id)?.seq ?? null;
    await ctx.answerCallbackQuery();
    const text = buildSupplyDetailText(supply, seq);
    const kb = buildSupplyDetailKeyboard(supply);
    try {
      await a.editMessageText(text, { reply_markup: kb });
    } catch {
      await a.reply(text, { reply_markup: kb });
    }
  });

  bot.callbackQuery(/^sup:fin:([^:\s]+)$/, async (ctx) => {
    const a = await requireAdmin(ctx);
    if (a == null) return;
    const id = ctx.match[1] ?? "";
    const supply = getSupplyById(id);
    if (!supply || supply.closedAtMs) {
      await ctx.answerCallbackQuery({ text: "Поставка уже закрыта или не найдена", show_alert: true });
      return;
    }
    if (ctx.from) {
      clearAwaitingSupplyCreate(ctx.from.id);
      awaitingSupplyCloseByUserId.set(ctx.from.id, { step: "turnover", supplyId: id });
    }
    await ctx.answerCallbackQuery();
    await a.reply("Введите оборот по поставке в RUB (числом):", {
      reply_markup: new InlineKeyboard().text(BTN_SUPPLIES_CANCEL_INPUT, CB_SUPPLY_CANCEL),
    });
  });

  bot.callbackQuery("sup:his", async (ctx) => {
    const a = await requireAdmin(ctx);
    if (a == null) return;
    if (ctx.from) {
      clearAwaitingSupplyCreate(ctx.from.id);
      clearAwaitingSupplyClose(ctx.from.id);
    }
    await ctx.answerCallbackQuery();
    const closed = listClosedSupplies();
    const text = buildSuppliesHistoryText(closed);
    const kb = buildSuppliesHistoryKeyboard(closed);
    try {
      await a.editMessageText(text, { reply_markup: kb });
    } catch {
      await a.reply(text, { reply_markup: kb });
    }
  });

  bot.callbackQuery(/^sup:h:([^:\s]+)$/, async (ctx) => {
    const a = await requireAdmin(ctx);
    if (a == null) return;
    const id = ctx.match[1] ?? "";
    const supply = getSupplyById(id);
    if (!supply) {
      await ctx.answerCallbackQuery({ text: "Поставка не найдена", show_alert: true });
      return;
    }
    await ctx.answerCallbackQuery();
    const text = buildSupplyDetailText(supply, null);
    const kb = new InlineKeyboard()
      .text(BTN_SUPPLIES_BACK, "sup:his")
      .row()
      .text(BTN_BACK_TO_ADMIN, CB.menu);
    try {
      await a.editMessageText(text, { reply_markup: kb });
    } catch {
      await a.reply(text, { reply_markup: kb });
    }
  });

  bot.callbackQuery("sup:st", async (ctx) => {
    const a = await requireAdmin(ctx);
    if (a == null) return;
    await ctx.answerCallbackQuery();
    const text = buildSuppliesStatsMenuText();
    const kb = buildSuppliesStatsMenuKeyboard();
    try {
      await a.editMessageText(text, { reply_markup: kb });
    } catch {
      await a.reply(text, { reply_markup: kb });
    }
  });

  bot.callbackQuery(/^sup:s([0-7])$/, async (ctx) => {
    const a = await requireAdmin(ctx);
    if (a == null) return;
    const idx = parseInt(ctx.match[1] ?? "0", 10);
    await ctx.answerCallbackQuery();
    const text = buildSuppliesStatsResultMessage(idx);
    const kb = buildSuppliesStatsResultKeyboard();
    try {
      await a.editMessageText(text, { reply_markup: kb });
    } catch {
      await a.reply(text, { reply_markup: kb });
    }
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
    const statsOpts = {
      parse_mode: "HTML" as const,
      reply_markup: buildStatsKeyboard(),
    };
    try {
      await a.editMessageText(text, statsOpts);
    } catch (e) {
      await a.reply(text, statsOpts);
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
    const text = buildPendingOrdersListText();
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
    await a.reply(`<pre>${escapeHtml(text)}</pre>`, {
      parse_mode: "HTML",
      reply_markup: backToAdminKeyboard(),
    });
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
    const ref = order.publicOrderId ?? id;
    if (ctx.from) {
      awaitingProfitByUserId.set(ctx.from.id, ref);
      clearAwaitingOrderLookup(ctx.from.id);
    }
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
    const cmdText = ctx.message?.text?.trim() ?? "";
    if (
      cmdText === "/start" ||
      cmdText.startsWith("/start ") ||
      cmdText === "/admin" ||
      cmdText.startsWith("/admin ")
    ) {
      return next();
    }
    if (!adminIds.has(ctx.from.id)) {
      return next();
    }

    const supplyCreate = awaitingSupplyCreateByUserId.get(ctx.from.id);
    if (supplyCreate) {
      const text = ctx.message?.text;
      if (!text) {
        await ctx.reply("Отправьте текстом одним сообщением.", {
          reply_markup: new InlineKeyboard().text(BTN_SUPPLIES_CANCEL_INPUT, CB_SUPPLY_CANCEL),
        });
        return;
      }
      const t = text.trim();
      if (t.startsWith("/")) {
        await ctx.reply("Введите значение без команд.", {
          reply_markup: new InlineKeyboard().text(BTN_SUPPLIES_CANCEL_INPUT, CB_SUPPLY_CANCEL),
        });
        return;
      }
      if (supplyCreate.step === "project") {
        supplyCreate.draft.project = t;
        awaitingSupplyCreateByUserId.set(ctx.from.id, {
          step: "server",
          draft: supplyCreate.draft,
        });
        await ctx.reply("Введите сервер (одним сообщением):", {
          reply_markup: new InlineKeyboard().text(BTN_SUPPLIES_CANCEL_INPUT, CB_SUPPLY_CANCEL),
        });
        return;
      }
      if (supplyCreate.step === "server") {
        supplyCreate.draft.server = t;
        awaitingSupplyCreateByUserId.set(ctx.from.id, {
          step: "virts",
          draft: supplyCreate.draft,
        });
        await ctx.reply("Введите количество виртов (числом):", {
          reply_markup: new InlineKeyboard().text(BTN_SUPPLIES_CANCEL_INPUT, CB_SUPPLY_CANCEL),
        });
        return;
      }
      // virts
      const vRaw = parseRublesAmountFromUserText(t);
      if (vRaw === null || vRaw <= 0) {
        await ctx.reply("Введите количество виртов числом.", {
          reply_markup: new InlineKeyboard().text(BTN_SUPPLIES_CANCEL_INPUT, CB_SUPPLY_CANCEL),
        });
        return;
      }
      const v = vRaw;
      const project = String(supplyCreate.draft.project ?? "").trim();
      const server = String(supplyCreate.draft.server ?? "").trim();
      clearAwaitingSupplyCreate(ctx.from.id);
      createSupply({ project, server, virtAmount: v });
      await ctx.reply("✅ Поставка создана и добавлена в актуальные.", {
        reply_markup: buildSuppliesMenuKeyboard(),
      });
      return;
    }

    const supplyClose = awaitingSupplyCloseByUserId.get(ctx.from.id);
    if (supplyClose) {
      const text = ctx.message?.text;
      if (!text) {
        await ctx.reply("Отправьте число одним сообщением.", {
          reply_markup: new InlineKeyboard().text(BTN_SUPPLIES_CANCEL_INPUT, CB_SUPPLY_CANCEL),
        });
        return;
      }
      const t = text.trim();
      if (t.startsWith("/")) {
        await ctx.reply("Введите число без команд.", {
          reply_markup: new InlineKeyboard().text(BTN_SUPPLIES_CANCEL_INPUT, CB_SUPPLY_CANCEL),
        });
        return;
      }
      const value = parseRublesAmountFromUserText(t);
      if (value === null) {
        await ctx.reply("Введите число (например 1500 или 1500,50).", {
          reply_markup: new InlineKeyboard().text(BTN_SUPPLIES_CANCEL_INPUT, CB_SUPPLY_CANCEL),
        });
        return;
      }
      if (supplyClose.step === "turnover") {
        awaitingSupplyCloseByUserId.set(ctx.from.id, {
          step: "profit",
          supplyId: supplyClose.supplyId,
          turnoverRub: value,
        });
        await ctx.reply("Введите чистую прибыль по поставке в RUB (числом):", {
          reply_markup: new InlineKeyboard().text(BTN_SUPPLIES_CANCEL_INPUT, CB_SUPPLY_CANCEL),
        });
        return;
      }
      const turnoverRub = supplyClose.turnoverRub ?? 0;
      clearAwaitingSupplyClose(ctx.from.id);
      const closed = closeSupply(supplyClose.supplyId, {
        turnoverRub,
        profitRub: value,
      });
      if (!closed) {
        await ctx.reply("Поставка не найдена.", { reply_markup: adminMenuKeyboard() });
        return;
      }
      await ctx.reply("✅ Поставка завершена.", { reply_markup: buildSuppliesMenuKeyboard() });
      return;
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
    const value = parseRublesAmountFromUserText(t);
    if (value === null) {
      await ctx.reply(MSG_PROFIT_INVALID, {
        reply_markup: profitCancelKeyboard(),
      });
      return;
    }
    clearAwaitingProfit(ctx.from.id);
    const amountStr = value.toFixed(2);
    const closedAtLine = [
      `Закрыт: ${formatDateTime(Date.now())}`,
      `Чистая прибыль: ${amountStr} RUB`,
    ].join(" · ");
    const moved = closeActiveOrder(pendingOrderId, closedAtLine, {
      profitRub: value,
    });
    await ctx.reply(msgProfitSaved(pendingOrderId, amountStr), {
      reply_markup: backToAdminKeyboard(),
    });
    const completedOrder = moved ?? getAdminOrderById(pendingOrderId);
    if (completedOrder) {
      const uid = Number(completedOrder.telegramUserId);
      if (Number.isFinite(uid) && uid > 0) {
        sendBuyerCompleted(
          uid,
          completedOrder.publicOrderId ?? pendingOrderId,
        );
      }
    }
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
