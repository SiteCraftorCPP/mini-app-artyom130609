import {
  useGetBuyAccounts,
  useGetBuyVirts,
  useGetSellVirts,
} from "@/entities/virt";

import type { VirtPopupType } from "../model/virt-popup.type";

type UseVirtsPopupContentParams = {
  enabled: boolean;
  type: VirtPopupType;
};

export const useVirtsPopupContent = ({
  enabled,
  type,
}: UseVirtsPopupContentParams) => {
  const buyVirtsQuery = useGetBuyVirts({ enabled: enabled && type === "buy" });
  const buyAccountsQuery = useGetBuyAccounts({
    enabled: enabled && type === "buy-accounts",
  });
  const sellVirtsQuery = useGetSellVirts({
    enabled: enabled && type === "sell",
  });

  const activeQuery =
    type === "buy"
      ? buyVirtsQuery
      : type === "buy-accounts"
        ? buyAccountsQuery
        : type === "sell"
          ? sellVirtsQuery
          : buyVirtsQuery;

  return {
    data: activeQuery.data,
    isLoading: activeQuery.isLoading,
  };
};
