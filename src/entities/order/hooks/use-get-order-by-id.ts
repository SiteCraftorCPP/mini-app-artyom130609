import { type UseQueryResult, useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/api/constants/queryKeys";
import { TIMING } from "@/shared/constants/timing";
import { fetchMiniappOrderById } from "@/shared/lib/fetch-miniapp-orders";
import { isLikelyTelegramMiniApp } from "@/shared/lib/is-likely-telegram-mini-app";
import { useIsTelegramAdmin } from "@/shared/hooks/use-is-telegram-admin";
import { useWebAppInitDataString } from "@/shared/hooks/use-webapp-init-data-string";
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

function normalizeOrderId(id: string): string {
  return id.trim().replace(/^#+/, "");
}

function orderMatchesIdField(o: Order, normalized: string): boolean {
  if (o.id === normalized) {
    return true;
  }
  const pub = o.publicOrderId?.trim().replace(/^#+/, "");
  return Boolean(pub && pub === normalized);
}

function findOrderInMocks(normalized: string, isAdmin: boolean): Order | null {
  const fromAdmin = ACCOUNT_ADMIN_CURRENT_ORDERS_MOCK.find((o) =>
    orderMatchesIdField(o, normalized),
  );
  if (fromAdmin) {
    return isAdmin ? fromAdmin : null;
  }
  const fromAdminArchive = ACCOUNT_ADMIN_ORDER_ARCHIVE_MOCK.find((o) =>
    orderMatchesIdField(o, normalized),
  );
  if (fromAdminArchive) {
    return isAdmin ? fromAdminArchive : null;
  }
  const fromAdminHistory50 = ACCOUNT_ADMIN_HISTORY_50_MOCK.find((o) =>
    orderMatchesIdField(o, normalized),
  );
  if (fromAdminHistory50) {
    return isAdmin ? fromAdminHistory50 : null;
  }
  return (
    ACCOUNT_CURRENT_ORDERS_MOCK.find((o) => orderMatchesIdField(o, normalized)) ??
    ACCOUNT_ORDER_HISTORY_MOCK.find((o) => orderMatchesIdField(o, normalized)) ??
    null
  );
}

/** Текущие (в т.ч. админ-очередь) + история; с API — только свои заказы. */
export const useGetOrderById = ({
  enabled = true,
  id,
}: UseGetOrderByIdParams): UseQueryResult<Order | null, Error> => {
  const isAdmin = useIsTelegramAdmin();
  const initData = useWebAppInitDataString();
  return useQuery<Order | null, Error>({
    queryKey: [QUERY_KEYS.ORDERS.BY_ID, id, initData, isAdmin],
    queryFn: async () => {
      if (!id) {
        return null;
      }
      const normalized = normalizeOrderId(id);
      const trimmed = initData.trim();
      if (!trimmed) {
        if (isLikelyTelegramMiniApp()) {
          return isAdmin ? findOrderInMocks(normalized, true) : null;
        }
        return findOrderInMocks(normalized, isAdmin);
      }
      return await fetchMiniappOrderById(trimmed, normalized);
    },
    enabled: enabled && Boolean(id),
    staleTime: TIMING.cacheTimeMs,
  });
};
