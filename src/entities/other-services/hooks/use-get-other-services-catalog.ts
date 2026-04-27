import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useWebApp } from "@vkruglikov/react-telegram-web-app";

import { BASE_API_URL } from "@/shared/constants/common";
import { QUERY_KEYS } from "@/api/constants/queryKeys";
import { TIMING } from "@/shared/constants/timing";
import type { OtherServicesCatalogV1 } from "@/shared/types/other-services-catalog";

type Params = { enabled?: boolean };

function normalizeCatalog(raw: unknown): OtherServicesCatalogV1 {
  if (!raw || typeof raw !== "object") {
    return { v: 1, games: [] };
  }
  const g = (raw as { games?: unknown }).games;
  const games = Array.isArray(g) ? g : [];
  return { v: 1, games: games as OtherServicesCatalogV1["games"] };
}

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
        return { v: 1, games: [] };
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
      let j: { ok?: boolean; catalog?: unknown };
      try {
        j = (await res.json()) as { ok?: boolean; catalog?: unknown };
      } catch {
        return { v: 1, games: [] };
      }
      return normalizeCatalog(j.catalog);
    },
    enabled,
    staleTime: TIMING.cacheTimeMs,
  });
};
