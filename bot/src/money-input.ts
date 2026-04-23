/**
 * Разбор суммы в RUB из текста, который пришёл из Telegram
 * (пробелы, неразрывные пробелы, запятая, полноширинные цифры).
 */
const INVIS_SPACE = /[\s\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff\u200b-\u200d]/g;

function normalizeAsciiDigits(s: string): string {
  return s.replace(/[\uFF10-\uFF19]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xff10 + 0x30),
  );
}

/**
 * Возвращает неотрицательное конечное число или null.
 */
export function parseRublesAmountFromUserText(raw: string): number | null {
  if (raw == null) {
    return null;
  }
  let t = normalizeAsciiDigits(String(raw).trim());
  t = t.replace(INVIS_SPACE, "");
  t = t.replace(/,/g, ".");
  t = t.trim();
  if (t === "" || t === ".") {
    return null;
  }
  if (/^\d+(\.\d+)?$/.test(t)) {
    const n = Number(t);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }
  const m = t.match(/\d+(\.\d+)?/);
  if (m) {
    const n = Number(m[0]);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }
  return null;
}
