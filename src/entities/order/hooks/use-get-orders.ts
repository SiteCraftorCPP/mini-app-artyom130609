import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { QUERY_KEYS } from "@/api/constants/queryKeys";
import { TIMING } from "@/shared/constants/timing";
import { useIsTelegramAdmin } from "@/shared/hooks/use-is-telegram-admin";
import { useWebAppInitDataString } from "@/shared/hooks/use-webapp-init-data-string";
import { fetchMiniappOrdersBundle } from "@/shared/lib/fetch-miniapp-orders";
import { isLikelyTelegramMiniApp } from "@/shared/lib/is-likely-telegram-mini-app";
import {
  ACCOUNT_ADMIN_CURRENT_ORDERS_MOCK,
  ACCOUNT_ADMIN_HISTORY_50_MOCK,
  ACCOUNT_CURRENT_ORDERS_MOCK,
  ACCOUNT_ORDER_HISTORY_MOCK,
} from "@/shared/mock/account-orders";

import type { Order } from "../model";
import type { MiniappOrdersBundle } from "@/shared/lib/fetch-miniapp-orders";

function fallbackBundle(isAdmin: boolean): MiniappOrdersBundle {
  return {
    active: isAdmin
      ? ACCOUNT_ADMIN_CURRENT_ORDERS_MOCK
      : ACCOUNT_CURRENT_ORDERS_MOCK,
    closed: isAdmin
      ? [...ACCOUNT_ADMIN_HISTORY_50_MOCK]
      : [...ACCOUNT_ORDER_HISTORY_MOCK],
  };
}

type UseGetOrdersParams = {
  enabled?: boolean;
};

export const useGetOrders = ({
  enabled = true,
}: UseGetOrdersParams = {}): UseQueryResult<Order[], Error> => {
  const isAdmin = useIsTelegramAdmin();
  const initData = useWebAppInitDataString();
  const fb = useMemo(() => fallbackBundle(isAdmin), [isAdmin]);

  return useQuery({
    queryKey: [QUERY_KEYS.ORDERS.CURRENT, "miniapp-bundle", initData, isAdmin],
    queryFn: async (): Promise<MiniappOrdersBundle> => {
      const trimmed = initData.trim();
      if (!trimmed) {
        if (isLikelyTelegramMiniApp()) {
          return { active: [], closed: [] };
        }
        return fb;
      }
      return await fetchMiniappOrdersBundle(trimmed);
    },
    enabled,
    staleTime: TIMING.cacheTimeMs,
    select: (d) => d.active,
  });
};
