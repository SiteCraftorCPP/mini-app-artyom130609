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
  setMainDescription,
} from "./other-services-store.js";
import { BTN_BACK_TO_ADMIN } from "./texts.js";

const CB_ENTRY = "admin:os" as const;
const CB_CANCEL = "o!xx" as const;
const PREFIX = "o!";

type Wiz =
  | { k: "gameName" }
  | { k: "mainName"; g: number }
  | { k: "mainPlashText"; g: number; m: number }
  | { k: "itemDesc"; g: number; m: number }
  | { k: "itemDescGame"; g: number }
  | { k: "itemInfoText"; g: number; m: number | null; desc: string; pay: "info" }
  | { k: "itemPayLinks"; g: number; m: number | null; desc: string };

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

function gameView(gi: number): { text: string; kb: InlineKeyboard } {
  const st = getOtherServicesV1();
  const g = st.games[gi];
  if (!g) {
    return { text: "Нет в списке.", kb: new InlineKeyboard().text("⬅️", `${PREFIX}0`) };
  }
  const lines = g.mainSections.map(
    (m) => `• <b>${esc(m.name)}</b> — ${m.items.length} п.`,
  );
  let text = `<b>${esc(g.name)}</b>\n\n`;
  const giItems = g.items ?? [];
  if (giItems.length > 0) {
    text += `<b>Позиции раздела</b> (без подразделов): ${giItems.length}\n`;
    giItems.forEach((it) => {
      const pm = it.paymentMode === "manager" ? "менеджер" : it.paymentMode === "pay" ? "оплата" : "инфо";
      text += `• ${esc(it.description.slice(0, 40))} (${pm})\n`;
    });
    text += "\n";
  }
  text += lines.length ? `${lines.join("\n")}\n\n` : `${g.mainSections.length ? "" : "Подразделов нет — можно добавлять описания в раздел.\n\n"}`;
  const kb = new InlineKeyboard();
  giItems.forEach((it, ii) => {
    const t =
      (it.description.slice(0, 16) + (it.description.length > 16 ? "…" : "")) as string;
    kb.text(t, `${PREFIX}ydig!${gi}!${ii}`).row();
  });
  g.mainSections.forEach((m, mi) => {
    kb.text(m.name.slice(0, 32), `${PREFIX}m!${gi}!${mi}`).row();
  });
  kb.text("➕ Добавить подраздел", `${PREFIX}addm!${gi}`).row();
  kb.text("➕ ОПИСАНИЕ", `${PREFIX}addo!${gi}`).row();
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
  let body = `<b>${esc(m.name)}</b>\n${esc(g.name)}\n\n`;
  if (m.description?.trim()) {
    body += `На плашке: ${esc(m.description.trim())}\n\n`;
  }
  body += "Позиции (описания):\n";
  m.items.forEach((it) => {
    const pm =
      it.paymentMode === "manager" ? "→ менеджер" : it.paymentMode === "pay" ? "→ оплата" : "инфо";
    body += `• ${esc(it.description.slice(0, 40))} (${pm})\n`;
  });
  if (m.items.length === 0) {
    body += "Пока пусто.\n";
  }
  body += "\n";
  const kb = new InlineKeyboard();
  m.items.forEach((it, ii) => {
    const t = (it.description.slice(0, 16) + (it.description.length > 16 ? "…" : "")) as string;
    kb.text(t, `${PREFIX}ydim!${gi}!${mi}!${ii}`).row();
  });
  kb.text("➕ ОПИСАНИЕ", `${PREFIX}addim!${gi}!${mi}`).row();
  kb.text("Текст на плашке", `${PREFIX}maind!${gi}!${mi}`).row();
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
        text: "Откройте подраздел в списке и добавьте описание там.",
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

  bot.callbackQuery(new RegExp(`^${PREFIX.replace("!", "\\!")}maind!([0-9]+)!([0-9]+)$`), async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    const gi = Number(ctx.match![1]!);
    const mi = Number(ctx.match![2]!);
    if (ctx.from) {
      wizards.set(ctx.from.id, { k: "mainPlashText", g: gi, m: mi });
    }
    await ctx.answerCallbackQuery();
    await a.reply("Введите <b>текст на плашке</b> (под названием). Пустое — сбросить.", {
      parse_mode: "HTML",
      reply_markup: kbCancel(),
    });
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
      wizards.set(uid, { k: "itemInfoText", g: pend.g, m: pend.m, desc: pend.desc, pay: "info" });
      pendingPayMode.delete(uid);
      await ctx.answerCallbackQuery();
      await a.reply("Введите <b>текст</b> для карточки:", {
        parse_mode: "HTML",
        reply_markup: kbCancel(),
      });
      return;
    }

    wizards.set(uid, { k: "itemPayLinks", g: pend.g, m: pend.m, desc: pend.desc });
    pendingPayMode.delete(uid);
    await ctx.answerCallbackQuery();
    await a.reply(
      "До <b>3</b> способов оплаты — каждая строка: <code>сумма | URL</code> (пример: <code>4 400 RUB | https://…</code>)",
      { parse_mode: "HTML", reply_markup: kbCancel() },
    );
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
      clearWiz(ctx.from.id);
      const u = getOtherServicesV1();
      const game = u.games[gi];
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
    if (st0?.k === "mainPlashText") {
      const { g: gi, m: mi } = st0;
      const game = getOtherServicesV1().games[gi];
      const main = game?.mainSections[mi];
      if (game && main) {
        setMainDescription(game.id, main.id, t);
      }
      clearWiz(ctx.from.id);
      const { text, kb } = mainView(gi, mi);
      await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
      return;
    }
    if (st0?.k === "itemDesc") {
      pendingPayMode.set(ctx.from.id, { g: st0.g, m: st0.m, desc: t });
      wizards.delete(ctx.from.id);
      const kb = new InlineKeyboard()
        .text("👤 Менеджер", `${PREFIX}pay!0`)
        .row()
        .text("📝 Текст", `${PREFIX}pay!1`)
        .row()
        .text("💳 Оплата", `${PREFIX}pay!2`)
        .row()
        .text("❌ Отмена", CB_CANCEL);
      await ctx.reply("Оплата / выдача:", { parse_mode: "HTML", reply_markup: kb });
      return;
    }
    if (st0?.k === "itemDescGame") {
      pendingPayMode.set(ctx.from.id, { g: st0.g, m: null, desc: t });
      wizards.delete(ctx.from.id);
      const kb = new InlineKeyboard()
        .text("👤 Менеджер", `${PREFIX}pay!0`)
        .row()
        .text("📝 Текст", `${PREFIX}pay!1`)
        .row()
        .text("💳 Оплата", `${PREFIX}pay!2`)
        .row()
        .text("❌ Отмена", CB_CANCEL);
      await ctx.reply("Оплата / выдача:", { parse_mode: "HTML", reply_markup: kb });
      return;
    }
    if (st0?.k === "itemInfoText") {
      pendingPayMode.delete(ctx.from.id);
      const game = getOtherServicesV1().games[st0.g];
      const main = st0.m === null ? null : game?.mainSections[st0.m];
      if (game) {
        if (st0.m === null) {
          addItemToGame(game.id, {
            description: st0.desc,
            paymentMode: "info",
            paymentInfo: t,
          });
        } else if (main) {
          addItemToMain(game.id, main.id, {
            description: st0.desc,
            paymentMode: "info",
            paymentInfo: t,
          });
        }
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
    if (st0?.k === "itemPayLinks") {
      const game = getOtherServicesV1().games[st0.g];
      const main = st0.m === null ? null : game?.mainSections[st0.m];
      const opts: { priceLabel: string; payUrl: string }[] = [];
      for (const line of t.split(/\r?\n/)) {
        const row = line.trim();
        if (!row) {
          continue;
        }
        const pipe = row.indexOf("|");
        if (pipe < 1) {
          continue;
        }
        const priceLabel = row.slice(0, pipe).trim();
        const payUrl = row.slice(pipe + 1).trim();
        if (priceLabel && payUrl) {
          opts.push({ priceLabel, payUrl });
        }
        if (opts.length >= 3) {
          break;
        }
      }
      if (!game || opts.length === 0) {
        clearWiz(ctx.from.id);
        await ctx.reply("Нужна хотя бы одна строка вида <code>сумма | URL</code>.", {
          parse_mode: "HTML",
        });
        return;
      }
      if (st0.m === null) {
        addItemToGame(game.id, {
          description: st0.desc,
          paymentMode: "pay",
          payOptions: opts,
        });
      } else if (main) {
        addItemToMain(game.id, main.id, {
          description: st0.desc,
          paymentMode: "pay",
          payOptions: opts,
        });
      } else {
        clearWiz(ctx.from.id);
        await ctx.reply("Подраздел не найден.");
        return;
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
