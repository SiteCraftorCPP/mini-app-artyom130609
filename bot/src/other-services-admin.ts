import { InlineKeyboard, type Bot, type Context } from "grammy";

import {
  addItem,
  addMainSection,
  addSubsection,
  getGame,
  getOtherServicesV1,
  removeGame,
  removeItem,
  removeMainSection,
  upsertEmptyGame,
} from "./other-services-store.js";
import type { OtherServicesDelivery } from "./other-services-types.js";
import { BTN_BACK_TO_ADMIN } from "./texts.js";

const CB_ENTRY = "admin:os" as const;
const CB_CANCEL = "os:xx" as const;
const OS_MENU = "os:0" as const;

/** Код кнопки → projectKey (как в магазине). */
export const OS_PROJECT_BY_CODE: Record<string, string> = {
  br: "black-russia",
  mrp: "matryoshka-rp",
  gta: "gta-v-rp",
  maj: "majestic-rp",
  arz: "arizona-rp",
  rdm: "radmir-rp",
  prv: "province-rp",
  amz: "amazing-rp",
  gdm: "grand-mobile-rp",
};

const CODE_BY_PK: Record<string, string> = Object.fromEntries(
  Object.entries(OS_PROJECT_BY_CODE).map(([c, p]) => [p, c]),
);

function projectLabel(pk: string): string {
  const map: Record<string, string> = {
    "black-russia": "Black Russia",
    "matryoshka-rp": "Матрешка РП",
    "gta-v-rp": "GTA V RP",
    "majestic-rp": "Majestic RP",
    "arizona-rp": "Arizona RP",
    "radmir-rp": "Radmir RP",
    "province-rp": "Province RP",
    "amazing-rp": "Amazing RP",
    "grand-mobile-rp": "Grand Mobile RP",
  };
  return map[pk] ?? pk;
}

type WizState =
  | { step: "mainName"; projectKey: string }
  | { step: "subName"; projectKey: string; mainId: string }
  | { step: "itemDesc"; projectKey: string; mainId: string; subId: string }
  | {
      step: "itemPrice";
      projectKey: string;
      mainId: string;
      subId: string;
      description: string;
    }
  | {
      step: "itemPayment";
      projectKey: string;
      mainId: string;
      subId: string;
      description: string;
      price: string;
    }
  | {
      step: "itemAutoText";
      projectKey: string;
      mainId: string;
      subId: string;
      description: string;
      price: string;
      payment: string;
    }
  | {
      step: "itemManualHint";
      projectKey: string;
      mainId: string;
      subId: string;
      description: string;
      price: string;
      payment: string;
    };

const awaitingOs = new Map<number, WizState>();
const pendingItemBeforeDelivery = new Map<
  number,
  {
    projectKey: string;
    mainId: string;
    subId: string;
    description: string;
    price: string;
    payment: string;
  }
>();

function assertCb(s: string) {
  if (s.length > 64) {
    console.warn("other-services: callback too long", s.length, s);
  }
}

function kbCancel() {
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
    awaitingOs.delete(uid);
    pendingItemBeforeDelivery.delete(uid);
  }

  function buildRootText(): string {
    const s = getOtherServicesV1();
    if (s.games.length === 0) {
      return "🛎 <b>Каталог «Другие услуги»</b>\n\nПока нет игр. Добавьте игру кнопкой ниже — затем разделы и позиции.";
    }
    const lines = s.games.map((g) => `• ${projectLabel(g.projectKey)}`);
    return `🛎 <b>Каталог «Другие услуги»</b>\n\nВ каталоге игры:\n${lines.join("\n")}\n\nОткройте игру, чтобы править структуру.`;
  }

  function buildRootKb(): InlineKeyboard {
    const kb = new InlineKeyboard();
    for (const g of getOtherServicesV1().games) {
      const c = CODE_BY_PK[g.projectKey] ?? g.projectKey.slice(0, 3);
      const d = `os:g:${c}`;
      assertCb(d);
      kb.text(`🎮 ${projectLabel(g.projectKey)}`, d).row();
    }
    const used = new Set(getOtherServicesV1().games.map((g) => g.projectKey));
    for (const [code, pk] of Object.entries(OS_PROJECT_BY_CODE)) {
      if (used.has(pk)) {
        continue;
      }
      const d = `os:ag:${code}`;
      assertCb(d);
      kb.text(`➕ ${projectLabel(pk)}`, d).row();
    }
    assertCb(CB_ENTRY);
    kb.text(BTN_BACK_TO_ADMIN, "admin:menu").row();
    return kb;
  }

  function buildGameKb(projectKey: string): InlineKeyboard {
    const c = CODE_BY_PK[projectKey] ?? "br";
    const g = getGame(projectKey);
    const kb = new InlineKeyboard();
    if (g) {
      for (const m of g.mainSections) {
        const d = `os:gs:${c}:${m.id}`;
        assertCb(d);
        kb.text(`📁 ${m.name.slice(0, 28)}`, d).row();
      }
    }
    const da = `os:gm:${c}`;
    assertCb(da);
    kb.text("➕ Раздел (основной)", da).row();
    const dd = `os:gd:${c}`;
    assertCb(dd);
    kb.text("🗑 Удалить игру из каталога", dd).row();
    const back = `os:0`;
    assertCb(back);
    kb.text("⬅️ К списку игр", back).row();
    kb.text(BTN_BACK_TO_ADMIN, "admin:menu");
    return kb;
  }

  function buildMainText(projectKey: string): string {
    const g = getGame(projectKey);
    if (!g) {
      return "Игра не найдена.";
    }
    return `🎮 <b>${projectLabel(projectKey)}</b>\n\nОсновных разделов: ${g.mainSections.length}.\nВыберите раздел или создайте новый.`;
  }

  function buildSubKb(projectKey: string, mainId: string): InlineKeyboard {
    const c = CODE_BY_PK[projectKey] ?? "br";
    const g = getGame(projectKey);
    const m = g?.mainSections.find((x) => x.id === mainId);
    const kb = new InlineKeyboard();
    if (m) {
      for (const s of m.subsections) {
        const d = `os:gi:${c}:${mainId}:${s.id}`;
        assertCb(d);
        kb.text(`📂 ${s.name.slice(0, 26)}`, d).row();
      }
    }
    const da = `os:gb:${c}:${mainId}`;
    assertCb(da);
    kb.text("➕ Подраздел", da).row();
    const dr = `os:gr:${c}:${mainId}`;
    assertCb(dr);
    kb.text("🗑 Удалить этот раздел", dr).row();
    const back = `os:g:${c}`;
    assertCb(back);
    kb.text("⬅️ Назад", back);
    return kb;
  }

  function buildSubText(projectKey: string, mainId: string): string {
    const g = getGame(projectKey);
    const m = g?.mainSections.find((x) => x.id === mainId);
    if (!m) {
      return "Раздел не найден.";
    }
    return `📁 <b>${m.name}</b> (${projectLabel(projectKey)})\n\nПодразделов: ${m.subsections.length}.`;
  }

  function buildItemsKb(projectKey: string, mainId: string, subId: string): InlineKeyboard {
    const c = CODE_BY_PK[projectKey] ?? "br";
    const g = getGame(projectKey);
    const sub = g?.mainSections.find((m) => m.id === mainId)?.subsections.find((s) => s.id === subId);
    const kb = new InlineKeyboard();
    if (sub) {
      for (const it of sub.items) {
        const d = `os:ir:${c}:${mainId}:${subId}:${it.id}`;
        assertCb(d);
        const lab = it.description.slice(0, 20) + (it.description.length > 20 ? "…" : "");
        kb.text(`🧾 ${lab} — ${it.price}`, d).row();
      }
    }
    const di = `os:ii:${c}:${mainId}:${subId}`;
    assertCb(di);
    kb.text("➕ Позиция (описание, цена, выдача)", di).row();
    const back = `os:gs:${c}:${mainId}`;
    assertCb(back);
    kb.text("⬅️ Назад", back);
    return kb;
  }

  function buildItemsText(projectKey: string, mainId: string, subId: string): string {
    const g = getGame(projectKey);
    const m = g?.mainSections.find((x) => x.id === mainId);
    const s = m?.subsections.find((x) => x.id === subId);
    if (!s) {
      return "Подраздел не найден.";
    }
    const lines = s.items.map((it) => {
      const del =
        it.delivery === "manager" ? "→ менеджер" : it.delivery === "auto" ? "авто" : "вручную";
      const payment = it.payment ? `; оплата: ${it.payment}` : "";
      return `• <b>${it.price}</b> — ${it.description} (${del}${payment})`;
    });
    return `📂 <b>${s.name}</b>\n\n${lines.length ? lines.join("\n") : "Пока пусто."}\n\nДобавьте позицию или откройте существующую, чтобы удалить.`;
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
      await a.editMessageText(buildRootText(), {
        parse_mode: "HTML",
        reply_markup: buildRootKb(),
      });
    } catch {
      await a.reply(buildRootText(), { parse_mode: "HTML", reply_markup: buildRootKb() });
    }
  });

  bot.callbackQuery(OS_MENU, async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    if (ctx.from) {
      clearWiz(ctx.from.id);
    }
    await ctx.answerCallbackQuery();
    try {
      await a.editMessageText(buildRootText(), {
        parse_mode: "HTML",
        reply_markup: buildRootKb(),
      });
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
      await a.editMessageText(buildRootText(), {
        parse_mode: "HTML",
        reply_markup: buildRootKb(),
      });
    } catch {
      await a.reply("Отменено.", { reply_markup: buildRootKb() });
    }
  });

  bot.callbackQuery(/^os:ag:([a-z0-9]+)$/, async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    const code = ctx.match![1]!;
    const projectKey = OS_PROJECT_BY_CODE[code];
    if (!projectKey) {
      await ctx.answerCallbackQuery({ text: "Неизвестный код", show_alert: true });
      return;
    }
    await ctx.answerCallbackQuery();
    upsertEmptyGame(projectKey);
    try {
      await a.editMessageText(buildMainText(projectKey), {
        parse_mode: "HTML",
        reply_markup: buildGameKb(projectKey),
      });
    } catch {
      await a.reply(buildMainText(projectKey), { parse_mode: "HTML", reply_markup: buildGameKb(projectKey) });
    }
  });

  bot.callbackQuery(/^os:g:([a-z0-9]+)$/, async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    const code = ctx.match![1]!;
    const projectKey = OS_PROJECT_BY_CODE[code];
    if (!projectKey || !getGame(projectKey)) {
      await ctx.answerCallbackQuery({ text: "Каталог не найден. Добавьте игру с главного списка.", show_alert: true });
      return;
    }
    if (ctx.from) {
      clearWiz(ctx.from.id);
    }
    await ctx.answerCallbackQuery();
    try {
      await a.editMessageText(buildMainText(projectKey), {
        parse_mode: "HTML",
        reply_markup: buildGameKb(projectKey),
      });
    } catch {
      await a.reply(buildMainText(projectKey), { parse_mode: "HTML", reply_markup: buildGameKb(projectKey) });
    }
  });

  bot.callbackQuery(/^os:gd:([a-z0-9]+)$/, async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    const code = ctx.match![1]!;
    const projectKey = OS_PROJECT_BY_CODE[code];
    if (!projectKey) {
      return;
    }
    await ctx.answerCallbackQuery();
    const kb = new InlineKeyboard()
      .text("✅ Да, удалить", `os:gd!:${code}`)
      .row()
      .text("Отмена", `os:g:${code}`);
    try {
      await a.editMessageText(
        "Удалить из каталога «Другие услуги» всю игру <b>со всеми разделами</b>?",
        { parse_mode: "HTML", reply_markup: kb },
      );
    } catch {
      await a.reply("Подтвердите.", { parse_mode: "HTML", reply_markup: kb });
    }
  });

  bot.callbackQuery(/^os:gd!:([a-z0-9]+)$/, async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    const code = ctx.match![1]!;
    const projectKey = OS_PROJECT_BY_CODE[code];
    if (projectKey) {
      removeGame(projectKey);
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

  bot.callbackQuery(/^os:gm:([a-z0-9]+)$/, async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    const code = ctx.match![1]!;
    const projectKey = OS_PROJECT_BY_CODE[code];
    if (!projectKey) {
      return;
    }
    if (ctx.from) {
      awaitingOs.set(ctx.from.id, { step: "mainName", projectKey });
    }
    await ctx.answerCallbackQuery();
    await a.reply("Введите <b>название основного раздела</b> одним сообщением:", {
      parse_mode: "HTML",
      reply_markup: kbCancel(),
    });
  });

  bot.callbackQuery(/^os:gs:([a-z0-9]+):([^:\s]+)$/, async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    const code = ctx.match![1]!;
    const mainId = ctx.match![2]!;
    const projectKey = OS_PROJECT_BY_CODE[code];
    if (!projectKey) {
      return;
    }
    if (ctx.from) {
      clearWiz(ctx.from.id);
    }
    await ctx.answerCallbackQuery();
    try {
      await a.editMessageText(buildSubText(projectKey, mainId), {
        parse_mode: "HTML",
        reply_markup: buildSubKb(projectKey, mainId),
      });
    } catch {
      await a.reply(buildSubText(projectKey, mainId), {
        parse_mode: "HTML",
        reply_markup: buildSubKb(projectKey, mainId),
      });
    }
  });

  bot.callbackQuery(/^os:gb:([a-z0-9]+):([^:\s]+)$/, async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    const code = ctx.match![1]!;
    const mainId = ctx.match![2]!;
    const projectKey = OS_PROJECT_BY_CODE[code];
    if (!projectKey) {
      return;
    }
    if (ctx.from) {
      awaitingOs.set(ctx.from.id, { step: "subName", projectKey, mainId });
    }
    await ctx.answerCallbackQuery();
    await a.reply("Введите <b>название подраздела</b> (внутри основного раздела):", {
      parse_mode: "HTML",
      reply_markup: kbCancel(),
    });
  });

  bot.callbackQuery(/^os:gr:([a-z0-9]+):([^:\s]+)$/, async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    const code = ctx.match![1]!;
    const mainId = ctx.match![2]!;
    const projectKey = OS_PROJECT_BY_CODE[code];
    if (!projectKey) {
      return;
    }
    const kb = new InlineKeyboard()
      .text("✅ Удалить подразделы/позиции", `os:gr!:${code}:${mainId}`)
      .row()
      .text("Отмена", `os:g:${code}`);
    await ctx.answerCallbackQuery();
    try {
      await a.editMessageText("Удалить <b>основной раздел</b> со всеми подпунктами?", {
        parse_mode: "HTML",
        reply_markup: kb,
      });
    } catch {
      await a.reply("Удалить раздел?", { parse_mode: "HTML", reply_markup: kb });
    }
  });

  bot.callbackQuery(/^os:gr!:([a-z0-9]+):([^:\s]+)$/, async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    const code = ctx.match![1]!;
    const mainId = ctx.match![2]!;
    const projectKey = OS_PROJECT_BY_CODE[code];
    if (projectKey) {
      removeMainSection(projectKey, mainId);
    }
    await ctx.answerCallbackQuery();
    if (ctx.from) {
      clearWiz(ctx.from.id);
    }
    try {
      await a.editMessageText(buildMainText(projectKey!), {
        parse_mode: "HTML",
        reply_markup: buildGameKb(projectKey!),
      });
    } catch {
      await a.reply(buildMainText(projectKey!), { parse_mode: "HTML", reply_markup: buildGameKb(projectKey!) });
    }
  });

  bot.callbackQuery(/^os:gi:([a-z0-9]+):([^:\s]+):([^:\s]+)$/, async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    const code = ctx.match![1]!;
    const mainId = ctx.match![2]!;
    const subId = ctx.match![3]!;
    const projectKey = OS_PROJECT_BY_CODE[code];
    if (!projectKey) {
      return;
    }
    if (ctx.from) {
      clearWiz(ctx.from.id);
    }
    await ctx.answerCallbackQuery();
    try {
      await a.editMessageText(buildItemsText(projectKey, mainId, subId), {
        parse_mode: "HTML",
        reply_markup: buildItemsKb(projectKey, mainId, subId),
      });
    } catch {
      await a.reply(buildItemsText(projectKey, mainId, subId), {
        parse_mode: "HTML",
        reply_markup: buildItemsKb(projectKey, mainId, subId),
      });
    }
  });

  bot.callbackQuery(/^os:ii:([a-z0-9]+):([^:\s]+):([^:\s]+)$/, async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    const code = ctx.match![1]!;
    const mainId = ctx.match![2]!;
    const subId = ctx.match![3]!;
    const projectKey = OS_PROJECT_BY_CODE[code];
    if (!projectKey) {
      return;
    }
    if (ctx.from) {
      awaitingOs.set(ctx.from.id, { step: "itemDesc", projectKey, mainId, subId });
    }
    await ctx.answerCallbackQuery();
    await a.reply(
      [
        "Введите <b>краткое описание</b> позиции (что покупают).",
        "",
        "Далее: цена → метод оплаты → способ выдачи: менеджер / авто / вручную.",
      ].join("\n"),
      { parse_mode: "HTML", reply_markup: kbCancel() },
    );
  });

  bot.callbackQuery(/^os:ir:([a-z0-9]+):([^:\s]+):([^:\s]+):([^:\s]+)$/, async (ctx) => {
    const a = await requireAd(ctx);
    if (a == null) {
      return;
    }
    const code = ctx.match![1]!;
    const mainId = ctx.match![2]!;
    const subId = ctx.match![3]!;
    const itemId = ctx.match![4]!;
    const projectKey = OS_PROJECT_BY_CODE[code];
    if (projectKey) {
      removeItem(projectKey, mainId, subId, itemId);
    }
    await ctx.answerCallbackQuery();
    if (ctx.from) {
      clearWiz(ctx.from.id);
    }
    if (!projectKey) {
      return;
    }
    try {
      await a.editMessageText(buildItemsText(projectKey, mainId, subId), {
        parse_mode: "HTML",
        reply_markup: buildItemsKb(projectKey, mainId, subId),
      });
    } catch {
      await a.reply(buildItemsText(projectKey, mainId, subId), {
        parse_mode: "HTML",
        reply_markup: buildItemsKb(projectKey, mainId, subId),
      });
    }
  });

  for (const [tag, d] of [
    ["m", "manager"],
    ["a", "auto"],
    ["h", "manual"],
  ] as const) {
    bot.callbackQuery(`os:it:${tag}`, async (ctx) => {
      const a = await requireAd(ctx);
      if (a == null) {
        return;
      }
      if (!ctx.from) {
        return;
      }
      const pend = pendingItemBeforeDelivery.get(ctx.from.id);
      if (!pend) {
        await ctx.answerCallbackQuery({ text: "Сначала введите описание и цену.", show_alert: true });
        return;
      }
      pendingItemBeforeDelivery.delete(ctx.from.id);
      const del = d as OtherServicesDelivery;
      if (del === "manager") {
        addItem(pend.projectKey, pend.mainId, pend.subId, {
          description: pend.description,
          price: pend.price,
          payment: pend.payment,
          delivery: "manager",
        });
        await ctx.answerCallbackQuery();
        const c = CODE_BY_PK[pend.projectKey] ?? "br";
        await a.reply("✅ Позиция добавлена (передача через менеджера).", {
          reply_markup: new InlineKeyboard().text("⬅️ К позициям", `os:gi:${c}:${pend.mainId}:${pend.subId}`),
        });
        return;
      }
      if (del === "auto") {
        awaitingOs.set(ctx.from.id, {
          step: "itemAutoText",
          projectKey: pend.projectKey,
          mainId: pend.mainId,
          subId: pend.subId,
          description: pend.description,
          price: pend.price,
          payment: pend.payment,
        });
        await ctx.answerCallbackQuery();
        await a.reply("Введите <b>текст автовыдачи</b> (увидит покупатель):", { parse_mode: "HTML", reply_markup: kbCancel() });
        return;
      }
      awaitingOs.set(ctx.from.id, {
        step: "itemManualHint",
        projectKey: pend.projectKey,
        mainId: pend.mainId,
        subId: pend.subId,
        description: pend.description,
        price: pend.price,
        payment: pend.payment,
      });
      await ctx.answerCallbackQuery();
      await a.reply(
        "Введите <b>подсказку для админа</b> при ручной выдаче (или <code>-</code> пропустить).",
        { parse_mode: "HTML", reply_markup: kbCancel() },
      );
    });
  }

  /** Сообщения: мастер ввода. */
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
    const st = awaitingOs.get(ctx.from.id);
    if (!st) {
      return next();
    }

    if (st.step === "mainName") {
      if (t.length < 2) {
        await ctx.reply("Слишком коротко, введите название раздела.");
        return;
      }
      addMainSection(st.projectKey, t);
      clearWiz(ctx.from.id);
      await ctx.reply("✅ Основной раздел добавлен.", {
        reply_markup: new InlineKeyboard().text("⬅️ К игре", `os:g:${CODE_BY_PK[st.projectKey] ?? "br"}`),
      });
      return;
    }
    if (st.step === "subName") {
      if (t.length < 1) {
        return;
      }
      addSubsection(st.projectKey, st.mainId, t);
      clearWiz(ctx.from.id);
      await ctx.reply("✅ Подраздел добавлен.", {
        reply_markup: new InlineKeyboard().text("⬅️ К разделу", `os:gs:${CODE_BY_PK[st.projectKey] ?? "br"}:${st.mainId}`),
      });
      return;
    }
    if (st.step === "itemDesc") {
      awaitingOs.set(ctx.from.id, {
        step: "itemPrice",
        projectKey: st.projectKey,
        mainId: st.mainId,
        subId: st.subId,
        description: t,
      });
      await ctx.reply("Введите <b>цену / тариф</b> строкой (например <code>1 200 ₽</code>):", { parse_mode: "HTML", reply_markup: kbCancel() });
      return;
    }
    if (st.step === "itemPrice") {
      const desc = st.description;
      if (!desc) {
        return;
      }
      awaitingOs.set(ctx.from.id, {
        step: "itemPayment",
        projectKey: st.projectKey,
        mainId: st.mainId,
        subId: st.subId,
        description: desc,
        price: t,
      });
      await ctx.reply(
        "Введите <b>метод оплаты</b> (например: <code>TON, USDT TRC20, СБП</code>):",
        { parse_mode: "HTML", reply_markup: kbCancel() },
      );
      return;
    }
    if (st.step === "itemPayment") {
      pendingItemBeforeDelivery.set(ctx.from.id, {
        projectKey: st.projectKey,
        mainId: st.mainId,
        subId: st.subId,
        description: st.description,
        price: st.price,
        payment: t,
      });
      awaitingOs.delete(ctx.from.id);
      const kb = new InlineKeyboard()
        .text("👤 Через менеджера", "os:it:m")
        .row()
        .text("⚡ Автовыдача (текст сейчас)", "os:it:a")
        .row()
        .text("✍ Вручную (данные при выдаче)", "os:it:h")
        .row()
        .text("❌ Отмена", CB_CANCEL);
      await ctx.reply("Выберите <b>способ выдачи</b> для этой позиции:", { parse_mode: "HTML", reply_markup: kb });
      return;
    }
    if (st.step === "itemAutoText") {
      addItem(st.projectKey, st.mainId, st.subId, {
        description: st.description,
        price: st.price,
        payment: st.payment,
        delivery: "auto",
        autoText: t,
      });
      const c = CODE_BY_PK[st.projectKey] ?? "br";
      clearWiz(ctx.from.id);
      await ctx.reply("✅ Позиция с автовыдачей сохранена.", {
        reply_markup: new InlineKeyboard().text("⬅️ К подразделу", `os:gi:${c}:${st.mainId}:${st.subId}`),
      });
      return;
    }
    if (st.step === "itemManualHint") {
      const hint = t === "-" ? undefined : t;
      addItem(st.projectKey, st.mainId, st.subId, {
        description: st.description,
        price: st.price,
        payment: st.payment,
        delivery: "manual",
        manualAdminHint: hint,
      });
      const c = CODE_BY_PK[st.projectKey] ?? "br";
      clearWiz(ctx.from.id);
      await ctx.reply("✅ Позиция (ручная выдача) сохранена.", {
        reply_markup: new InlineKeyboard().text("⬅️ К подразделу", `os:gi:${c}:${st.mainId}:${st.subId}`),
      });
      return;
    }
    return next();
  });
}
