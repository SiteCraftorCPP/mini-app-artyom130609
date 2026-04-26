import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/api/constants/queryKeys";
import { resolvePromoCodesListUrl } from "@/shared/lib/virt-order-endpoints";
import type { PromoCode } from "../model";

type UseGetPromoCodesOptions = {
  /** По умолчанию `false` — список запрашивается только вручную (кнопка «Применить»). */
  enabled?: boolean;
};

export const useGetPromoCodes = (options: UseGetPromoCodesOptions = {}) => {
  const { enabled = false } = options;

  return useQuery({
    queryKey: [QUERY_KEYS.PROMO_CODES.LIST],
    queryFn: async (): Promise<PromoCode[]> => {
      const url = resolvePromoCodesListUrl();
      if (!url) {
        return [];
      }
      const response = await fetch(url, { method: "GET" });
      if (!response.ok) {
        throw new Error(`promo-codes: ${response.status}`);
      }
      return (await response.json()) as PromoCode[];
    },
    enabled,
    retry: 1,
    staleTime: 30_000,
  });
};
