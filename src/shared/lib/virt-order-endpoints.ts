/**
 * База URL для HTTP-эндпоинтов, которые у nginx проксируются на бота
 * (как /notify/virt-order-webapp). Должна совпадать с resolveNotifyUrl в
 * `telegram-virt-order-notify` — иначе список промокодов не подтянется.
 */
export function resolveVirtOrderHttpBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_VIRT_ORDER_NOTIFY_URL?.trim();
  if (fromEnv) {
    return fromEnv
      .replace(/\/$/, "")
      .replace(/\/notify\/virt-order-webapp$/, "");
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "";
}

export function resolvePromoCodesListUrl(): string {
  const base = resolveVirtOrderHttpBaseUrl();
  if (!base) {
    return "";
  }
  return `${base}/api/promo-codes`;
}
