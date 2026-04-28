import { InlineKeyboard, type Bot, type Context } from "grammy";

import {
  addItemToGame,
  addItemToMain,
  addMainSection,
  createGame,
  getActiveOtherServicesStorePath,
  getOtherServicesV1,
  removeGame,
  removeItemFromGame,
  removeItemFromMain,
  removeMainSection,
} from "./other-services-store.js";
import { parseRublesAmountFromUserText } from "./money-input.js";
import { BTN_BACK_TO_ADMIN } from "./texts.js";

const CB_ENTRY = "admin:os" as const;
const CB_CANCEL = "o!xx" as const;
const PREFIX = "o!";

type Wiz =
  | { k: "gameName" }
  | { k: "mainName"; g: number }
  | { k: "itemDesc"; g: number; m: number }
  | { k: "itemDescGame"; g: number }
  | { k: "itemAutoDeliverText"; g: number; m: number | null; cardDesc: string }
  | { k: "itemAutoAmount"; g: number; m: number | null; cardDesc: string; deliverText: string }
  | { k: "itemManualAmount"; g: number; m: number | null; cardDesc: string };

const wizards = new Map<number, Wiz>();
const pendingPayMode = new Map<number, { g: number; m: number | null; desc: string }>();

export function hasActiveOtherServicesWizard(userId: number): boolean {
  return wizards.has(userId) || pendingPayMode.has(userId);
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildRootKb(): InlineKeyboard {
  const kb = new InlineKeyboard();
  const st = getOtherServicesV1();
  st.games.forEach((g, gi) => {
    const lab = (g.name || "Раздел").slice(0, 28);
    kb.text(lab.slice(0, 32), `${PREFIX}g!${gi}`).row();
  });
  kb.text("➕ Добавить", `${PREFIX}newg`).row();
  kb.text(BTN_BACK_TO_ADMIN, "admin:menu");
  return kb;
}

function buildRootText(): string {
  const st = getOtherServicesV1();
  if (st.games.length === 0) {
    return "<b>Другие услуги</b>\n\nПока пусто. Нажмите <b>Добавить</b> и введите название раздела.";
  }
  const lines = st.games.map((g) => `• ${esc(g.name)}`);
  return `<b>Другие услуги</b>\n\n${st.games.length} раздел(ов).\n${lines.join("\n")}`;
}

function paymentModeAdmin(pm: string): string {
  if (pm === "manager") {
    return "менеджер";
  }
  if (pm === "auto") {
    return "автовыдача";
  }
  if (pm === "manual") {
    return "ручная выдача";
  }
  if (pm === "pay") {
    return "ссылка на оплату";
  }
  if (pm === "info") {
    return "только информация";
  }
  return pm;
}

function gameView(gi: number): { text: string; kb: InlineKeyboard } {
  const st = getOtherServicesV1();
  const g = st.games[gi];
  if (!g) {
    return { text: "Нет в списке.", kb: new InlineKeyboard().text("⬅️", `${PREFIX}0`) };
  }
  const hasSubs = g.mainSections.length > 0;
  const giItems = g.items ?? [];
  const hasRootItems = giItems.length > 0;
  let text = `<b>Название раздела:</b> ${esc(g.name)}\n\n`;
  if (!hasSubs && hasRootItems) {
    giItems.forEach((it, idx) => {
      const snippet = esc(it.description.slice(0, 500));
      text += `<b>Позиция ${idx + 1}:</b> ${snippet}\n`;
      text += `<b>Метод оплаты:</b> ${esc(paymentModeAdmin(it.paymentMode))}\n\n`;
    });
  }
  if (hasSubs) {
    text += `<b>Подразделы</b>\n`;
    g.mainSections.forEach((m) => {
      text += `• <b>${esc(m.name)}</b> — ${m.items.length} поз.\n`;
    });
    text += "\n";
  } else if (!hasRootItems) {
    text += "Добавьте подраздел или позицию:\n\n";
  }
  const kb = new InlineKeyboard();
  if (!hasSubs) {
    giItems.forEach((it, ii) => {
      const t =
        (it.description.slice(0, 16) + (it.description.length > 16 ? "…" : "")) as string;
      kb.text(t, `${PREFIX}ydig!${gi}!${ii}`).row();
    });
  }
  g.mainSections.forEach((m, mi) => {
    kb.text(m.name.slice(0, 32), `${PREFIX}m!${gi}!${mi}`).row();
  });
  if (!hasRootItems) {
    kb.text("➕ Добавить подраздел", `${PREFIX}addm!${gi}`).row();
  }
  if (!hasSubs) {
    kb.text("➕ ОПИСАНИЕ", `${PREFIX}addo!${gi}`).row();
  }
  kb.text("🗑 Удалить раздел", `${PREFIX}ydg!${gi}`).row();
  kb.text("⬅️", `${PREFIX}0`);
  return { text, kb };
}

function mainView(gi: number, mi: number): { text: string; kb: InlineKeyboard } {
  const st = getOtherServicesV1();
  const g = st.games[gi];
  const m = g?.mainSections[mi];
  if (!g || !m) {
    return { text: "Нет.", kb: new InlineKeyboard().text("⬅️", `${PREFIX}g!${gi}`) };
  }
  let body = `<b>Название раздела:</b> ${esc(g.name)}\n`;
  body += `<b>Название подраздела:</b> ${esc(m.name)}\n\n`;
  if (m.description?.trim()) {
    body += `<b>Текст на плашке:</b> ${esc(m.description.trim())}\n\n`;
  }
  if (m.items.length > 0) {
    m.items.forEach((it, idx) => {
      const snippet = esc(it.description.slice(0, 500));
      body += `<b>Позиция ${idx + 1}:</b> ${snippet}\n`;
      body += `<b>Метод оплаты:</b> ${esc(paymentModeAdmin(it.paymentMode))}\n\n`;
    });
  } else {
    body += "Позиций пока нет.\n\n";
  }
  const kb = new InlineKeyboard();
  m.items.forEach((it, ii) => {
    const t = (it.description.slice(0, 16) + (it.description.length > 16 ? "…" : "")) as string;
    kb.text(t, `${PREFIX}ydim!${gi}!${mi}!${ii}`).row();
  });
  kb.text("➕ ОПИСАНИЕ", `${PREFIX}addim!${gi}!${mi}`).row();
  kb.text("🗑 Удалить подраздел", `${PREFIX}ydm!${gi}!${mi}`).row();
  kb.text("⬅️ К разделу", `${PREFIX}g!${gi}`);
  return { text: body, kb };
}

function kbCancel(): InlineKeyboard {
  return new InlineKeyboard().text("❌ Отмена", CB_CANCEL);
}

export function installOtherServicesAdmin(bot: Bot, adminIds: Set<number>) {
  async function requireAd(
    ctx: Context,
  ): Promise<(Context & { from: NonNullable<Context["from"]> }) | null> {
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

  function clearWiz(uid: number) {
    wizards.delete(uid);
    pendingPayMode.delete(uid);
  }

  bot.callbackQuery(CB_ENTRY, async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    if (ctx.from) {
      clearWiz(ctx.from.id);
    }
    await ctx.answerCallbackQuery();
    try {
      await a.editMessageText(buildRootText(), { parse_mode: "HTML", reply_markup: buildRootKb() });
    } catch {
      await a.reply(buildRootText(), { parse_mode: "HTML", reply_markup: buildRootKb() });
    }
  });

  bot.callbackQuery(CB_CANCEL, async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    if (ctx.from) {
      clearWiz(ctx.from.id);
    }
    await ctx.answerCallbackQuery();
    try {
      await a.editMessageText(buildRootText(), { parse_mode: "HTML", reply_markup: buildRootKb() });
    } catch {
      await a.reply("Отменено.", { parse_mode: "HTML", reply_markup: buildRootKb() });
    }
  });

  bot.callbackQuery(`${PREFIX}0`, async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    if (ctx.from) {
      clearWiz(ctx.from.id);
    }
    await ctx.answerCallbackQuery();
    try {
      await a.editMessageText(buildRootText(), { parse_mode: "HTML", reply_markup: buildRootKb() });
    } catch {
      await a.reply(buildRootText(), { parse_mode: "HTML", reply_markup: buildRootKb() });
    }
  });

  bot.callbackQuery(new RegExp(`^${PREFIX.replace("!", "\\!")}newg$`), async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    if (ctx.from) {
      wizards.set(ctx.from.id, { k: "gameName" });
    }
    await ctx.answerCallbackQuery();
    await a.reply("Введите <b>название</b> раздела:", { parse_mode: "HTML", reply_markup: kbCancel() });
  });

  bot.callbackQuery(new RegExp(`^${PREFIX.replace("!", "\\!")}g!([0-9]+)$`), async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    if (ctx.from) {
      clearWiz(ctx.from.id);
    }
    const gi = Number(ctx.match![1]!);
    await ctx.answerCallbackQuery();
    const { text, kb } = gameView(gi);
    try {
      await a.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
    } catch {
      await a.reply(text, { parse_mode: "HTML", reply_markup: kb });
    }
  });

  bot.callbackQuery(new RegExp(`^${PREFIX.replace("!", "\\!")}m!([0-9]+)!([0-9]+)$`), async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    if (ctx.from) {
      clearWiz(ctx.from.id);
    }
    const gi = Number(ctx.match![1]!);
    const mi = Number(ctx.match![2]!);
    await ctx.answerCallbackQuery();
    const { text, kb } = mainView(gi, mi);
    try {
      await a.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
    } catch {
      await a.reply(text, { parse_mode: "HTML", reply_markup: kb });
    }
  });

  bot.callbackQuery(new RegExp(`^${PREFIX.replace("!", "\\!")}addm!([0-9]+)$`), async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    const gi = Number(ctx.match![1]!);
    const g = getOtherServicesV1().games[gi];
    if (!g) {
      await ctx.answerCallbackQuery({ text: "Нет в списке.", show_alert: true });
      return;
    }
    if ((g.items ?? []).length > 0) {
      await ctx.answerCallbackQuery({
        text:
          "В разделе уже есть позиции. Удалите их, чтобы добавить подразделы (в одном разделе — либо позиции, либо подразделы).",
        show_alert: true,
      });
      return;
    }
    if (ctx.from) {
      wizards.set(ctx.from.id, { k: "mainName", g: gi });
    }
    await ctx.answerCallbackQuery();
    await a.reply("Введите <b>название подраздела</b>:", { parse_mode: "HTML", reply_markup: kbCancel() });
  });

  bot.callbackQuery(new RegExp(`^${PREFIX.replace("!", "\\!")}addo!([0-9]+)$`), async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    const gi = Number(ctx.match![1]!);
    const g = getOtherServicesV1().games[gi];
    if (!g) {
      await ctx.answerCallbackQuery({ text: "Нет в списке.", show_alert: true });
      return;
    }
    if (g.mainSections.length > 0) {
      await ctx.answerCallbackQuery({
        text:
          "В разделе уже есть подразделы. Позицию можно добавить только внутри подраздела (откройте его в списке).",
        show_alert: true,
      });
      return;
    }
    if (ctx.from) {
      wizards.set(ctx.from.id, { k: "itemDescGame", g: gi });
    }
    await ctx.answerCallbackQuery();
    await a.reply("Введите <b>описание позиции</b>:", { parse_mode: "HTML", reply_markup: kbCancel() });
  });

  bot.callbackQuery(new RegExp(`^${PREFIX.replace("!", "\\!")}addim!([0-9]+)!([0-9]+)$`), async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    const gi = Number(ctx.match![1]!);
    const mi = Number(ctx.match![2]!);
    if (ctx.from) {
      wizards.set(ctx.from.id, { k: "itemDesc", g: gi, m: mi });
    }
    await ctx.answerCallbackQuery();
    await a.reply("Введите <b>описание позиции</b>:", { parse_mode: "HTML", reply_markup: kbCancel() });
  });

  bot.callbackQuery(new RegExp(`^${PREFIX.replace("!", "\\!")}pay!([012])$`), async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    const uid = ctx.from?.id;
    if (uid == null) {
      return;
    }
    const pend = pendingPayMode.get(uid);
    if (!pend) {
      await ctx.answerCallbackQuery({ text: "Введите описание", show_alert: true });
      return;
    }
    const tag = ctx.match![1]!;
    const st = getOtherServicesV1();
    const gRow = st.games[pend.g];
    if (!gRow) {
      await ctx.answerCallbackQuery({ text: "Обновите список", show_alert: true });
      return;
    }

    if (tag === "0") {
      if (pend.m === null) {
        addItemToGame(gRow.id, { description: pend.desc, paymentMode: "manager" });
      } else {
        const m = gRow.mainSections[pend.m];
        if (!m) {
          await ctx.answerCallbackQuery({ text: "Обновите список", show_alert: true });
          return;
        }
        addItemToMain(gRow.id, m.id, { description: pend.desc, paymentMode: "manager" });
      }
      clearWiz(uid);
      const gi = pend.g;
      await ctx.answerCallbackQuery();
      if (pend.m === null) {
        const { text, kb } = gameView(gi);
        await a.reply(text, { parse_mode: "HTML", reply_markup: kb });
      } else {
        const { text, kb } = mainView(gi, pend.m);
        await a.reply(text, { parse_mode: "HTML", reply_markup: kb });
      }
      return;
    }

    if (tag === "1") {
      wizards.set(uid, {
        k: "itemAutoDeliverText",
        g: pend.g,
        m: pend.m,
        cardDesc: pend.desc,
      });
      pendingPayMode.delete(uid);
      await ctx.answerCallbackQuery();
      await a.reply("Введите <b>товар для автовыдачи</b>:", {
        parse_mode: "HTML",
        reply_markup: kbCancel(),
      });
      return;
    }

    wizards.set(uid, { k: "itemManualAmount", g: pend.g, m: pend.m, cardDesc: pend.desc });
    pendingPayMode.delete(uid);
    await ctx.answerCallbackQuery();
    await a.reply("Введите <b>сумму</b>:", {
      parse_mode: "HTML",
      reply_markup: kbCancel(),
    });
  });

  bot.callbackQuery(new RegExp(`^${PREFIX.replace("!", "\\!")}ydg!([0-9]+)$`), async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    const gi = Number(ctx.match![1]!);
    await ctx.answerCallbackQuery();
    const kb = new InlineKeyboard()
      .text("✅ Да, удалить", `${PREFIX}dy!${gi}`)
      .row()
      .text("Отмена", `${PREFIX}g!${gi}`);
    const g = getOtherServicesV1().games[gi];
    await a.reply(`Раздел <b>${esc(g?.name ?? "")}</b> — удалить?`, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.callbackQuery(new RegExp(`^${PREFIX.replace("!", "\\!")}dy!([0-9]+)$`), async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    const gi = Number(ctx.match![1]!);
    const g = getOtherServicesV1().games[gi];
    if (g) {
      removeGame(g.id);
    }
    if (ctx.from) {
      clearWiz(ctx.from.id);
    }
    await ctx.answerCallbackQuery();
    await a.reply("Удалено.");
    try {
      await a.reply(buildRootText(), { parse_mode: "HTML", reply_markup: buildRootKb() });
    } catch {
      /* ok */
    }
  });

  bot.callbackQuery(new RegExp(`^${PREFIX.replace("!", "\\!")}ydm!([0-9]+)!([0-9]+)$`), async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    const gi = Number(ctx.match![1]!);
    const mi = Number(ctx.match![2]!);
    await ctx.answerCallbackQuery();
    const kb = new InlineKeyboard()
      .text("✅ Да, удалить", `${PREFIX}dm!${gi}!${mi}`)
      .row()
      .text("Отмена", `${PREFIX}m!${gi}!${mi}`);
    const m = getOtherServicesV1().games[gi]?.mainSections[mi];
    await a.reply(`Подраздел <b>${esc(m?.name ?? "")}</b> — удалить?`, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.callbackQuery(new RegExp(`^${PREFIX.replace("!", "\\!")}dm!([0-9]+)!([0-9]+)$`), async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    const gi = Number(ctx.match![1]!);
    const mi = Number(ctx.match![2]!);
    const g = getOtherServicesV1().games[gi];
    const m = g?.mainSections[mi];
    if (g && m) {
      removeMainSection(g.id, m.id);
    }
    if (ctx.from) {
      clearWiz(ctx.from.id);
    }
    await ctx.answerCallbackQuery();
    if (!g) {
      return;
    }
    const { text, kb } = gameView(gi);
    await a.reply("Подраздел удалён.", { parse_mode: "HTML" });
    await a.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.callbackQuery(new RegExp(`^${PREFIX.replace("!", "\\!")}ydim!([0-9]+)!([0-9]+)!([0-9]+)$`), async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    const gi = Number(ctx.match![1]!);
    const mi = Number(ctx.match![2]!);
    const ii = Number(ctx.match![3]!);
    await ctx.answerCallbackQuery();
    const g = getOtherServicesV1().games[gi];
    const m = g?.mainSections[mi];
    const it = m?.items[ii];
    if (!it || !g || !m) {
      return;
    }
    const kb = new InlineKeyboard()
      .text("🗑 Удалить", `${PREFIX}Xim!${gi}!${mi}!${ii}`)
      .row()
      .text("Отмена", `${PREFIX}m!${gi}!${mi}`);
    await a.reply(`${esc(it.description.slice(0, 80))}`, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.callbackQuery(new RegExp(`^${PREFIX.replace("!", "\\!")}Xim!([0-9]+)!([0-9]+)!([0-9]+)$`), async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    const gi = Number(ctx.match![1]!);
    const mi = Number(ctx.match![2]!);
    const ii = Number(ctx.match![3]!);
    const g = getOtherServicesV1().games[gi];
    const m = g?.mainSections[mi];
    const it = m?.items[ii];
    if (g && m && it) {
      removeItemFromMain(g.id, m.id, it.id);
    }
    if (ctx.from) {
      clearWiz(ctx.from.id);
    }
    await ctx.answerCallbackQuery();
    if (!g || !m) {
      return;
    }
    const { text, kb } = mainView(gi, mi);
    await a.reply("Позиция удалена.");
    await a.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.callbackQuery(new RegExp(`^${PREFIX.replace("!", "\\!")}ydig!([0-9]+)!([0-9]+)$`), async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    const gi = Number(ctx.match![1]!);
    const ii = Number(ctx.match![2]!);
    await ctx.answerCallbackQuery();
    const g = getOtherServicesV1().games[gi];
    const it = g?.items?.[ii];
    if (!it || !g) {
      return;
    }
    const kb = new InlineKeyboard()
      .text("🗑 Удалить", `${PREFIX}Xig!${gi}!${ii}`)
      .row()
      .text("Отмена", `${PREFIX}g!${gi}`);
    await a.reply(`${esc(it.description.slice(0, 80))}`, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.callbackQuery(new RegExp(`^${PREFIX.replace("!", "\\!")}Xig!([0-9]+)!([0-9]+)$`), async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    const gi = Number(ctx.match![1]!);
    const ii = Number(ctx.match![2]!);
    const g = getOtherServicesV1().games[gi];
    const it = g?.items?.[ii];
    if (g && it) {
      removeItemFromGame(g.id, it.id);
    }
    if (ctx.from) {
      clearWiz(ctx.from.id);
    }
    await ctx.answerCallbackQuery();
    if (!g) {
      return;
    }
    const { text, kb } = gameView(gi);
    await a.reply("Позиция удалена.");
    await a.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.on("message", async (ctx, next) => {
    if (ctx.chat?.type !== "private" || !ctx.from) {
      return next();
    }
    if (!adminIds.has(ctx.from.id)) {
      return next();
    }
    const t = ctx.message?.text?.trim() ?? "";
    if (!t || t.startsWith("/") || t === "/start" || t === "/admin") {
      return next();
    }
    const st0 = wizards.get(ctx.from.id);
    if (st0?.k === "gameName") {
      if (t.length < 1) {
        await ctx.reply("Пусто. Введите название.");
        return;
      }
      try {
        const created = createGame(t);
        clearWiz(ctx.from.id);
        const st = getOtherServicesV1();
        const gi = st.games.findIndex((g) => g.id === created.id);
        if (gi < 0) {
          await ctx.reply("Ошибка.");
          return;
        }
        const { text, kb } = gameView(gi);
        await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
      } catch (e) {
        console.error("[os-admin] createGame", getActiveOtherServicesStorePath(), e);
        await ctx.reply("Ошибка сохранения, попробуйте ещё раз.");
      }
      return;
    }
    if (st0?.k === "mainName") {
      const gi = st0.g;
      const g0 = getOtherServicesV1().games[gi];
      if (g0) {
        addMainSection(g0.id, t);
      }
      const u = getOtherServicesV1();
      const game = u.games[gi];
      clearWiz(ctx.from.id);
      if (game && game.mainSections.length > 0) {
        const mi = game.mainSections.length - 1;
        const { text, kb } = mainView(gi, mi);
        await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
      } else {
        const { text, kb } = gameView(gi);
        await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
      }
      return;
    }
    if (st0?.k === "itemDesc") {
      pendingPayMode.set(ctx.from.id, { g: st0.g, m: st0.m, desc: t });
      wizards.delete(ctx.from.id);
      const kb = new InlineKeyboard()
        .text("👤 Менеджер", `${PREFIX}pay!0`)
        .row()
        .text("⚡ Автовыдача", `${PREFIX}pay!1`)
        .row()
        .text("📋 Ручная выдача", `${PREFIX}pay!2`)
        .row()
        .text("❌ Отмена", CB_CANCEL);
      await ctx.reply("Способ выдачи после оплаты:", { parse_mode: "HTML", reply_markup: kb });
      return;
    }
    if (st0?.k === "itemDescGame") {
      pendingPayMode.set(ctx.from.id, { g: st0.g, m: null, desc: t });
      wizards.delete(ctx.from.id);
      const kb = new InlineKeyboard()
        .text("👤 Менеджер", `${PREFIX}pay!0`)
        .row()
        .text("⚡ Автовыдача", `${PREFIX}pay!1`)
        .row()
        .text("📋 Ручная выдача", `${PREFIX}pay!2`)
        .row()
        .text("❌ Отмена", CB_CANCEL);
      await ctx.reply("Способ выдачи после оплаты:", { parse_mode: "HTML", reply_markup: kb });
      return;
    }
    if (st0?.k === "itemAutoDeliverText") {
      if (t.length < 1) {
        await ctx.reply("Введите текст выдачи или отмена.");
        return;
      }
      wizards.set(ctx.from.id, {
        k: "itemAutoAmount",
        g: st0.g,
        m: st0.m,
        cardDesc: st0.cardDesc,
        deliverText: t,
      });
      await ctx.reply("Введите <b>сумму</b>:", {
        parse_mode: "HTML",
        reply_markup: kbCancel(),
      });
      return;
    }
    if (st0?.k === "itemAutoAmount") {
      const n = parseRublesAmountFromUserText(t);
      if (n === null || n <= 0) {
        await ctx.reply("Неверная сумма. Пример: <code>1500</code>", { parse_mode: "HTML" });
        return;
      }
      const game = getOtherServicesV1().games[st0.g];
      if (!game) {
        clearWiz(ctx.from.id);
        await ctx.reply("Раздел не найден.");
        return;
      }
      const payload = {
        description: st0.cardDesc,
        paymentMode: "auto" as const,
        deliverText: st0.deliverText,
        amountRub: n,
      };
      if (st0.m === null) {
        addItemToGame(game.id, payload);
      } else {
        const main = game.mainSections[st0.m];
        if (!main) {
          clearWiz(ctx.from.id);
          await ctx.reply("Подраздел не найден.");
          return;
        }
        addItemToMain(game.id, main.id, payload);
      }
      const gi = st0.g;
      const mi = st0.m;
      clearWiz(ctx.from.id);
      if (mi === null) {
        const { text, kb } = gameView(gi);
        await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
      } else {
        const { text, kb } = mainView(gi, mi);
        await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
      }
      return;
    }
    if (st0?.k === "itemManualAmount") {
      const n = parseRublesAmountFromUserText(t);
      if (n === null || n <= 0) {
        await ctx.reply("Неверная сумма.", { parse_mode: "HTML" });
        return;
      }
      const game = getOtherServicesV1().games[st0.g];
      if (!game) {
        clearWiz(ctx.from.id);
        await ctx.reply("Раздел не найден.");
        return;
      }
      const payload = {
        description: st0.cardDesc,
        paymentMode: "manual" as const,
        amountRub: n,
      };
      if (st0.m === null) {
        addItemToGame(game.id, payload);
      } else {
        const main = game.mainSections[st0.m];
        if (!main) {
          clearWiz(ctx.from.id);
          await ctx.reply("Подраздел не найден.");
          return;
        }
        addItemToMain(game.id, main.id, payload);
      }
      const gi = st0.g;
      const mi = st0.m;
      clearWiz(ctx.from.id);
      if (mi === null) {
        const { text, kb } = gameView(gi);
        await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
      } else {
        const { text, kb } = mainView(gi, mi);
        await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
      }
      return;
    }
    return next();
  });
}
