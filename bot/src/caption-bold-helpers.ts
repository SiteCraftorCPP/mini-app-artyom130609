import type { MessageEntity } from "@grammyjs/types";

/** «Заказ #… успешно оформлен!» — жир: Заказ, #…, оформлен! */
export function boldRangesOrderOformlenInLine1(line1: string, base: number): MessageEntity[] {
  const e: MessageEntity[] = [];
  const w1 = "Заказ";
  const i1 = line1.indexOf(w1);
  if (i1 >= 0) e.push({ type: "bold", offset: base + i1, length: w1.length });
  const hash = line1.indexOf("#");
  if (hash >= 0) {
    const m = line1.slice(hash).match(/^#[^\s!]+/);
    if (m) e.push({ type: "bold", offset: base + hash, length: m[0].length });
  }
  const fin = "успешно оформлен!";
  const ifin = line1.indexOf(fin);
  if (ifin >= 0) e.push({ type: "bold", offset: base + ifin, length: fin.length });
  return e;
}

/** «Заказ #… успешно выполнен!» */
export function boldRangesOrderVypolnenInLine1(line1: string, base: number): MessageEntity[] {
  const e: MessageEntity[] = [];
  const w1 = "Заказ";
  const i1 = line1.indexOf(w1);
  if (i1 >= 0) e.push({ type: "bold", offset: base + i1, length: w1.length });
  const hash = line1.indexOf("#");
  if (hash >= 0) {
    const m = line1.slice(hash).match(/^#[^\s!]+/);
    if (m) e.push({ type: "bold", offset: base + hash, length: m[0].length });
  }
  const fin = "успешно выполнен!";
  const ifin = line1.indexOf(fin);
  if (ifin >= 0) e.push({ type: "bold", offset: base + ifin, length: fin.length });
  return e;
}

/** «Срок выдачи: …» — жир префикс. */
export function boldRangeDeliveryLabel(delivery: string, base: number): MessageEntity | null {
  const label = "Срок выдачи:";
  const i = delivery.indexOf(label);
  if (i < 0) return null;
  return { type: "bold", offset: base + i, length: label.length };
}

const REVIEW_BOLD_1 = "Напишите отзыв";
const REVIEW_BOLD_2 = "200 000";

export function boldRangesReviewLine(line3: string, base: number): MessageEntity[] {
  const e: MessageEntity[] = [];
  const i1 = line3.indexOf(REVIEW_BOLD_1);
  if (i1 >= 0) e.push({ type: "bold", offset: base + i1, length: REVIEW_BOLD_1.length });
  const i2 = line3.indexOf(REVIEW_BOLD_2);
  if (i2 >= 0) e.push({ type: "bold", offset: base + i2, length: REVIEW_BOLD_2.length });
  return e;
}

/** «Данные для входа в аккаунт:» (всё, что до \n) — в строке после emoji. */
export function boldRangeDataHeaderInLine(
  dataHeaderLine: string,
  base: number,
): MessageEntity | null {
  const label = "Данные для входа в аккаунт:";
  const i = dataHeaderLine.indexOf(label);
  if (i < 0) return null;
  return { type: "bold", offset: base + i, length: label.length };
}

/**
 * «Сервер:…», «Nick-Name:» и т.д. в блоке accountData: жир до первого «:» в каждой непустой строке.
 */
export function boldRangesAccountDataLabels(accountData: string, base: number): MessageEntity[] {
  const e: MessageEntity[] = [];
  let pos = 0;
  for (const line of accountData.split("\n")) {
    if (!line.trim()) {
      pos += line.length + 1;
      continue;
    }
    const c = line.indexOf(":");
    if (c > 0) {
      e.push({ type: "bold", offset: base + pos, length: c + 1 });
    }
    pos += line.length + 1;
  }
  return e;
}

export function sortEntities(entities: MessageEntity[]): MessageEntity[] {
  return [...entities].sort((a, b) => a.offset - b.offset);
}
