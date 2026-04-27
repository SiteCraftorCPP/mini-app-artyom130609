import { InlineKeyboard, type Bot, type Context } from "grammy";

import {
  addItemToMain,
  addItemToSub,
  addMainSection,
  addSubsection,
  createGame,
  getActiveOtherServicesStorePath,
  getOtherServicesV1,
  removeGame,
  removeItemFromMain,
  removeItemFromSub,
  removeMainSection,
  removeSubsection,
} from "./other-services-store.js";
import { BTN_BACK_TO_ADMIN } from "./texts.js";

const CB_ENTRY = "admin:os" as const;
const CB_CANCEL = "o!xx" as const;
const PREFIX = "o!";

type Wiz =
  | { k: "gameName" }
  | { k: "mainName"; g: number }
  | { k: "subName"; g: number; m: number }
  | { k: "itemDesc"; g: number; m: number; sub?: number }
  | { k: "itemInfoText"; g: number; m: number; sub?: number; desc: string; pay: "info" };

const wizards = new Map<number, Wiz>();
const pendingPayMode = new Map<
  number,
  { g: number; m: number; sub?: number; desc: string }
>();

/** Сообщения об «других услугах» обрабатываются вторыми; админка должна сразу `next()`. */
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
    const lab = (g.name || "Игра").slice(0, 28);
    kb.text(lab.slice(0, 32), `${PREFIX}g!${gi}`).row();
  });
  kb.text("➕ Добавить игру", `${PREFIX}newg`).row();
  kb.text(BTN_BACK_TO_ADMIN, "admin:menu");
  return kb;
}

function buildRootText(): string {
  const st = getOtherServicesV1();
  if (st.games.length === 0) {
    return "<b>Другие услуги</b>\n\nПока нет игр. Нажмите <b>Добавить игру</b> - введите название.";
  }
  const lines = st.games.map((g) => `• ${esc(g.name)}`);
  return `<b>Другие услуги</b>\n\n${st.games.length} игр.\n${lines.join("\n")}`;
}

function gameView(gi: number): { text: string; kb: InlineKeyboard } {
  const st = getOtherServicesV1();
  const g = st.games[gi];
  if (!g) {
    return { text: "Нет в списке.", kb: new InlineKeyboard().text("⬅️", `${PREFIX}0`) };
  }
  const lines = g.mainSections.map(
    (m) => `• <b>${esc(m.name)}</b> — подр.: ${m.subsections.length}, товаров: ${m.subsections.length ? m.subsections.reduce((a, s) => a + s.items.length, 0) : m.items.length}`,
  );
  const text = `<b>${esc(g.name)}</b>\n\n${lines.length ? lines.join("\n") : "Нет разделов."}`;
  const kb = new InlineKeyboard();
  g.mainSections.forEach((m, mi) => {
    kb.text(`📁 ${m.name.slice(0, 24)}`, `${PREFIX}m!${gi}!${mi}`).row();
  });
  kb.text("➕ Раздел", `${PREFIX}addm!${gi}`).row();
  kb.text("🗑 Игра", `${PREFIX}ydg!${gi}`).row();
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
  const hasSub = m.subsections.length > 0;
  const hasM = m.items.length > 0;
  let body = `📁 <b>${esc(m.name)}</b> · ${esc(g.name)}\n\n`;
  if (hasSub) {
    body += "Подразделы:\n";
    m.subsections.forEach((s) => {
      body += `• ${esc(s.name)} — ${s.items.length} п.\n`;
    });
  } else {
    body += "Товары:\n";
    m.items.forEach((it) => {
      const pm = it.paymentMode === "manager" ? "→ менеджер" : "инфо";
      body += `• ${esc(it.description.slice(0, 40))} (${pm})\n`;
    });
    if (m.items.length === 0) {
      body += "Пока пусто.\n";
    }
  }
  body += "\n";
  const kb = new InlineKeyboard();
  if (hasSub) {
    m.subsections.forEach((s, si) => {
      kb.text(`📂 ${s.name.slice(0, 22)}`, `${PREFIX}s!${gi}!${mi}!${si}`).row();
    });
    kb.text("➕ Подраздел", `${PREFIX}adds!${gi}!${mi}`).row();
  } else {
    if (hasM) {
      m.items.forEach((it, ii) => {
        const t = (it.description.slice(0, 16) + (it.description.length > 16 ? "…" : "")) as string;
        kb.text(`🧾 ${t}`, `${PREFIX}ydim!${gi}!${mi}!${ii}`).row();
      });
    }
    kb.text("➕ Товар", `${PREFIX}addim!${gi}!${mi}`).row();
    if (!hasM) {
      kb.text("➕ Подраздел", `${PREFIX}adds!${gi}!${mi}`).row();
    }
  }
  kb.text("🗑 Раздел", `${PREFIX}ydm!${gi}!${mi}`).row();
  kb.text("⬅️ К игре", `${PREFIX}g!${gi}`);
  return { text: body, kb };
}

function subView(gi: number, mi: number, si: number): { text: string; kb: InlineKeyboard } {
  const st = getOtherServicesV1();
  const s = st.games[gi]?.mainSections[mi]?.subsections[si];
  if (!s) {
    return { text: "Нет.", kb: new InlineKeyboard().text("⬅️", `${PREFIX}m!${gi}!${mi}`) };
  }
  let body = `📂 <b>${esc(s.name)}</b>\n\n`;
  s.items.forEach((it) => {
    const pm = it.paymentMode === "manager" ? "→ менеджер" : "текст";
    body += `• ${esc(it.description.slice(0, 50))} (${pm})\n`;
  });
  if (s.items.length === 0) {
    body += "Пока пусто.\n";
  }
  const kb = new InlineKeyboard();
  s.items.forEach((it, ii) => {
    const t = (it.description.slice(0, 16) + (it.description.length > 16 ? "…" : "")) as string;
    kb.text(`🧾 ${t}`, `${PREFIX}ydis!${gi}!${mi}!${si}!${ii}`).row();
  });
  kb.text("➕ Товар", `${PREFIX}addis!${gi}!${mi}!${si}`).row();
  kb.text("🗑 Подраздел", `${PREFIX}yds!${gi}!${mi}!${si}`).row();
  kb.text("⬅️", `${PREFIX}m!${gi}!${mi}`);
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

  /** POST new game name */
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
    await a.reply("Введите <b>название</b>:", { parse_mode: "HTML", reply_markup: kbCancel() });
  });

  bot.callbackQuery(new RegExp(`^${PREFIX.replace("!", "\\!")}g!([0-9]+)$`), async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    const gi = Number(ctx.match![1]!);
    if (ctx.from) {
      clearWiz(ctx.from.id);
    }
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

  bot.callbackQuery(new RegExp(`^${PREFIX.replace("!", "\\!")}s!([0-9]+)!([0-9]+)!([0-9]+)$`), async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    if (ctx.from) {
      clearWiz(ctx.from.id);
    }
    const gi = Number(ctx.match![1]!);
    const mi = Number(ctx.match![2]!);
    const si = Number(ctx.match![3]!);
    await ctx.answerCallbackQuery();
    const { text, kb } = subView(gi, mi, si);
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
    await a.reply("Введите <b>название</b> раздела:", { parse_mode: "HTML", reply_markup: kbCancel() });
  });

  bot.callbackQuery(new RegExp(`^${PREFIX.replace("!", "\\!")}adds!([0-9]+)!([0-9]+)$`), async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    const gi = Number(ctx.match![1]!);
    const mi = Number(ctx.match![2]!);
    if (ctx.from) {
      wizards.set(ctx.from.id, { k: "subName", g: gi, m: mi });
    }
    await ctx.answerCallbackQuery();
    await a.reply("Введите <b>подраздел</b>:", { parse_mode: "HTML", reply_markup: kbCancel() });
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
    await a.reply("Введите <b>описание</b>:", { parse_mode: "HTML", reply_markup: kbCancel() });
  });

  bot.callbackQuery(new RegExp(`^${PREFIX.replace("!", "\\!")}addis!([0-9]+)!([0-9]+)!([0-9]+)$`), async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    const gi = Number(ctx.match![1]!);
    const mi = Number(ctx.match![2]!);
    const si = Number(ctx.match![3]!);
    if (ctx.from) {
      wizards.set(ctx.from.id, { k: "itemDesc", g: gi, m: mi, sub: si });
    }
    await ctx.answerCallbackQuery();
    await a.reply("Введите <b>описание</b>:", { parse_mode: "HTML", reply_markup: kbCancel() });
  });

  bot.callbackQuery(new RegExp(`^${PREFIX.replace("!", "\\!")}pay!([01])$`), async (ctx) => {
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
    if (tag === "0") {
      const st = getOtherServicesV1();
      const g = st.games[pend.g];
      const m = g?.mainSections[pend.m];
      if (!g || !m) {
        await ctx.answerCallbackQuery({ text: "Обновите список", show_alert: true });
        return;
      }
      if (pend.sub == null) {
        addItemToMain(g.id, m.id, { description: pend.desc, paymentMode: "manager" });
      } else {
        const sub = m.subsections[pend.sub];
        if (sub) {
          addItemToSub(g.id, m.id, sub.id, { description: pend.desc, paymentMode: "manager" });
        }
      }
      clearWiz(uid);
      const gi = pend.g;
      const mi = pend.m;
      await ctx.answerCallbackQuery();
      if (pend.sub == null) {
        const { text, kb } = mainView(gi, mi);
        await a.reply(text, { parse_mode: "HTML", reply_markup: kb });
      } else {
        const { text, kb } = subView(gi, mi, pend.sub!);
        await a.reply(text, { parse_mode: "HTML", reply_markup: kb });
      }
      return;
    }
    if (tag === "1") {
      wizards.set(uid, { k: "itemInfoText", g: pend.g, m: pend.m, sub: pend.sub, desc: pend.desc, pay: "info" });
      pendingPayMode.delete(uid);
      await ctx.answerCallbackQuery();
      await a.reply("Введите <b>текст</b> для карточки:", {
        parse_mode: "HTML",
        reply_markup: kbCancel(),
      });
    }
  });

  /** Удаление игры */
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
    await a.reply(`Игра <b>${esc(g?.name ?? "")}</b> — удалить?`, { parse_mode: "HTML", reply_markup: kb });
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
    await a.reply("✅ Удалено.");
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
    await a.reply(`Раздел <b>${esc(m?.name ?? "")}</b> — удалить?`, { parse_mode: "HTML", reply_markup: kb });
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
    await a.reply("✅ Раздел удалён.", { parse_mode: "HTML" });
    await a.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.callbackQuery(new RegExp(`^${PREFIX.replace("!", "\\!")}yds!([0-9]+)!([0-9]+)!([0-9]+)$`), async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    const gi = Number(ctx.match![1]!);
    const mi = Number(ctx.match![2]!);
    const si = Number(ctx.match![3]!);
    await ctx.answerCallbackQuery();
    const kb = new InlineKeyboard()
      .text("✅ Да, удалить", `${PREFIX}ds!${gi}!${mi}!${si}`)
      .row()
      .text("Отмена", `${PREFIX}s!${gi}!${mi}!${si}`);
    const s = getOtherServicesV1().games[gi]?.mainSections[mi]?.subsections[si];
    await a.reply(`Подраздел <b>${esc(s?.name ?? "")}</b> — удалить?`, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.callbackQuery(new RegExp(`^${PREFIX.replace("!", "\\!")}ds!([0-9]+)!([0-9]+)!([0-9]+)$`), async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    const gi = Number(ctx.match![1]!);
    const mi = Number(ctx.match![2]!);
    const si = Number(ctx.match![3]!);
    const g = getOtherServicesV1().games[gi];
    const m = g?.mainSections[mi];
    const s = m?.subsections[si];
    if (g && m && s) {
      removeSubsection(g.id, m.id, s.id);
    }
    if (ctx.from) {
      clearWiz(ctx.from.id);
    }
    await ctx.answerCallbackQuery();
    if (!g || !m) {
      return;
    }
    const { text, kb } = mainView(gi, mi);
    await a.reply("✅ Подраздел удалён.");
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
    await a.reply("✅ Позиция удалена.");
    await a.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.callbackQuery(new RegExp(`^${PREFIX.replace("!", "\\!")}ydis!([0-9]+)!([0-9]+)!([0-9]+)!([0-9]+)$`), async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    const gi = Number(ctx.match![1]!);
    const mi = Number(ctx.match![2]!);
    const si = Number(ctx.match![3]!);
    const ii = Number(ctx.match![4]!);
    await ctx.answerCallbackQuery();
    const g = getOtherServicesV1().games[gi];
    const m = g?.mainSections[mi];
    const sub = m?.subsections[si];
    const it = sub?.items[ii];
    if (!it) {
      return;
    }
    const kb = new InlineKeyboard()
      .text("🗑 Удалить", `${PREFIX}Xis!${gi}!${mi}!${si}!${ii}`)
      .row()
      .text("Отмена", `${PREFIX}s!${gi}!${mi}!${si}`);
    await a.reply(`${esc(it.description.slice(0, 80))}`, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.callbackQuery(new RegExp(`^${PREFIX.replace("!", "\\!")}Xis!([0-9]+)!([0-9]+)!([0-9]+)!([0-9]+)$`), async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    const gi = Number(ctx.match![1]!);
    const mi = Number(ctx.match![2]!);
    const si = Number(ctx.match![3]!);
    const ii = Number(ctx.match![4]!);
    const g = getOtherServicesV1().games[gi];
    const m = g?.mainSections[mi];
    const sub = m?.subsections[si];
    const it = sub?.items[ii];
    if (g && m && sub && it) {
      removeItemFromSub(g.id, m.id, sub.id, it.id);
    }
    if (ctx.from) {
      clearWiz(ctx.from.id);
    }
    await ctx.answerCallbackQuery();
    if (!g || !m || !sub) {
      return;
    }
    const { text, kb } = subView(gi, mi, si);
    await a.reply("✅ Позиция удалена.");
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
    if (st0?.k === "subName") {
      const { g: gi, m: mi } = st0;
      const game = getOtherServicesV1().games[gi];
      const main = game?.mainSections[mi];
      if (game && main) {
        const r = addSubsection(game.id, main.id, t);
        if (r == null) {
          clearWiz(ctx.from.id);
          await ctx.reply("Удалите товары из раздела.", { parse_mode: "HTML" });
          return;
        }
      }
      clearWiz(ctx.from.id);
      const u = getOtherServicesV1();
      const m = u.games[gi]?.mainSections[mi];
      const si = m && m.subsections.length > 0 ? m.subsections.length - 1 : 0;
      if (m && m.subsections[si]) {
        const { text, kb } = subView(gi, mi, si);
        await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      }
      const { text, kb } = mainView(gi, mi);
      await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
      return;
    }
    if (st0?.k === "itemDesc") {
      pendingPayMode.set(ctx.from.id, { g: st0.g, m: st0.m, sub: st0.sub, desc: t });
      wizards.delete(ctx.from.id);
      const kb = new InlineKeyboard()
        .text("👤 Менеджер", `${PREFIX}pay!0`)
        .row()
        .text("📝 Текст", `${PREFIX}pay!1`)
        .row()
        .text("❌ Отмена", CB_CANCEL);
      await ctx.reply("Оплата:", { parse_mode: "HTML", reply_markup: kb });
      return;
    }
    if (st0?.k === "itemInfoText") {
      pendingPayMode.delete(ctx.from.id);
      const game = getOtherServicesV1().games[st0.g];
      const main = game?.mainSections[st0.m];
      if (game && main) {
        if (st0.sub == null) {
          addItemToMain(game.id, main.id, { description: st0.desc, paymentMode: "info", paymentInfo: t });
        } else {
          const sub = main.subsections[st0.sub];
          if (sub) {
            addItemToSub(game.id, main.id, sub.id, { description: st0.desc, paymentMode: "info", paymentInfo: t });
          }
        }
      }
      const gi = st0.g;
      const mi = st0.m;
      const ssub = st0.sub;
      clearWiz(ctx.from.id);
      if (ssub == null) {
        const { text, kb } = mainView(gi, mi);
        await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
      } else {
        const { text, kb } = subView(gi, mi, ssub);
        await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
      }
      return;
    }
    return next();
  });
}
