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

export type VirtOrderNotifyKind = "virt" | "account";

export type VirtOrderNotifyDetails = {
  /** Название игры/услуги (карточка в мини-аппе) */
  game?: string;
  server?: string;
  /** Номер счёта / реквизит */
  bankAccount?: string;
  /** Сумма в рублях */
  amountRub?: number;
  /** Сумма в виртах — строка для отображения в боте */
  virtAmountLabel?: string;
  /** Как доставка / вариант (напр. «По уровню: …») */
  transferMethod?: string;
  /** Промокод, если был применён */
  promoCode?: string;
};

export async function notifyVirtOrderSuccessFromMiniApp(
  webApp: WebAppLike | null | undefined,
  options?: {
    orderId: string;
    orderKind?: VirtOrderNotifyKind;
    orderNumber: string;
  } & VirtOrderNotifyDetails,
): Promise<void> {
  const initData = resolveInitData(webApp);
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

  if (!options?.orderId?.trim() || !options?.orderNumber?.trim()) {
    console.warn(
      LOG,
      "нет orderId/orderNumber — уведомление не отправляем (нужны после успешной заявки)",
    );
    return;
  }

  const orderId = options.orderId.trim();
  const orderNumber = options.orderNumber.trim();
  const orderKind = options.orderKind ?? "virt";

  const {
    game,
    server,
    bankAccount,
    amountRub,
    virtAmountLabel,
    transferMethod,
    promoCode,
  } = options;

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        initData,
        orderId,
        orderNumber,
        orderKind,
        ...(game != null && game !== "" ? { game } : {}),
        ...(server != null && server !== "" ? { server } : {}),
        ...(bankAccount != null && bankAccount !== ""
          ? { bankAccount }
          : {}),
        ...(typeof amountRub === "number" && Number.isFinite(amountRub)
          ? { amountRub }
          : {}),
        ...(virtAmountLabel != null && virtAmountLabel !== ""
          ? { virtAmountLabel }
          : {}),
        ...(transferMethod != null && transferMethod !== ""
          ? { transferMethod }
          : {}),
        ...(promoCode != null && promoCode !== ""
          ? { promoCode }
          : {}),
      }),
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
