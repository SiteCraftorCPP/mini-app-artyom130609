import { type UseQueryResult, useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/api/constants/queryKeys";
import { TIMING } from "@/shared/constants/timing";
import { ACCOUNT_ORDER_HISTORY_MOCK } from "@/shared/mock/account-orders";

import type { Order } from "../model";

type UseGetHistoryOrderByIdParams = {
  enabled?: boolean;
  id: string | null;
};

export const useGetHistoryOrderById = ({
  enabled = true,
  id,
}: UseGetHistoryOrderByIdParams): UseQueryResult<Order | null, Error> => {
  return useQuery<Order | null, Error>({
    queryKey: [QUERY_KEYS.ORDERS.HISTORY_DETAIL, id],
    queryFn: async () => {
      return await new Promise<Order | null>((resolve) => {
        setTimeout(() => {
          resolve(ACCOUNT_ORDER_HISTORY_MOCK.find((order) => order.id === id) ?? null);
        }, TIMING.mockDelayMs);
      });
    },
    enabled: enabled && Boolean(id),
    staleTime: TIMING.cacheTimeMs,
  });
};
