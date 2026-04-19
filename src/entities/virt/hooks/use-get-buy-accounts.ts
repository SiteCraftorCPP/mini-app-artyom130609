import { type UseQueryResult, useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/api/constants/queryKeys";
import { TIMING } from "@/shared/constants/timing";
import { BUY_ACCOUNTS_MOCK } from "@/shared/mock/buy-accounts.mock";

import { type Virt } from "../model";

type UseGetBuyAccountsParams = {
  enabled?: boolean;
};

export const useGetBuyAccounts = ({
  enabled = true,
}: UseGetBuyAccountsParams = {}): UseQueryResult<Virt[], Error> => {
  return useQuery<Virt[], Error>({
    queryKey: [QUERY_KEYS.VIRTS.BUY_ACCOUNTS],
    queryFn: async () => {
      return await new Promise<Virt[]>((resolve) => {
        setTimeout(() => {
          resolve(BUY_ACCOUNTS_MOCK);
        }, TIMING.mockDelayMs);
      });
    },
    enabled,
    staleTime: TIMING.cacheTimeMs,
  });
};
