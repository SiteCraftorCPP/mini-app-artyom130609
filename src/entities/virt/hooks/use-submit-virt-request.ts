import { useMutation } from "@tanstack/react-query";

import { TIMING } from "@/shared/constants/timing";

export type SubmitVirtRequestPayload = {
  accountNumber: string;
  amountRub: number;
  amountVirts: number;
  id: string;
  promoCode: string;
  server: string;
};

/** После интеграции API подставьте реальные id/номер из ответа бэкенда. */
export type SubmitVirtRequestResult = SubmitVirtRequestPayload & {
  orderId: string;
  orderNumber: string;
};

export const useSubmitVirtRequest = () => {
  return useMutation({
    mutationFn: async (payload: SubmitVirtRequestPayload) => {
      return await new Promise<SubmitVirtRequestResult>((resolve) => {
        setTimeout(() => {
          resolve({
            ...payload,
            /** Совпадает с моком актуальных заказов — кнопка в боте откроет этот заказ */
            orderId: "current-1",
            orderNumber: `#${Date.now().toString(36).toUpperCase().slice(-6)}`,
          });
        }, TIMING.submitDelayMs);
      });
    },
  });
};
