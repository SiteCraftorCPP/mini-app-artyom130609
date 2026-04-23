import { type UseQueryResult, useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/api/constants/queryKeys";
import { TIMING } from "@/shared/constants/timing";
import { useIsTelegramAdmin } from "@/shared/hooks/use-is-telegram-admin";
import {
  ACCOUNT_ADMIN_HISTORY_50_MOCK,
  ACCOUNT_ORDER_HISTORY_MOCK,
} from "@/shared/mock/account-orders";

import type { Order } from "../model";

type UseGetHistoryOrdersParams = {
  enabled?: boolean;
};

export const useGetHistoryOrders = ({
  enabled = true,
}: UseGetHistoryOrdersParams = {}): UseQueryResult<Order[], Error> => {
  const isAdmin = useIsTelegramAdmin();
  return useQuery<Order[], Error>({
    queryKey: [QUERY_KEYS.ORDERS.HISTORY, isAdmin],
    queryFn: async () => {
      return await new Promise<Order[]>((resolve) => {
        setTimeout(() => {
          resolve(
            isAdmin
              ? [...ACCOUNT_ADMIN_HISTORY_50_MOCK]
              : [...ACCOUNT_ORDER_HISTORY_MOCK],
          );
        }, TIMING.mockDelayMs);
      });
    },
    enabled,
    staleTime: TIMING.cacheTimeMs,
  });
};
