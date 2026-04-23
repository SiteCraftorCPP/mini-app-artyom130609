import { type UseQueryResult, useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/api/constants/queryKeys";
import { TIMING } from "@/shared/constants/timing";
import { useIsTelegramAdmin } from "@/shared/hooks/use-is-telegram-admin";
import {
  ACCOUNT_ADMIN_CURRENT_ORDERS_MOCK,
  ACCOUNT_ADMIN_HISTORY_50_MOCK,
  ACCOUNT_ADMIN_ORDER_ARCHIVE_MOCK,
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
      const normalized = id.trim().replace(/^#+/, "");
      const fromAdmin = ACCOUNT_ADMIN_CURRENT_ORDERS_MOCK.find(
        (o) => o.id === normalized,
      );
      if (fromAdmin) {
        return isAdmin ? fromAdmin : null;
      }
      const fromAdminArchive = ACCOUNT_ADMIN_ORDER_ARCHIVE_MOCK.find(
        (o) => o.id === normalized,
      );
      if (fromAdminArchive) {
        return isAdmin ? fromAdminArchive : null;
      }
      const fromAdminHistory50 = ACCOUNT_ADMIN_HISTORY_50_MOCK.find(
        (o) => o.id === normalized,
      );
      if (fromAdminHistory50) {
        return isAdmin ? fromAdminHistory50 : null;
      }
      return (
        ACCOUNT_CURRENT_ORDERS_MOCK.find((o) => o.id === normalized) ??
        ACCOUNT_ORDER_HISTORY_MOCK.find((o) => o.id === normalized) ??
        null
      );
    },
    enabled: enabled && Boolean(id),
    staleTime: TIMING.cacheTimeMs,
  });
};
