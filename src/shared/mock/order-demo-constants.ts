/**
 * Пулы ник / id (как в реальных уведомлениях). История/50 заказов — мок до API, но такие же поля, что в проде.
 * Синхронно с bot/src/order-demo-constants.ts (копия для сборки бота).
 */
const ORDER_REF_ALPHABET = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export const DEMO_ORDER_BUYERS: ReadonlyArray<{
  telegramUsername: string;
  telegramUserId: string;
}> = [
  { telegramUsername: "artem22481", telegramUserId: "1944803821" },
  { telegramUsername: "buyer_demo", telegramUserId: "500000001" },
  { telegramUsername: "closed_demo", telegramUserId: "600000001" },
  { telegramUsername: "artshopvirts_man", telegramUserId: "7600749840" },
  { telegramUsername: "maksimrp42", telegramUserId: "5188234401" },
  { telegramUsername: "dima_velvet", telegramUserId: "6129034412" },
  { telegramUsername: "kira_msk", telegramUserId: "4290117722" },
  { telegramUsername: "shadow_br", telegramUserId: "9001122334" },
];

/** Стабильный 8-симв. номер заказа (как 72NN9IPP) по индексу. */
export function demoOrderPublicId(index: number): string {
  const seed = (index + 1) * 1_000_003 + 917_273;
  let n = Math.abs(seed) % 1_000_000_000;
  let s = "";
  for (let k = 0; k < 8; k++) {
    s += ORDER_REF_ALPHABET[n % ORDER_REF_ALPHABET.length]!;
    n = Math.floor(n / 36) + index * 17 + k;
  }
  return s;
}

export function demoBuyerAt(index: number) {
  return DEMO_ORDER_BUYERS[index % DEMO_ORDER_BUYERS.length]!;
}
