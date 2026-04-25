import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/api/constants/queryKeys";

import { CURRENCY } from "@/shared/constants/common";
import { setLocalStorage } from "@/shared/lib/local-storage";
import { LOCAL_STORAGE_VARIABLES } from "@/shared/lib/local-storage/constants/local-storage";

import type { LoginByInitDataResponse } from "../model";

export const useLoginByInitData = (initDataString?: string) => {
  return useQuery<LoginByInitDataResponse>({
    queryKey: [QUERY_KEYS.USERS.LOGIN],
    queryFn: async () => {
      if (!initDataString) {
        throw new Error("Invalid init data");
      }

      let balance = 0;
      try {
        let apiUrl = typeof window !== "undefined" && window.location?.origin ? window.location.origin : "";
        if (import.meta.env.VITE_API_URL) apiUrl = import.meta.env.VITE_API_URL;
        
        const res = await fetch(`${apiUrl}/notify/sell-virt-webapp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData: initDataString, action: "get_referral" }),
        });
        if (res.ok) {
          const d = await res.json();
          balance = d.balance || 0;
        }
      } catch (e) {
        console.error("Failed to fetch balance", e);
      }

      const data: LoginByInitDataResponse = {
        user: {
          id: "1",
          telegramId: "1",
          name: "User",
          photoUrl: null,
          level: 1,
          balance: balance,
          status: "Новичок",
          currency: {
            name: CURRENCY.RUB,
            icon: "string",
          },
        },
        token: "mock-token",
        success: true,
        message: "Login successful",
      };

      setLocalStorage(LOCAL_STORAGE_VARIABLES.TOKEN, data.token);
      return data;
    },
    staleTime: 60 * 60 * 1000,
    enabled: !!initDataString,
  });
};
