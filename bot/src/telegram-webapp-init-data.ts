import { parse, validate } from "@telegram-apps/init-data-node";

export type ValidatedWebAppUser = {
  id: number;
  username: string | null;
  firstName: string | null;
};

/**
 * Проверка initData и извлечение пользователя (id, username, имя).
 * expiresIn: 0 — не отклонять старый auth_date.
 */
export function parseValidatedWebAppUser(
  initData: string,
  botToken: string,
): ValidatedWebAppUser | null {
  try {
    validate(initData, botToken, { expiresIn: 0 });
  } catch (e) {
    console.warn("[virt-order] initData: validate не прошла", e);
    return null;
  }
  try {
    const data = parse(initData);
    const u = data.user;
    if (!u || typeof u.id !== "number") {
      return null;
    }
    const username =
      typeof u.username === "string" && u.username.trim() !== ""
        ? u.username.trim()
        : null;
    const firstName =
      typeof u.first_name === "string" && u.first_name.trim() !== ""
        ? u.first_name.trim()
        : null;
    return { id: u.id, username, firstName };
  } catch (e) {
    console.warn("[virt-order] initData: parse", e);
    return null;
  }
}

export function getTelegramUserIdFromWebAppInitData(
  initData: string,
  botToken: string,
): number | null {
  return parseValidatedWebAppUser(initData, botToken)?.id ?? null;
}
