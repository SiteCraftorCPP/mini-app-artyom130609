/** Список ID из `VITE_ADMIN_TELEGRAM_IDS` (через запятую, пробел или `;`). */
export function getAdminTelegramIdSet(): Set<string> {
  const raw = String(import.meta.env.VITE_ADMIN_TELEGRAM_IDS ?? "");
  const ids = raw
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return new Set(ids);
}
