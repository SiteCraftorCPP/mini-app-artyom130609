import { InlineKeyboard, type Bot, type Context } from "grammy";

import {
  getActiveOrders,
  getAdminOrderById,
  getHistory50PageCount,
  getHistory50Slice,
  getClosedOrders,
  type AdminOrderRow,
} from "./admin-orders-mock.js";
import { parseRublesAmountFromUserText } from "./money-input.js";
import { closeActiveOrder } from "./orders-store.js";
import { addReferralBonus, changeBalanceAdmin, getAllReferralUsers, getReferralUser, getTopReferrals, getTransactions, searchReferralUser } from "./referrals-store.js";
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
import { getAllUserIds, getUniqueUserCount, getUserStatsForRange } from "./user-usage-store.js";
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
    `💰 <b>${STATS_HEADER}</b>`,
    "",
    `📦 Количество заказов: <b>${count}</b>`,
    `💵 Общая сумма: <b>${totalRub.toFixed(2)} RUB</b>`,
    "",
    "<i>В этом разделе отображаются заказы, ожидающие выдачи.</i>",
  ].join("\n");
}

function buildStatsKeyboard() {
  return new InlineKeyboard()
    .text(BTN_STATS_VIEW_ORDERS, "admin:stats_list")
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
    .text(BTN_ADMIN_SUPPLIES, CB.supplies)
    .row()
    .text("🔗 Реферальная система", "ref:menu");
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


function getPeriodInputPrompt(idx: number) {
  if (idx === 3) return "Введите дату в формате ДД.ММ.ГГГГ:";
  if (idx === 4) return "Введите месяц в формате ММ.ГГГГ:";
  if (idx === 5) return "Введите год в формате ГГГГ:";
  return "Введите период в формате ДД.ММ.ГГГГ-ДД.ММ.ГГГГ:";
}

function parsePeriodInput(text: string, periodIndex: number): { fromMs: number, toMs: number, label: string } | null {
  try {
    if (periodIndex === 3) {
      const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(text);
      if (!m) return null;
      const from = new Date(parseInt(m[3],10), parseInt(m[2],10)-1, parseInt(m[1],10));
      const to = new Date(parseInt(m[3],10), parseInt(m[2],10)-1, parseInt(m[1],10), 23, 59, 59, 999);
      if (isNaN(from.getTime())) return null;
      return { fromMs: from.getTime(), toMs: to.getTime(), label: `Статистика за ${text}` };
    }
    if (periodIndex === 4) {
      const m = /^(\d{1,2})\.(\d{4})$/.exec(text);
      if (!m) return null;
      const from = new Date(parseInt(m[2],10), parseInt(m[1],10)-1, 1);
      const to = new Date(parseInt(m[2],10), parseInt(m[1],10), 0, 23, 59, 59, 999);
      if (isNaN(from.getTime())) return null;
      return { fromMs: from.getTime(), toMs: to.getTime(), label: `Статистика за ${text}` };
    }
    if (periodIndex === 5) {
      const m = /^(\d{4})$/.exec(text);
      if (!m) return null;
      const y = parseInt(m[1], 10);
      const from = new Date(y, 0, 1);
      const to = new Date(y, 11, 31, 23, 59, 59, 999);
      if (isNaN(from.getTime())) return null;
      return { fromMs: from.getTime(), toMs: to.getTime(), label: `Статистика за ${y} год` };
    }
    if (periodIndex === 7) {
      const parts = text.split(/[-—–]/).map(s => s.trim());
      if (parts.length !== 2) return null;
      const m1 = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(parts[0]);
      const m2 = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(parts[1]);
      if (!m1 || !m2) return null;
      const from = new Date(parseInt(m1[3],10), parseInt(m1[2],10)-1, parseInt(m1[1],10));
      const to = new Date(parseInt(m2[3],10), parseInt(m2[2],10)-1, parseInt(m2[1],10), 23, 59, 59, 999);
      if (isNaN(from.getTime()) || isNaN(to.getTime())) return null;
      return { fromMs: from.getTime(), toMs: to.getTime(), label: `Статистика (${parts[0]} - ${parts[1]})` };
    }
  } catch {
    return null;
  }
  return null;
}

function computeOrderStatsForRange(fromMs: number, toMs: number) {
  const parseOrderDateMs = (o: AdminOrderRow): number => {
    const str = o.closedAtLine || o.openedAtLine || "";
    const match = str.match(/(\d{2})\.(\d{2})\.(\d{4})/);
    if (match) {
      const [_, d, m, y] = match;
      return new Date(Number(y), Number(m) - 1, Number(d)).getTime();
    }
    return 0;
  };

  const closed = [...getActiveOrders(), ...getClosedOrders()].filter((o) => {
    const t = parseOrderDateMs(o);
    return t >= fromMs && t <= toMs;
  });
  const count = closed.length;
  const turnoverSum = closed.reduce((acc, o) => acc + (o.amountRub ?? 0), 0);
  const profitSum = closed.reduce((acc, o) => acc + (o.profitRub ?? 0), 0);
  const avgCheck = count > 0 ? turnoverSum / count : 0;

  let mostExpensiveOrder: AdminOrderRow | null = null;
  for (const o of closed) {
    if (!mostExpensiveOrder || (o.amountRub ?? 0) > (mostExpensiveOrder.amountRub ?? 0)) {
      mostExpensiveOrder = o;
    }
  }

  const buyers = new Map<string, { username: string; total: number }>();
  for (const o of closed) {
    const uid = String(o.telegramUserId);
    const existing = buyers.get(uid) || { username: o.telegramUsername || "user", total: 0 };
    existing.total += (o.amountRub ?? 0);
    buyers.set(uid, existing);
  }

  let topBuyer: { username: string; total: number } | null = null;
  for (const b of buyers.values()) {
    if (!topBuyer || b.total > topBuyer.total) {
      topBuyer = b;
    }
  }

  return { count, turnoverSum, profitSum, avgCheck, mostExpensiveOrder, topBuyer };
}

function buildOrderPeriodStatsMessage(periodIndex: number, customFromMs?: number, customToMs?: number, customLabel?: string): string {
  const label = customLabel ?? (
    periodIndex >= 0 && periodIndex < STAT_PERIOD_TITLES.length
      ? STAT_PERIOD_TITLES[periodIndex]
      : "Период"
  );
  const now = new Date();

  const fromMs = customFromMs ?? (
    periodIndex === 0
      ? startOfDay(now)
      : periodIndex === 1
        ? startOfMonth(now)
        : periodIndex === 2
          ? startOfYear(now)
          : new Date(0)
  ).getTime();
  const toMs = customToMs ?? now.getTime();

  const { count, turnoverSum, profitSum, avgCheck, mostExpensiveOrder, topBuyer } = computeOrderStatsForRange(fromMs, toMs);

  const lines = [
    `📊 Статистика заказов • ${label}`,
    "",
    `✅ Оформлено заказов (кол-во): ${count}`,
    `💵 Оборот (RUB): ${turnoverSum.toFixed(2)} RUB`,
    `💰 Чистая прибыль: ${profitSum.toFixed(2)} RUB`,
    "",
    `📈 Средний чек: ${avgCheck.toFixed(2)} RUB`,
  ];

  if (mostExpensiveOrder) {
    lines.push(`🏆 Самый дорогой заказ: #${mostExpensiveOrder.publicOrderId} на ${mostExpensiveOrder.amountRub.toFixed(2)} RUB`);
  }

  if (topBuyer) {
    const u = topBuyer.username.replace(/^@/, "");
    lines.push(`👑 Самый платежеспособный покупатель: @${u} на ${topBuyer.total.toFixed(2)} RUB`);
  }

  return lines.join("\n");
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

function buildSuppliesStatsResultMessage(periodIndex: number, customFromMs?: number, customToMs?: number, customLabel?: string): string {
  const label = customLabel ?? (
    periodIndex >= 0 && periodIndex < STAT_PERIOD_TITLES.length
      ? STAT_PERIOD_TITLES[periodIndex]
      : "Период"
  );
  const now = new Date();

  const fromMs = customFromMs ?? (
    periodIndex === 0
      ? startOfDay(now)
      : periodIndex === 1
        ? startOfMonth(now)
        : periodIndex === 2
          ? startOfYear(now)
          : new Date(0)
  ).getTime();
  const toMs = customToMs ?? now.getTime();
  const { turnoverSum, profitSum, mostExpensive, count } =
    computeSupplyStatsForRange(fromMs, toMs);

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

function buildUserStatsMenuKeyboard() {
  const kb = new InlineKeyboard();
  for (let i = 0; i < STAT_PERIOD_TITLES.length; i += 1) {
    const t = STAT_PERIOD_TITLES[i]!;
    const d = `u:s${i}` as const;
    assertCbData(d);
    kb.text(t, d).row();
  }
  assertCbData(CB.menu);
  kb.text(BTN_BACK_TO_ADMIN, CB.menu);
  return kb;
}

function buildUserStatsResultMessage(periodIndex: number, customFromMs?: number, customToMs?: number, customLabel?: string): string {
  const label = customLabel ?? (
    periodIndex >= 0 && periodIndex < STAT_PERIOD_TITLES.length
      ? STAT_PERIOD_TITLES[periodIndex]
      : "Период"
  );
  const now = new Date();

  const fromMs = customFromMs ?? (
    periodIndex === 0
      ? startOfDay(now)
      : periodIndex === 1
        ? startOfMonth(now)
        : periodIndex === 2
          ? startOfYear(now)
          : new Date(0)
  ).getTime();
  const toMs = customToMs ?? now.getTime();
  const { newUsers, activeUsers } = getUserStatsForRange(fromMs, toMs);

  return [
    `👥 Статистика пользователей • ${label}`,
    "",
    `Пользователей воспользовалось ботом: ${activeUsers}`,
  ].join("\n");
}

function buildUserStatsResultKeyboard() {
  assertCbData(CB.userStats);
  return new InlineKeyboard()
    .text(BTN_STAT_PERIOD_CHOOSE, CB.userStats)
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
    "📋 Последние 50 заказов:",
    `Стр. ${page + 1} / ${pageCount}`,
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
  mode: "list" | "find" | "hist50" | "stats",
  histPage = 0,
) {
  const order = getAdminOrderById(id);
  const isClosed = Boolean(order?.closedAtLine);
  const dCopy = cbCopy(id);
  assertCbData(dCopy);
  const kb = new InlineKeyboard().text(BTN_COPY_ORDER_DATA, dCopy).row();

  // Кнопка выдачи НЕ показывается в режиме просмотра из статистики
  if (!isClosed && mode !== "stats") {
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
  } else if (mode === "stats") {
    assertCbData(CB.stats);
    kb.text(BTN_BACK_TO_ORDER_LIST, CB.stats);
  } else {
    assertCbData(CB.list);
    kb.text(BTN_BACK_TO_ORDER_LIST, CB.list);
  }
  return kb;
}

function buildOrderListKeyboard(mode: "list" | "stats" = "list") {
  const kb = new InlineKeyboard();
  const cbPrefix = mode === "stats" ? "admin:sv:" : "admin:v:";
  for (const o of getActiveOrders()) {
    const d = `${cbPrefix}${o.id}`;
    assertCbData(d);
    kb.text(formatListButtonLabel(o), d).row();
  }
  const backCb = mode === "stats" ? CB.stats : CB.menu;
  kb.text(BTN_BACK_TO_ADMIN, backCb).row();
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
  const sendBuyerCompleted = (telegramUserId: number, orderNumber: string, isAccount?: boolean, accountData?: string) => {
    void sendOrderCompletedToBuyer(bot, { telegramUserId, orderNumber, isAccount, accountData }).catch(
      (e) => console.error("[order-complete] уведомление покупателю:", e),
    );
  };
  /** Ожидание ввода чистой прибыли после «Подтвердить выдачу». */
  const awaitingProfitByUserId = new Map<number, string>();
  const awaitingAccountDataByUserId = new Map<number, string>();
  const pendingAccountData = new Map<string, string>();
  const awaitingPeriodInputByUserId = new Map<number, { statType: "order" | "user" | "supply"; periodIndex: number }>();
  const awaitingBroadcastTextByUserId = new Map<number, boolean>();
  const awaitingBroadcastConfirmMsgId = new Map<number, number>();
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
  const awaitingRefSearchByUserId = new Set<number>();
  const awaitingRefModTargetByUserId = new Set<number>();
  const awaitingRefModAmountByUserId = new Map<number, { targetId: number }>();

  function clearAwaitingBroadcast(userId: number) {
    awaitingBroadcastTextByUserId.delete(userId);
    awaitingBroadcastConfirmMsgId.delete(userId);
  }

  function clearAwaitingPeriodInput(userId: number) {
    awaitingPeriodInputByUserId.delete(userId);
  }

  function clearAwaitingAccountData(userId: number) {
    awaitingAccountDataByUserId.delete(userId);
  }

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
  function clearAwaitingRefActions(userId: number) {
    awaitingRefSearchByUserId.delete(userId);
    awaitingRefModTargetByUserId.delete(userId);
    awaitingRefModAmountByUserId.delete(userId);
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
      clearAwaitingAccountData(ctx.from.id);
      clearAwaitingPeriodInput(ctx.from.id);
      clearAwaitingBroadcast(ctx.from.id);
      clearAwaitingOrderLookup(ctx.from.id);
      clearAwaitingSupplyCreate(ctx.from.id);
      clearAwaitingSupplyClose(ctx.from.id);
      clearAwaitingRefActions(ctx.from.id);
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
      clearAwaitingAccountData(ctx.from.id);
      clearAwaitingPeriodInput(ctx.from.id);
      clearAwaitingBroadcast(ctx.from.id);
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
      clearAwaitingAccountData(ctx.from.id);
      clearAwaitingPeriodInput(ctx.from.id);
      clearAwaitingBroadcast(ctx.from.id);
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
    if ([3, 4, 5, 7].includes(idx)) {
      if (ctx.from) awaitingPeriodInputByUserId.set(ctx.from.id, { statType: "supply", periodIndex: idx });
      const prompt = getPeriodInputPrompt(idx);
      const kb = new InlineKeyboard().text("Отмена", "sup:st");
      try {
        await a.editMessageText(prompt, { reply_markup: kb });
      } catch {
        await a.reply(prompt, { reply_markup: kb });
      }
      return;
    }
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
      clearAwaitingAccountData(ctx.from.id);
      clearAwaitingPeriodInput(ctx.from.id);
      clearAwaitingBroadcast(ctx.from.id);
      clearAwaitingOrderLookup(ctx.from.id);
    }
    await ctx.answerCallbackQuery();
    const text = ["👥 Статистика пользователей", "", "Выберите период:"].join("\n");
    try {
      await a.editMessageText(text, { reply_markup: buildUserStatsMenuKeyboard() });
    } catch {
      await a.reply(text, { reply_markup: buildUserStatsMenuKeyboard() });
    }
  });

  bot.callbackQuery(/^u:s([0-7])$/, async (ctx) => {
    const a = await requireAdmin(ctx);
    if (a == null) return;
    const idx = parseInt(ctx.match[1] ?? "0", 10);
    await ctx.answerCallbackQuery();
    if ([3, 4, 5, 7].includes(idx)) {
      if (ctx.from) awaitingPeriodInputByUserId.set(ctx.from.id, { statType: "user", periodIndex: idx });
      const prompt = getPeriodInputPrompt(idx);
      const kb = new InlineKeyboard().text("Отмена", CB.userStats);
      try {
        await a.editMessageText(prompt, { reply_markup: kb });
      } catch {
        await a.reply(prompt, { reply_markup: kb });
      }
      return;
    }
    const text = buildUserStatsResultMessage(idx);
    const kb = buildUserStatsResultKeyboard();
    try {
      await a.editMessageText(text, { reply_markup: kb });
    } catch {
      await a.reply(text, { reply_markup: kb });
    }
  });

    bot.callbackQuery(CB.broadcasts, async (ctx) => {
    const a = await requireAdmin(ctx);
    if (!a) return;
    if (ctx.from) {
      clearAwaitingProfit(ctx.from.id);
      clearAwaitingAccountData(ctx.from.id);
      clearAwaitingPeriodInput(ctx.from.id);
      clearAwaitingOrderLookup(ctx.from.id);
      clearAwaitingBroadcast(ctx.from.id);
      awaitingBroadcastTextByUserId.set(ctx.from.id, true);
    }
    await ctx.answerCallbackQuery();
    const text = [
      "📣 Рассылка",
      "",
      "Отправьте сообщение/фото:",
    ].join("\n");
    const kb = new InlineKeyboard().text("❌ Отмена", CB.menu);
    try {
      await a.editMessageText(text, { reply_markup: kb });
    } catch {
      await a.reply(text, { reply_markup: kb });
    }
  });

  bot.callbackQuery("admin:sbc", async (ctx) => {
    const a = await requireAdmin(ctx);
    if (!a) return;
    const adminId = ctx.from!.id;
    const msgId = awaitingBroadcastConfirmMsgId.get(adminId);
    if (!msgId) {
      await ctx.answerCallbackQuery({ text: "Сообщение не найдено. Начните заново.", show_alert: true });
      return;
    }
    await ctx.answerCallbackQuery();

    const miniAppUrl =
      process.env.MINI_APP_URL?.trim() ||
      process.env.APP_DOMAIN?.trim() ||
      "https://artshopvirts.space";

    const kb = new InlineKeyboard().webApp(BTN_BROADCAST_BUY_VIRTS, miniAppUrl);
    const userIds = getAllUserIds();

    (async () => {
      for (const uid of userIds) {
        try {
          await bot.api.copyMessage(uid, adminId, msgId, { reply_markup: kb });
        } catch {
          // ignore
        }
      }
    })();

    clearAwaitingBroadcast(adminId);
    await a.editMessageText("Рассылка отправлена", { reply_markup: backToAdminKeyboard() });
  });


  bot.callbackQuery("ref:menu", async (ctx) => {
    const a = await requireAdmin(ctx);
    if (!a) return;
    if (ctx.from) clearAwaitingRefActions(ctx.from.id);
    await ctx.answerCallbackQuery();
    
    const text = "🔗 Реферальная система\n\nВыберите раздел:";
    const kb = new InlineKeyboard()
      .text("📄 Транзакции", "ref:txs:0").row()
      .text("🏆 Топ рефералов", "ref:top").row()
      .text("💸 Снять/добавить баланс", "ref:mod").row()
      .text("🔍 Найти пользователя", "ref:search").row()
      .text("🔙 В админ-панель", CB.menu);
      
    try {
      await a.editMessageText(text, { reply_markup: kb });
    } catch {
      await a.reply(text, { reply_markup: kb });
    }
  });

  bot.callbackQuery(/^ref:txs:(\d+)$/, async (ctx) => {
    const a = await requireAdmin(ctx);
    if (!a) return;
    await ctx.answerCallbackQuery();
    const page = parseInt(ctx.match[1], 10) || 0;
    const limit = 20;
    const res = getTransactions(limit, page);
    
    let text = `📄 Транзакции (стр. ${page + 1} / ${res.totalPages || 1})\n\n`;
    if (res.list.length === 0) text += "Транзакций пока нет.";
    for (const tx of res.list) {
      const dt = formatDateTime(tx.dateMs);
      const sign = tx.type === "admin_sub" ? "-" : "+";
      text += `• [${dt}] ID: ${tx.telegramUserId}\n  Сумма: ${sign}${tx.amount} RUB\n  ${tx.desc}\n\n`;
    }
    
    const kb = new InlineKeyboard();
    if (page > 0) kb.text("⬅️", `ref:txs:${page - 1}`);
    if (page < res.totalPages - 1) kb.text("➡️", `ref:txs:${page + 1}`);
    if (res.totalPages > 1) kb.row();
    kb.text("🔙 Назад", "ref:menu");

    try {
      await a.editMessageText(text, { reply_markup: kb });
    } catch {
      await a.reply(text, { reply_markup: kb });
    }
  });

  bot.callbackQuery("ref:top", async (ctx) => {
    const a = await requireAdmin(ctx);
    if (!a) return;
    await ctx.answerCallbackQuery();
    
    const top = getTopReferrals(15);
    let text = "🏆 Топ-15 рефералов по заработанному:\n\n";
    if (top.length === 0) text += "Пока никого нет.";
    top.forEach((u, i) => {
      text += `${i + 1}. ${u.telegramUsername ? '@'+u.telegramUsername : 'ID '+u.telegramUserId} — заработал: ${u.earned.toFixed(2)} RUB\n`;
    });
    
    const kb = new InlineKeyboard().text("🔙 Назад", "ref:menu");
    try {
      await a.editMessageText(text, { reply_markup: kb });
    } catch {
      await a.reply(text, { reply_markup: kb });
    }
  });

  bot.callbackQuery("ref:mod", async (ctx) => {
    const a = await requireAdmin(ctx);
    if (!a) return;
    if (ctx.from) awaitingRefModTargetByUserId.add(ctx.from.id);
    await ctx.answerCallbackQuery();
    
    const text = "Отправьте ID пользователя,которому нужно изменить баланс:";
    const kb = new InlineKeyboard().text("❌ Отмена", "ref:menu");
    try {
      await a.editMessageText(text, { reply_markup: kb });
    } catch {
      await a.reply(text, { reply_markup: kb });
    }
  });

  bot.callbackQuery("ref:search", async (ctx) => {
    const a = await requireAdmin(ctx);
    if (!a) return;
    if (ctx.from) awaitingRefSearchByUserId.add(ctx.from.id);
    await ctx.answerCallbackQuery();
    
    const text = "Отправьте ID пользователя для поиска:";
    const kb = new InlineKeyboard().text("❌ Отмена", "ref:menu");
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
      clearAwaitingAccountData(ctx.from.id);
      clearAwaitingPeriodInput(ctx.from.id);
      clearAwaitingBroadcast(ctx.from.id);
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
      clearAwaitingAccountData(ctx.from.id);
      clearAwaitingPeriodInput(ctx.from.id);
      clearAwaitingBroadcast(ctx.from.id);
      clearAwaitingOrderLookup(ctx.from.id);
    }
    await ctx.answerCallbackQuery();
    const text = buildPendingOrdersListText();
    try {
      await a.editMessageText(text, { reply_markup: buildOrderListKeyboard("list") });
    } catch (e) {
      await a.reply(text, { reply_markup: buildOrderListKeyboard("list") });
    }
  });

  bot.callbackQuery("admin:stats_list", async (ctx) => {
    const a = await requireAdmin(ctx);
    if (a == null) {
      return;
    }
    await ctx.answerCallbackQuery();
    const text = "📦 Список актуальных заказов (просмотр):";
    await a.editMessageText(text, { reply_markup: buildOrderListKeyboard("stats") });
  });

  bot.callbackQuery(/^admin:sv:([^:\s]+)$/, async (ctx) => {
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
    await a.editMessageText(html, {
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
      reply_markup: buildOrderDetailKeyboard(id, "stats"),
    });
  });

  bot.callbackQuery(CB.find, async (ctx) => {
    const a = await requireAdmin(ctx);
    if (a == null) {
      return;
    }
    if (ctx.from) {
      clearAwaitingProfit(ctx.from.id);
      clearAwaitingAccountData(ctx.from.id);
      clearAwaitingPeriodInput(ctx.from.id);
      clearAwaitingBroadcast(ctx.from.id);
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
      clearAwaitingAccountData(ctx.from.id);
      clearAwaitingPeriodInput(ctx.from.id);
      clearAwaitingBroadcast(ctx.from.id);
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
      clearAwaitingAccountData(ctx.from.id);
      clearAwaitingPeriodInput(ctx.from.id);
      clearAwaitingBroadcast(ctx.from.id);
      clearAwaitingOrderLookup(ctx.from.id);
    }
    await ctx.answerCallbackQuery();
    const text = "📊 Статистика заказов";
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
      clearAwaitingAccountData(ctx.from.id);
      clearAwaitingPeriodInput(ctx.from.id);
      clearAwaitingBroadcast(ctx.from.id);
      clearAwaitingOrderLookup(ctx.from.id);
    }
    const idx = parseInt(ctx.match[1] ?? "0", 10);
    await ctx.answerCallbackQuery();
    if ([3, 4, 5, 7].includes(idx)) {
      if (ctx.from) awaitingPeriodInputByUserId.set(ctx.from.id, { statType: "order", periodIndex: idx });
      const prompt = getPeriodInputPrompt(idx);
      const kb = new InlineKeyboard().text("Отмена", "a:st");
      try {
        await a.editMessageText(prompt, { reply_markup: kb });
      } catch {
        await a.reply(prompt, { reply_markup: kb });
      }
      return;
    }
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
      clearAwaitingAccountData(ctx.from.id);
      clearAwaitingPeriodInput(ctx.from.id);
      clearAwaitingBroadcast(ctx.from.id);
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
      clearAwaitingAccountData(ctx.from.id);
      clearAwaitingPeriodInput(ctx.from.id);
      clearAwaitingBroadcast(ctx.from.id);
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
      clearAwaitingOrderLookup(ctx.from.id);
      
      if (order.categoryLabel === "Аккаунт") {
        awaitingAccountDataByUserId.set(ctx.from.id, ref);
        await a.reply("Введите данные для входа в аккаунт:\nСервер:\nNick-Name:\nПароль:", {
          reply_markup: profitCancelKeyboard(),
        });
      } else {
        awaitingProfitByUserId.set(ctx.from.id, ref);
        await a.reply(msgProfitPrompt(ref), {
          reply_markup: profitCancelKeyboard(),
        });
      }
    }
  });

  bot.callbackQuery(CB_PROFIT_Q, async (ctx) => {
    const a = await requireAdmin(ctx);
    if (a == null) {
      return;
    }
    if (ctx.from) {
      clearAwaitingProfit(ctx.from.id);
      clearAwaitingAccountData(ctx.from.id);
      clearAwaitingPeriodInput(ctx.from.id);
      clearAwaitingBroadcast(ctx.from.id);
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
    
    if (awaitingBroadcastTextByUserId.get(ctx.from.id)) {
      clearAwaitingBroadcast(ctx.from.id);
      const msgId = ctx.message.message_id;
      awaitingBroadcastConfirmMsgId.set(ctx.from.id, msgId);

      const miniAppUrl = process.env.MINI_APP_URL?.trim() || process.env.APP_DOMAIN?.trim() || "https://artshopvirts.space";
      const kb = new InlineKeyboard().webApp(BTN_BROADCAST_BUY_VIRTS, miniAppUrl);

      await ctx.reply("Вот так будет выглядеть сообщение:");
      await ctx.copyMessage(ctx.chat.id, { reply_markup: kb });

      const confirmKb = new InlineKeyboard()
        .text("🚀 Отправить", "admin:sbc")
        .row()
        .text("❌ Отмена", CB.menu);
      await ctx.reply("Отправить эту рассылку всем пользователям?", { reply_markup: confirmKb });
      return;
    }


    if (awaitingRefSearchByUserId.has(ctx.from.id)) {
      const text = ctx.message?.text?.trim() || "";
      if (!text || text.startsWith("/")) return;
      awaitingRefSearchByUserId.delete(ctx.from.id);
      
      const user = searchReferralUser(text);
      if (!user) {
        await ctx.reply("❌ Пользователь не найден в реферальной системе.", { reply_markup: new InlineKeyboard().text("🔙 Назад", "ref:menu") });
        return;
      }
      
      const msg = [
        "👤 Информация по реф. системе:",
        `ID: ${user.telegramUserId}`,
        `Юзернейм: ${user.telegramUsername ? '@'+user.telegramUsername : '—'}`,
        `Баланс: ${user.balance.toFixed(2)} RUB`,
        `Всего заработано: ${user.earned.toFixed(2)} RUB`,
        `Приглашено: ${user.invitedCount} чел.`,
        `Кто пригласил его: ${user.referrerId ? user.referrerId : '—'}`,
      ].join("\n");
      await ctx.reply(msg, { reply_markup: new InlineKeyboard().text("🔙 Назад", "ref:menu") });
      return;
    }

    if (awaitingRefModTargetByUserId.has(ctx.from.id)) {
      const text = ctx.message?.text?.trim() || "";
      if (!text || text.startsWith("/")) return;
      
      const user = searchReferralUser(text);
      if (!user) {
        await ctx.reply("❌ Пользователь не найден. Попробуйте другой юзернейм или ID:", { reply_markup: new InlineKeyboard().text("❌ Отмена", "ref:menu") });
        return;
      }
      
      awaitingRefModTargetByUserId.delete(ctx.from.id);
      awaitingRefModAmountByUserId.set(ctx.from.id, { targetId: user.telegramUserId });
      
      const msg = [
        `Выбран пользователь ${user.telegramUsername ? '@'+user.telegramUsername : 'ID '+user.telegramUserId}`,
        `Текущий баланс: ${user.balance.toFixed(2)} RUB\n`,
        "Отправьте сумму изменения (положительное число для зачисления, отрицательное со знаком минус для списания):"
      ].join("\n");
      await ctx.reply(msg, { reply_markup: new InlineKeyboard().text("❌ Отмена", "ref:menu") });
      return;
    }

    const modAmountState = awaitingRefModAmountByUserId.get(ctx.from.id);
    if (modAmountState) {
      const text = ctx.message?.text?.trim() || "";
      if (!text || text.startsWith("/")) return;
      
      const amount = parseFloat(text.replace(",", "."));
      if (isNaN(amount) || amount === 0) {
        await ctx.reply("❌ Неверная сумма. Введите число (например, 100 или -50):", { reply_markup: new InlineKeyboard().text("❌ Отмена", "ref:menu") });
        return;
      }
      
      awaitingRefModAmountByUserId.delete(ctx.from.id);
      
      const isAdd = amount > 0;
      const absAmount = Math.abs(amount);
      const newBal = changeBalanceAdmin(modAmountState.targetId, absAmount, isAdd, ctx.from.username || String(ctx.from.id));
      
      await ctx.reply(`✅ Баланс успешно изменен!\nНовый баланс пользователя: ${newBal.toFixed(2)} RUB`, { reply_markup: new InlineKeyboard().text("🔙 Назад", "ref:menu") });
      return;
    }

    const periodInput = awaitingPeriodInputByUserId.get(ctx.from.id);
    if (periodInput) {
      const text = ctx.message?.text?.trim() || "";
      if (!text || text.startsWith("/")) return;

      const parsed = parsePeriodInput(text, periodInput.periodIndex);
      if (!parsed) {
        await ctx.reply("❌ Неверный формат. Попробуйте еще раз или нажмите Отмена.", {
          reply_markup: new InlineKeyboard().text("Отмена", CB.menu)
        });
        return;
      }
      clearAwaitingPeriodInput(ctx.from.id);
      clearAwaitingBroadcast(ctx.from.id);

      let msg = "";
      let kb: InlineKeyboard;
      if (periodInput.statType === "order") {
        msg = buildOrderPeriodStatsMessage(periodInput.periodIndex, parsed.fromMs, parsed.toMs, parsed.label);
        kb = buildOrderPeriodResultKeyboard();
      } else if (periodInput.statType === "user") {
        msg = buildUserStatsResultMessage(periodInput.periodIndex, parsed.fromMs, parsed.toMs, parsed.label);
        kb = buildUserStatsResultKeyboard();
      } else {
        msg = buildSuppliesStatsResultMessage(periodInput.periodIndex, parsed.fromMs, parsed.toMs, parsed.label);
        kb = buildSuppliesStatsResultKeyboard();
      }

      await ctx.reply(msg, { reply_markup: kb });
      return;
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
    
    const accountDataOrderRef = awaitingAccountDataByUserId.get(ctx.from.id);
    if (accountDataOrderRef) {
      const text = ctx.message?.text?.trim() || "";
      if (!text || text.startsWith("/")) return;

      pendingAccountData.set(accountDataOrderRef, text);
      clearAwaitingAccountData(ctx.from.id);
      awaitingProfitByUserId.set(ctx.from.id, accountDataOrderRef);

      await ctx.reply(msgProfitPrompt(accountDataOrderRef), {
        reply_markup: profitCancelKeyboard(),
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
      clearAwaitingAccountData(ctx.from.id);
      clearAwaitingPeriodInput(ctx.from.id);
      clearAwaitingBroadcast(ctx.from.id);
    const amountStr = value.toFixed(2);
    const closedAtLine = [
      `Закрыт: ${formatDateTime(Date.now())}`,
      `Чистая прибыль: ${amountStr} RUB`,
    ].join(" · ");
    const completedOrderTemp = getAdminOrderById(pendingOrderId);
    const moved = closeActiveOrder(pendingOrderId, closedAtLine, {
      profitRub: value,
    });
    if (completedOrderTemp && completedOrderTemp.amountRub) {
      addReferralBonus(Number(completedOrderTemp.telegramUserId), completedOrderTemp.amountRub, completedOrderTemp.publicOrderId ?? pendingOrderId);
    }
    await ctx.reply(msgProfitSaved(pendingOrderId, amountStr), {
      reply_markup: backToAdminKeyboard(),
    });
    const completedOrder = moved ?? getAdminOrderById(pendingOrderId);
    if (completedOrder) {
      const uid = Number(completedOrder.telegramUserId);
      if (Number.isFinite(uid) && uid > 0) {
        const isAccount = completedOrder.categoryLabel === "Аккаунт";
        const accountData = pendingAccountData.get(pendingOrderId);
        sendBuyerCompleted(
          uid,
          completedOrder.publicOrderId ?? pendingOrderId,
          isAccount,
          accountData
        );
        pendingAccountData.delete(pendingOrderId);
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
