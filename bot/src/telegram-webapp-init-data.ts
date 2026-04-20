import { parse, validate } from "@telegram-apps/init-data-node";

/**
 * Проверка initData мини-аппа (библиотека совпадает с документацией Telegram).
 * expiresIn: 0 — не отклонять старый auth_date (иначе фоновая вкладка могла давать истёкшие данные).
 */
export function getTelegramUserIdFromWebAppInitData(
  initData: string,
  botToken: string,
): number | null {
  try {
    validate(initData, botToken, { expiresIn: 0 });
  } catch (e) {
    console.warn("[virt-order] initData: validate не прошла", e);
    return null;
  }
  try {
    const data = parse(initData);
    const id = data.user?.id;
    return typeof id === "number" ? id : null;
  } catch (e) {
    console.warn("[virt-order] initData: parse", e);
    return null;
  }
}
