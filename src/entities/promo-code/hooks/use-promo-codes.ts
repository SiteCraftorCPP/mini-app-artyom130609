import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/api/constants";
import type { PromoCode } from "../model";

const LOCAL_STORAGE_KEY = "artshop_promo_codes";

const getPromoCodesFromStorage = (): PromoCode[] => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const savePromoCodesToStorage = (codes: PromoCode[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(codes));
};

export const useGetPromoCodes = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.PROMO_CODES.LIST],
    queryFn: async () => {
      // Simulate network request
      await new Promise((resolve) => setTimeout(resolve, 300));
      return getPromoCodesFromStorage();
    },
  });
};

export const useAddPromoCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newCode: Omit<PromoCode, "id">) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const current = getPromoCodesFromStorage();
      const code: PromoCode = {
        ...newCode,
        id: crypto.randomUUID(),
      };
      savePromoCodesToStorage([...current, code]);
      return code;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROMO_CODES.LIST] });
    },
  });
};

export const useDeletePromoCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const current = getPromoCodesFromStorage();
      savePromoCodesToStorage(current.filter((c) => c.id !== id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROMO_CODES.LIST] });
    },
  });
};

export const useConsumePromoCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (codeString: string) => {
      const current = getPromoCodesFromStorage();
      const index = current.findIndex(
        (c) => c.code.toLowerCase() === codeString.toLowerCase(),
      );
      if (index === -1) return;

      const code = current[index];
      if (code.activationsLeft !== null) {
        if (code.activationsLeft <= 0) return;
        code.activationsLeft -= 1;
        savePromoCodesToStorage(current);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROMO_CODES.LIST] });
    },
  });
};
