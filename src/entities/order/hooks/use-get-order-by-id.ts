import { type UseQueryResult, useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/api/constants/queryKeys";
import { TIMING } from "@/shared/constants/timing";
import {
  ACCOUNT_CURRENT_ORDERS_MOCK,
  ACCOUNT_ORDER_HISTORY_MOCK,
} from "@/shared/mock/account-orders";

import type { Order } from "../model";

type UseGetOrderByIdParams = {
  enabled?: boolean;
  id: string | null;
};

/** Текущие заказы + история (для deep link из бота по orderId). */
export const useGetOrderById = ({
  enabled = true,
  id,
}: UseGetOrderByIdParams): UseQueryResult<Order | null, Error> => {
  return useQuery<Order | null, Error>({
    queryKey: [QUERY_KEYS.ORDERS.BY_ID, id],
    queryFn: async () => {
      return (
        ACCOUNT_CURRENT_ORDERS_MOCK.find((o) => o.id === id) ??
        ACCOUNT_ORDER_HISTORY_MOCK.find((o) => o.id === id) ??
        null
      );
    },
    enabled: enabled && Boolean(id),
    staleTime: TIMING.cacheTimeMs,
  });
};
