import { type UseQueryResult, useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/api/constants/queryKeys";

import { CURRENCY } from "@/shared/constants/common";

import type { User } from "../model";

export const useAuthMe = (): UseQueryResult<User, Error> => {
  return useQuery<User, Error>({
    queryKey: [QUERY_KEYS.USERS.ME],
    queryFn: async () => {
      const response = await new Promise<User>((resolve) => {
        setTimeout(() => {
          resolve({
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
          });
        }, 500);
      });
      return response;
    },
  });
};
