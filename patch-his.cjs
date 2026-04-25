const fs = require('fs');

let code = fs.readFileSync('bot/src/admin.ts', 'utf-8');

// Replace buildSuppliesHistoryText
const oldBuildSuppliesHistoryText = `function buildSuppliesHistoryText(closed: SupplyRow[]): string {
  if (closed.length === 0) {
    return ["📜 История поставок", "", "Пока пусто."].join("\\n");
  }
  return [
    "📜 История поставок",
    "",
    "Нажмите поставку, чтобы открыть.",
  ].join("\\n");
}`;

const newBuildSuppliesHistoryText = `function buildSuppliesHistoryText(closed: SupplyRow[], page: number = 0): string {
  if (closed.length === 0) {
    return ["📜 История поставок", "", "Пока пусто."].join("\\n");
  }
  const perPage = 3;
  const sorted = closed.slice().sort((a, b) => (b.closedAtMs ?? 0) - (a.closedAtMs ?? 0));
  const totalPages = Math.ceil(sorted.length / perPage) || 1;
  const pageItems = sorted.slice(page * perPage, (page + 1) * perPage);

  const lines = [\`📜 История поставок (Стр. \${page + 1} / \${totalPages})\`, ""];
  for (const s of pageItems) {
    lines.push(\`📦 Поставка ID: \${s.id.slice(-6)}\`);
    lines.push(\`Проект: \${s.project}\`);
    lines.push(\`Сервер: \${s.server}\`);
    lines.push(\`Вирты: \${s.virtAmount}\`);
    lines.push(\`🕒 Открыта: \${formatDateTime(s.openedAtMs)}\`);
    if (s.closedAtMs) {
      lines.push(\`🕐 Закрыта: \${formatDateTime(s.closedAtMs)}\`);
    }
    if (typeof s.turnoverRub === "number") {
      lines.push(\`💵 Оборот: \${s.turnoverRub.toFixed(2)} RUB\`);
    }
    if (typeof s.profitRub === "number") {
      lines.push(\`💰 Чистая прибыль: \${s.profitRub.toFixed(2)} RUB\`);
    }
    lines.push("——-");
  }
  return lines.join("\\n");
}`;
code = code.replace(oldBuildSuppliesHistoryText, newBuildSuppliesHistoryText);

// Replace buildSuppliesHistoryKeyboard
const oldBuildSuppliesHistoryKeyboard = `function buildSuppliesHistoryKeyboard(closed: SupplyRow[]) {
  const kb = new InlineKeyboard();
  const shown = closed
    .slice()
    .sort((a, b) => (b.closedAtMs ?? 0) - (a.closedAtMs ?? 0))
    .slice(0, 50);
  for (const s of shown) {
    const d = \`sup:h:\${s.id}\`;
    assertCbData(d);
    kb.text(\`Поставка • \${formatDateTime(s.openedAtMs)}\`, d).row();
  }
  assertCbData(CB.supplies);
  kb.text(BTN_SUPPLIES_BACK, CB.supplies).row();
  kb.text(BTN_BACK_TO_ADMIN, CB.menu);
  return kb;
}`;

const newBuildSuppliesHistoryKeyboard = `function buildSuppliesHistoryKeyboard(closed: SupplyRow[], page: number = 0) {
  const kb = new InlineKeyboard();
  const perPage = 3;
  const totalPages = Math.ceil(closed.length / perPage) || 1;
  
  if (page > 0) kb.text("⬅️", \`sup:his:\${page - 1}\`);
  if (page < totalPages - 1) kb.text("➡️", \`sup:his:\${page + 1}\`);
  if (totalPages > 1) kb.row();

  assertCbData(CB.supplies);
  kb.text(BTN_SUPPLIES_BACK, CB.supplies).row();
  kb.text(BTN_BACK_TO_ADMIN, CB.menu);
  return kb;
}`;
code = code.replace(oldBuildSuppliesHistoryKeyboard, newBuildSuppliesHistoryKeyboard);

// Replace bot.callbackQuery("sup:his" ...
const oldSupHisHandler = `  bot.callbackQuery("sup:his", async (ctx) => {
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
  });`;

const newSupHisHandler = `  bot.callbackQuery(/^sup:his(?::(\\d+))?$/, async (ctx) => {
    const a = await requireAdmin(ctx);
    if (a == null) return;
    if (ctx.from) {
      clearAwaitingSupplyCreate(ctx.from.id);
      clearAwaitingSupplyClose(ctx.from.id);
    }
    await ctx.answerCallbackQuery();
    const page = parseInt(ctx.match[1] || "0", 10);
    const closed = listClosedSupplies();
    const text = buildSuppliesHistoryText(closed, page);
    const kb = buildSuppliesHistoryKeyboard(closed, page);
    try {
      await a.editMessageText(text, { reply_markup: kb });
    } catch {
      await a.reply(text, { reply_markup: kb });
    }
  });`;
code = code.replace(oldSupHisHandler, newSupHisHandler);

fs.writeFileSync('bot/src/admin.ts', code, 'utf-8');
console.log('patched admin.ts');