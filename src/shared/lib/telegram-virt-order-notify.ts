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

export function trySendVirtOrderSuccessToBot(
  webApp: WebAppWithSendData | null | undefined,
): boolean {
  if (!webApp?.sendData) {
    return false;
  }
  if (!webApp.initDataUnsafe?.user?.id) {
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
    return false;
  }
  webApp.sendData(str);
  return true;
}
