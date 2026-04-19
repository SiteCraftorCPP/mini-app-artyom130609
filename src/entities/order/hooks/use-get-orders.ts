import { type UseQueryResult, useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/api/constants/queryKeys";
import { TIMING } from "@/shared/constants/timing";
import { ACCOUNT_CURRENT_ORDERS_MOCK } from "@/shared/mock/account-orders";

import type { Order } from "../model";

type UseGetOrdersParams = {
  enabled?: boolean;
};

export const useGetOrders = ({
  enabled = true,
}: UseGetOrdersParams = {}): UseQueryResult<Order[], Error> => {
  return useQuery<Order[], Error>({
    queryKey: [QUERY_KEYS.ORDERS.CURRENT],
    queryFn: async () => {
      return await new Promise<Order[]>((resolve) => {
        setTimeout(() => {
          resolve(ACCOUNT_CURRENT_ORDERS_MOCK);
        }, TIMING.mockDelayMs);
      });
    },
    enabled,
    staleTime: TIMING.cacheTimeMs,
  });
};
