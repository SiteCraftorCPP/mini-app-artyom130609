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

      const data: LoginByInitDataResponse = await new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            user: {
              id: "1",
              telegramId: "1",
              name: "Faradey",
              photoUrl: null,
              level: 1,
              balance: 1,
              status: "Новичок",
              currency: {
                name: CURRENCY.RUB,
                icon: "string",
              },
            },
            token: "mock-token",
            success: true,
            message: "Login successful",
          });
        }, 500);
      });

      setLocalStorage(LOCAL_STORAGE_VARIABLES.TOKEN, data.token);
      return data;
    },
    staleTime: 60 * 60 * 1000,
    enabled: !!initDataString,
  });
};
