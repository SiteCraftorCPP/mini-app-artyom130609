import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useWebApp } from "@vkruglikov/react-telegram-web-app";

import { BASE_API_URL } from "@/shared/constants/common";
import { QUERY_KEYS } from "@/api/constants/queryKeys";
import { TIMING } from "@/shared/constants/timing";
import type { OtherServicesCatalogV1 } from "@/shared/types/other-services-catalog";

type Params = { enabled?: boolean };

function resolveInitData(webApp: { initData?: string } | null): string {
  const fromHook = webApp?.initData?.trim();
  if (fromHook) {
    return fromHook;
  }
  if (typeof window !== "undefined") {
    const raw = (window as { Telegram?: { WebApp?: { initData?: string } } })
      .Telegram?.WebApp?.initData?.trim();
    if (raw) {
      return raw;
    }
  }
  return "";
}

export const useGetOtherServicesCatalog = ({
  enabled = true,
}: Params = {}): UseQueryResult<OtherServicesCatalogV1, Error> => {
  const webApp = useWebApp();

  return useQuery<OtherServicesCatalogV1, Error>({
    queryKey: [QUERY_KEYS.OTHER_SERVICES.CATALOG],
    queryFn: async () => {
      const initData = resolveInitData(webApp);
      if (!initData) {
        throw new Error("Нет initData: откройте из Telegram");
      }
      let apiUrl =
        typeof window !== "undefined" && window.location?.origin
          ? window.location.origin
          : "";
      if (BASE_API_URL) {
        apiUrl = BASE_API_URL;
      }
      const res = await fetch(`${apiUrl}/notify/sell-virt-webapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData, action: "get_other_services" }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${t || res.statusText}`);
      }
      const j = (await res.json()) as { ok?: boolean; catalog?: OtherServicesCatalogV1 };
      if (!j.ok || !j.catalog) {
        throw new Error("Неверный ответ каталога");
      }
      return j.catalog;
    },
    enabled,
    staleTime: TIMING.cacheTimeMs,
  });
};
