/**
 * Уведомление бота после «успешной» заявки: POST на /notify/virt-order-webapp с initData.
 * WebApp.sendData в Telegram часто недоступен для мини-аппа с inline-кнопки — поэтому HTTP + проверка подписи на боте.
 */
const LOG = "[virt-order]";

function resolveNotifyUrl(): string {
  const fromEnv = import.meta.env.VITE_VIRT_ORDER_NOTIFY_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/notify/virt-order-webapp`;
  }
  return "";
}

export async function notifyVirtOrderSuccessFromMiniApp(
  webApp: { initData?: string } | null | undefined,
): Promise<void> {
  const initData = webApp?.initData;
  if (!initData) {
    console.warn(
      LOG,
      "нет initData — уведомление в бот по HTTP не отправить (откройте из Telegram)",
    );
    return;
  }

  const url = resolveNotifyUrl();
  if (!url) {
    console.warn(LOG, "не удалось определить URL уведомления");
    return;
  }

  const orderId = crypto.randomUUID();
  const orderNumber = `#${Date.now().toString(36).toUpperCase().slice(-6)}`;

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData, orderId, orderNumber }),
    });
    const text = await r.text().catch(() => "");
    if (!r.ok) {
      console.error(LOG, "HTTP notify ошибка", r.status, text);
    } else {
      console.info(LOG, "HTTP notify ok", r.status, text);
    }
  } catch (e) {
    console.error(LOG, "HTTP notify fetch", e);
  }
}
