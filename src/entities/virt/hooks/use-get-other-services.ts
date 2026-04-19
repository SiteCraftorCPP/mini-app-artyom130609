import { type UseQueryResult, useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/api/constants/queryKeys";
import { TIMING } from "@/shared/constants/timing";
import { OTHER_SERVICES_MOCK } from "@/shared/mock/other-services.mock";

import { type Virt } from "../model";

type UseGetOtherServicesParams = {
  enabled?: boolean;
};

export const useGetOtherServices = ({
  enabled = true,
}: UseGetOtherServicesParams = {}): UseQueryResult<Virt[], Error> => {
  return useQuery<Virt[], Error>({
    queryKey: [QUERY_KEYS.VIRTS.OTHER_SERVICES],
    queryFn: async () => {
      return await new Promise<Virt[]>((resolve) => {
        setTimeout(() => {
          resolve(OTHER_SERVICES_MOCK);
        }, TIMING.mockDelayMs);
      });
    },
    enabled,
    staleTime: TIMING.cacheTimeMs,
  });
};
