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
          const suffix = Date.now().toString(36).toUpperCase().slice(-6);
          resolve({
            ...payload,
            orderId: `o-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
            orderNumber: `#${suffix}`,
          });
        }, TIMING.submitDelayMs);
      });
    },
  });
};
