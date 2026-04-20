/**
 * Уведомление бота о «успешной заявке» через Telegram WebApp.sendData.
 * Данные приходят в тот бот, с которого открыт мини-апп (без отдельного HTTP и секрета).
 * См. обработчик в bot/src/index.ts.
 */
export type VirtOrderSuccessSendDataPayload = {
  v: 1;
  t: "virt_order_success";
  orderId: string;
  orderNumber: string;
};

type WebAppWithSendData = {
  sendData: (data: string) => void;
  initDataUnsafe?: { user?: { id: number } };
};

const LOG = "[virt-order]";

export function trySendVirtOrderSuccessToBot(
  webApp: WebAppWithSendData | null | undefined,
): boolean {
  if (!webApp?.sendData) {
    console.warn(
      LOG,
      "sendData недоступен — уведомление в бот не уйдёт (откройте мини-апп из Telegram, не из браузера)",
    );
    return false;
  }
  const userId = webApp.initDataUnsafe?.user?.id;
  if (!userId) {
    console.warn(
      LOG,
      "нет initDataUnsafe.user.id — данные пользователя не переданы WebApp, уведомление не отправится",
    );
    return false;
  }

  const orderId = crypto.randomUUID();
  const orderNumber = `#${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const payload: VirtOrderSuccessSendDataPayload = {
    v: 1,
    t: "virt_order_success",
    orderId,
    orderNumber,
  };
  const str = JSON.stringify(payload);
  if (str.length > 4096) {
    console.error(LOG, "payload слишком длинный для sendData");
    return false;
  }
  console.info(LOG, "sendData → бот", {
    telegramUserId: userId,
    orderId,
    orderNumber,
  });
  try {
    webApp.sendData(str);
  } catch (e) {
    console.error(LOG, "sendData выбросил ошибку", e);
    return false;
  }
  return true;
}
