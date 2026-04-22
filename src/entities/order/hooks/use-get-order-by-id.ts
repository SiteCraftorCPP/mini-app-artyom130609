import { type UseQueryResult, useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/api/constants/queryKeys";
import { TIMING } from "@/shared/constants/timing";
import { useIsTelegramAdmin } from "@/shared/hooks/use-is-telegram-admin";
import {
  ACCOUNT_ADMIN_CURRENT_ORDERS_MOCK,
  ACCOUNT_CURRENT_ORDERS_MOCK,
  ACCOUNT_ORDER_HISTORY_MOCK,
} from "@/shared/mock/account-orders";

import type { Order } from "../model";

type UseGetOrderByIdParams = {
  enabled?: boolean;
  id: string | null;
};

/** Текущие (в т.ч. админ-очередь) + история; админ-заказы видны только при доступе. */
export const useGetOrderById = ({
  enabled = true,
  id,
}: UseGetOrderByIdParams): UseQueryResult<Order | null, Error> => {
  const isAdmin = useIsTelegramAdmin();
  return useQuery<Order | null, Error>({
    queryKey: [QUERY_KEYS.ORDERS.BY_ID, id, isAdmin],
    queryFn: async () => {
      if (!id) {
        return null;
      }
      const fromAdmin = ACCOUNT_ADMIN_CURRENT_ORDERS_MOCK.find((o) => o.id === id);
      if (fromAdmin) {
        return isAdmin ? fromAdmin : null;
      }
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
