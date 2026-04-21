/**
 * Кнопка «Продать» в мини-аппе: POST /notify/sell-virt-webapp с initData.
 * Бот проверяет подпись и шлёт фото+текст в личку — без открытия t.me и цепочки WebView→браузер.
 */
const LOG = "[sell-virt]";

function resolveNotifyUrl(): string {
  const fromEnv = import.meta.env.VITE_SELL_VIRT_NOTIFY_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/notify/sell-virt-webapp`;
  }
  return "";
}

type WebAppLike = { initData?: string };

function resolveInitData(webApp: WebAppLike | null | undefined): string {
  const fromHook = webApp?.initData?.trim();
  if (fromHook) {
    return fromHook;
  }
  if (typeof window !== "undefined") {
    const tg = (
      window as unknown as {
        Telegram?: { WebApp?: { initData?: string } };
      }
    ).Telegram?.WebApp;
    const raw = tg?.initData?.trim();
    if (raw) {
      return raw;
    }
  }
  return "";
}

/** true если бот принял запрос и отправил сообщение пользователю */
export async function notifySellVirtFromMiniApp(
  webApp: WebAppLike | null | undefined,
): Promise<boolean> {
  const initData = resolveInitData(webApp);
  if (!initData) {
    console.warn(
      LOG,
      "нет initData — откройте из Telegram или будет запасной переход по ссылке",
    );
    return false;
  }

  const url = resolveNotifyUrl();
  if (!url) {
    console.warn(LOG, "не удалось определить URL уведомления");
    return false;
  }

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData }),
    });
    const text = await r.text().catch(() => "");
    if (!r.ok) {
      console.error(LOG, "HTTP notify ошибка", r.status, text);
      return false;
    }
    console.info(LOG, "HTTP notify ok", r.status, text);
    return true;
  } catch (e) {
    console.error(LOG, "HTTP notify fetch", e);
    return false;
  }
}
