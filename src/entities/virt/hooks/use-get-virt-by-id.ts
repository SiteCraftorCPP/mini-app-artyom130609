import { type UseQueryResult, useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/api/constants/queryKeys";
import { TIMING } from "@/shared/constants/timing";
import { BUY_ACCOUNTS_MOCK } from "@/shared/mock/buy-accounts.mock";
import { BUY_VIRTS_MOCK } from "@/shared/mock/buy-virts.mock";
import { OTHER_SERVICES_MOCK } from "@/shared/mock/other-services.mock";
import { SELL_VIRTS_MOCK } from "@/shared/mock/sell-virts.mock";

import type { Virt } from "../model";

type VirtPopupType = "buy" | "buy-accounts" | "sell" | "services";

type UseGetVirtByIdParams = {
  enabled?: boolean;
  id: string | null;
  type: VirtPopupType;
};

const getVirtCollection = (type: VirtPopupType) => {
  switch (type) {
    case "buy":
      return BUY_VIRTS_MOCK;
    case "buy-accounts":
      return BUY_ACCOUNTS_MOCK;
    case "sell":
      return SELL_VIRTS_MOCK;
    case "services":
      return OTHER_SERVICES_MOCK;
  }
};

export const useGetVirtById = ({
  enabled = true,
  id,
  type,
}: UseGetVirtByIdParams): UseQueryResult<Virt | null, Error> => {
  return useQuery<Virt | null, Error>({
    queryKey: [QUERY_KEYS.VIRTS.DETAIL, type, id],
    queryFn: async () => {
      return await new Promise<Virt | null>((resolve) => {
        setTimeout(() => {
          const collection = getVirtCollection(type);
          resolve(collection.find((virt) => virt.id === id) ?? null);
        }, TIMING.mockDelayMs);
      });
    },
    enabled: enabled && Boolean(id),
    staleTime: TIMING.cacheTimeMs,
  });
};
