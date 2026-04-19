import { type UseQueryResult, useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/api/constants/queryKeys";

import { TIMING } from "@/shared/constants/timing";
import { BUY_VIRTS_MOCK } from "@/shared/mock/buy-virts.mock";

import { type Virt } from "../model";

type UseGetBuyVirtsParams = {
  enabled?: boolean;
};

export const useGetBuyVirts = ({
  enabled = true,
}: UseGetBuyVirtsParams = {}): UseQueryResult<Virt[], Error> => {
  return useQuery<Virt[], Error>({
    queryKey: [QUERY_KEYS.VIRTS.BUY],
    queryFn: async () => {
      return await new Promise<Virt[]>((resolve) => {
        setTimeout(() => {
          resolve(BUY_VIRTS_MOCK);
        }, TIMING.mockDelayMs);
      });
    },
    enabled,
    staleTime: TIMING.cacheTimeMs,
  });
};
