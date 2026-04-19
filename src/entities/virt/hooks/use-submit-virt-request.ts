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

export const useSubmitVirtRequest = () => {
  return useMutation({
    mutationFn: async (payload: SubmitVirtRequestPayload) => {
      return await new Promise<SubmitVirtRequestPayload>((resolve) => {
        setTimeout(() => {
          resolve(payload);
        }, TIMING.submitDelayMs);
      });
    },
  });
};
