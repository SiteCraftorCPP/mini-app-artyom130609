import { type UseQueryResult, useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/api/constants/queryKeys";
import { TIMING } from "@/shared/constants/timing";
import { useIsTelegramAdmin } from "@/shared/hooks/use-is-telegram-admin";
import {
  ACCOUNT_ADMIN_CURRENT_ORDERS_MOCK,
  ACCOUNT_CURRENT_ORDERS_MOCK,
} from "@/shared/mock/account-orders";

import type { Order } from "../model";

type UseGetOrdersParams = {
  enabled?: boolean;
};

export const useGetOrders = ({
  enabled = true,
}: UseGetOrdersParams = {}): UseQueryResult<Order[], Error> => {
  const isAdmin = useIsTelegramAdmin();
  return useQuery<Order[], Error>({
    queryKey: [QUERY_KEYS.ORDERS.CURRENT, isAdmin],
    queryFn: async () => {
      return await new Promise<Order[]>((resolve) => {
        setTimeout(() => {
          resolve(
            isAdmin ? ACCOUNT_ADMIN_CURRENT_ORDERS_MOCK : ACCOUNT_CURRENT_ORDERS_MOCK,
          );
        }, TIMING.mockDelayMs);
      });
    },
    enabled,
    staleTime: TIMING.cacheTimeMs,
  });
};
