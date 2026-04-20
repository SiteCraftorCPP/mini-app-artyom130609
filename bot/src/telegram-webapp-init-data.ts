import { createHmac } from "node:crypto";

/**
 * Проверка initData мини-аппа (https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app).
 * Возвращает telegram user id или null.
 */
export function getTelegramUserIdFromWebAppInitData(
  initData: string,
  botToken: string,
): number | null {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) {
      return null;
    }
    params.delete("hash");
    const pairs = Array.from(params.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    const dataCheckString = pairs.map(([k, v]) => `${k}=${v}`).join("\n");
    const secretKey = createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();
    const computed = createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");
    if (computed !== hash) {
      console.warn("[virt-order] initData: неверная подпись hash");
      return null;
    }
    const userRaw = params.get("user");
    if (!userRaw) {
      return null;
    }
    const user = JSON.parse(userRaw) as { id?: number };
    return typeof user.id === "number" ? user.id : null;
  } catch (e) {
    console.warn("[virt-order] initData: ошибка разбора", e);
    return null;
  }
}
