import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/api/constants/queryKeys";
import type { PromoCode } from "../model";

const NOTIFY_URL = import.meta.env.VITE_VIRT_ORDER_NOTIFY_URL;

export const useGetPromoCodes = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.PROMO_CODES.LIST],
    queryFn: async (): Promise<PromoCode[]> => {
      try {
        if (!NOTIFY_URL) return [];
        const baseUrl = NOTIFY_URL.replace(/\/notify\/.*$/, "");
        const response = await fetch(`${baseUrl}/api/promo-codes`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          return [];
        }
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch promo codes", error);
        return [];
      }
    },
  });
};
