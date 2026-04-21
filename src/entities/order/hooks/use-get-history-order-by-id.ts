import type { UseQueryResult } from "@tanstack/react-query";

import type { Order } from "../model";

import { useGetOrderById } from "./use-get-order-by-id";

type UseGetHistoryOrderByIdParams = {
  enabled?: boolean;
  id: string | null;
};

/** @deprecated Используйте useGetOrderById — тот же поиск по id в текущих и истории. */
export const useGetHistoryOrderById = ({
  enabled = true,
  id,
}: UseGetHistoryOrderByIdParams): UseQueryResult<Order | null, Error> => {
  return useGetOrderById({ enabled, id });
};
