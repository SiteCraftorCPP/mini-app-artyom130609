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

export const useSubmitBuyAccountRequest = () => {
  return useMutation({
    mutationFn: async (payload: SubmitBuyAccountRequestPayload) => {
      return await new Promise<SubmitBuyAccountRequestPayload>((resolve) => {
        setTimeout(() => {
          resolve(payload);
        }, TIMING.submitDelayMs);
      });
    },
  });
};
