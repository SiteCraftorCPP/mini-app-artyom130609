import { useMutation } from "@tanstack/react-query";

import { TIMING } from "@/shared/constants/timing";

import { type AccountPurchaseOption } from "../model";

export type BuyAccountPurchaseMode = "level" | "virts";

export type SubmitBuyAccountRequestPayload = {
  amountRub: number;
  id: string;
  mode: BuyAccountPurchaseMode;
  option: AccountPurchaseOption;
  server: string;
};

export type SubmitBuyAccountRequestResult = SubmitBuyAccountRequestPayload & {
  orderId: string;
  orderNumber: string;
};

export const useSubmitBuyAccountRequest = () => {
  return useMutation({
    mutationFn: async (payload: SubmitBuyAccountRequestPayload) => {
      return await new Promise<SubmitBuyAccountRequestResult>((resolve) => {
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
