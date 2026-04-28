import type { VirtOrderNotifyKind } from "./telegram-virt-order-notify";

const LOG = "[prepare-payment]";

function resolveBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_VIRT_ORDER_NOTIFY_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "";
}

export type PaymentMethodCode = "sbp" | "mir" | "card_rub";

export type PaymentPrepareInput = {
  initData: string;
  orderKind: VirtOrderNotifyKind;
  method: PaymentMethodCode;
  amountRub: number;
  game?: string;
  server?: string;
  bankAccount?: string;
  virtAmountLabel?: string;
  transferMethod?: string;
  promoCode?: string;
  accountMode?: string;
  accountOptionLabel?: string;
  /** Для orderKind === "other_service" */
  otherService?: {
    itemId: string;
    gameId: string;
    mainId: string | null;
    mode: "auto" | "manual";
  };
};

export type PaymentPrepareResult = {
  payUrl: string;
  merchantOrderId: string;
  orderId: string;
  orderNumber: string;
};

function mapPrepareError(status: number, body: string): string {
  let code: string | undefined;
  let detail: string | undefined;
  try {
    const j = JSON.parse(body) as { error?: string; detail?: string };
    code = j?.error;
    detail = typeof j?.detail === "string" ? j.detail.trim() : undefined;
  } catch {
    /* не JSON — nginx/html */
  }
  if (code === "freekassa not configured") {
    return "На сервере не задан FREEKASSA_SECRET1 в .env у бота — попросите администратора.";
  }
  if (code === "freekassa secret2") {
    return "Для оплаты через API задайте FREEKASSA_SECRET2 в .env бота (секретное слово 2 из ЛК).";
  }
  if (code === "freekassa api key required") {
    return "На сервере нет FREEKASSA_API_KEY (или бот не видит .env: проверьте EnvironmentFile в systemd). СБП и карта RUB в FreeKassa работают только через API — без ключа ссылка на оплату не создаётся.";
  }
  if (code === "freekassa api") {
    if (detail) {
      return `FreeKassa: ${detail}`;
    }
    return "Платёжка отклонила создание заказа. Проверьте API-ключ, оба секрета и ID способов; спросите текст ошибки у админа (логи бота).";
  }
  if (code === "freekassa merchant id") {
    return "Неверный FREEKASSA_MERCHANT_ID на сервере.";
  }
  if (code === "no bot token") {
    return "Сервер бота без TELEGRAM_BOT_TOKEN — настройка на стороне хоста.";
  }
  if (code === "bad initData") {
    return "Сессия Telegram недействительна. Закройте магазин и откройте снова из бота.";
  }
  if (code === "initData") {
    return "Нет данных Telegram. Откройте магазин из кнопки в боте, не из браузера.";
  }
  if (code === "amount" || code === "method" || code === "orderKind") {
    return "Проверьте сумму и данные формы, затем снова нажмите «Оплатить».";
  }
  if (code === "server") {
    return "Сервер не смог создать оплату. Попробуйте позже или напишите в поддержку.";
  }
  if (status === 404) {
    return "Запрос не дошёл до бота. Проверьте: nginx проксирует /notify/ на порт с ботом (как /notify/virt-order-webapp).";
  }
  if (status === 502 || status === 504) {
    return "Шлюз не отвечает. Повторите позже.";
  }
  if (status === 503) {
    return "Оплата временно недоступна (сервер: нет настроек FreeKassa или бота).";
  }
  if (status === 401) {
    return "Сессия устарела. Закройте мини-апп и откройте снова из бота.";
  }
  if (body && (body.includes("<!DOCTYPE") || body.includes("<html"))) {
    return "Сервер отдал страницу вместо API: для HTTPS нужен nginx — location /notify/ → 127.0.0.1:8788 (см. deploy/nginx/notify.conf), блок выше try_files /index.html.";
  }
  return `Ошибка оплаты (код ${status}). Попробуйте снова или напишите в поддержку.`;
}

/**
 * FreeKassa: URL оплаты. Уведомление в бот — только после /notify/freekassa (сервер).
 */
export async function requestPaymentPrepare(
  body: PaymentPrepareInput,
): Promise<PaymentPrepareResult> {
  const base = resolveBaseUrl();
  if (!base) {
    throw new Error("Нет адреса API. Проверьте VITE_VIRT_ORDER_NOTIFY_URL при сборке.");
  }
  let r: Response;
  try {
    r = await fetch(`${base}/notify/payment/prepare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(LOG, "network", msg);
    if (msg === "Failed to fetch" || msg.includes("NetworkError")) {
      throw new Error(
        "Сеть: не удалось связаться с сервером оплаты. Проверьте интернет и откройте магазин из Telegram ещё раз.",
      );
    }
    throw new Error("Не удалось запросить оплату. Повторите попытку.");
  }
  const text = await r.text().catch(() => "");
  if (!r.ok) {
    const errMsg = mapPrepareError(r.status, text);
    console.error(LOG, r.status, text.slice(0, 200));
    throw new Error(errMsg);
  }
  let j: PaymentPrepareResult & { error?: string };
  try {
    j = JSON.parse(text) as PaymentPrepareResult & { error?: string };
  } catch {
    throw new Error("Сервер вернул неверный ответ. Повторите попытку.");
  }
  if (!j?.payUrl || !j?.orderNumber) {
    throw new Error("Сервер не прислал ссылку на оплату. Повторите попытку.");
  }
  return {
    payUrl: j.payUrl,
    merchantOrderId: j.merchantOrderId,
    orderId: j.orderId,
    orderNumber: j.orderNumber,
  };
}

type TgOpenLink = (
  u: string,
  o?: { try_instant_view?: boolean; try_browser?: "chrome" | "firefox" | "mozilla" | "opera" | "safari" | "wvb" }
) => void;

/**
 * Открывает внешнюю ссылку оплаты. После `await fetch` в Mini App `openLink` иногда молчит — перебираем варианты.
 * @returns true, если сработал хотя бы один способ
 */
export function openPaymentUrl(payUrl: string): boolean {
  const url = payUrl.trim();
  if (!/^https?:\/\//i.test(url)) {
    console.error(LOG, "invalid payUrl scheme");
    return false;
  }

  const w = window as unknown as {
    Telegram?: { WebApp?: { openLink: TgOpenLink; version?: string } };
  };
  const o = w.Telegram?.WebApp?.openLink;

  if (typeof o === "function") {
    try {
      o.call(w.Telegram?.WebApp, url, { try_instant_view: false });
      return true;
    } catch (e) {
      console.warn(LOG, "openLink threw", e);
    }
    try {
      o.call(w.Telegram?.WebApp, url, { try_instant_view: false, try_browser: "chrome" });
      return true;
    } catch (e) {
      console.warn(LOG, "openLink+try_browser threw", e);
    }
  }

  try {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.style.setProperty("position", "fixed");
    a.style.setProperty("left", "0");
    a.style.setProperty("top", "0");
    a.style.setProperty("opacity", "0");
    a.style.setProperty("pointer-events", "none");
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  } catch (e) {
    console.warn(LOG, "anchor click", e);
  }

  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (opened) {
    return true;
  }

  try {
    window.location.assign(url);
    return true;
  } catch (e) {
    console.error(LOG, "location.assign", e);
  }
  return false;
}
