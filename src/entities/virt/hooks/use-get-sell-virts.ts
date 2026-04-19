import { type UseQueryResult, useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/api/constants/queryKeys";

import { TIMING } from "@/shared/constants/timing";
import { SELL_VIRTS_MOCK } from "@/shared/mock/sell-virts.mock";

import { type Virt } from "../model";

type UseGetSellVirtsParams = {
  enabled?: boolean;
};

export const useGetSellVirts = ({
  enabled = true,
}: UseGetSellVirtsParams = {}): UseQueryResult<Virt[], Error> => {
  return useQuery<Virt[], Error>({
    queryKey: [QUERY_KEYS.VIRTS.SELL],
    queryFn: async () => {
      return await new Promise<Virt[]>((resolve) => {
        setTimeout(() => {
          resolve(SELL_VIRTS_MOCK);
        }, TIMING.mockDelayMs);
      });
    },
    enabled,
    staleTime: TIMING.cacheTimeMs,
  });
};
