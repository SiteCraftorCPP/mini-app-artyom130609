import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useWebApp } from "@vkruglikov/react-telegram-web-app";

import { BASE_API_URL } from "@/shared/constants/common";
import { QUERY_KEYS } from "@/api/constants/queryKeys";
import { TIMING } from "@/shared/constants/timing";
import type {
  OtherServiceGame,
  OtherServiceItem,
  OtherServiceMain,
  OtherServicesCatalogV1,
  OtherServiceSubsection,
} from "@/shared/types/other-services-catalog";

type Params = { enabled?: boolean };

function migrateItem(raw: unknown): OtherServiceItem {
  if (!raw || typeof raw !== "object") {
    return { id: "i0", description: "", paymentMode: "manager" };
  }
  const o = raw as Record<string, unknown>;
  if (o.paymentMode === "manager" || o.paymentMode === "info") {
    return {
      id: typeof o.id === "string" ? o.id : "i0",
      description: typeof o.description === "string" ? o.description : "",
      paymentMode: o.paymentMode,
      paymentInfo: typeof o.paymentInfo === "string" ? o.paymentInfo : undefined,
    };
  }
  const del = o.delivery;
  if (del === "manager") {
    return {
      id: typeof o.id === "string" ? o.id : "i0",
      description: typeof o.description === "string" ? o.description : "",
      paymentMode: "manager",
    };
  }
  if (del === "auto" && typeof o.autoText === "string") {
    return {
      id: typeof o.id === "string" ? o.id : "i0",
      description: typeof o.description === "string" ? o.description : "",
      paymentMode: "info",
      paymentInfo: o.autoText,
    };
  }
  if (del === "manual") {
    return {
      id: typeof o.id === "string" ? o.id : "i0",
      description: typeof o.description === "string" ? o.description : "",
      paymentMode: "info",
      paymentInfo: typeof o.manualAdminHint === "string" && o.manualAdminHint
        ? o.manualAdminHint
        : "Выдача вручную после оплаты",
    };
  }
  return {
    id: typeof o.id === "string" ? o.id : "i0",
    description: typeof o.description === "string" ? o.description : "",
    paymentMode: "manager",
  };
}

const LEGACY_LABEL: Record<string, string> = {
  "black-russia": "Black Russia",
  "matryoshka-rp": "Матрешка РП",
  "gta-v-rp": "GTA V RP",
  "majestic-rp": "Majestic RP",
  "arizona-rp": "Arizona RP",
  "radmir-rp": "Radmir RP",
  "province-rp": "Province RP",
  "amazing-rp": "Amazing RP",
  "grand-mobile-rp": "Grand Mobile RP",
};

function migrateSub(raw: unknown): OtherServiceSubsection {
  if (!raw || typeof raw !== "object") {
    return { id: "s0", name: "", items: [] };
  }
  const o = raw as Record<string, unknown>;
  return {
    id: typeof o.id === "string" ? o.id : "s0",
    name: typeof o.name === "string" ? o.name : "",
    items: Array.isArray(o.items) ? o.items.map(migrateItem) : [],
  };
}

function migrateMain(raw: unknown): OtherServiceMain {
  if (!raw || typeof raw !== "object") {
    return { id: "m0", name: "", subsections: [], items: [] };
  }
  const o = raw as Record<string, unknown>;
  return {
    id: typeof o.id === "string" ? o.id : "m0",
    name: typeof o.name === "string" ? o.name : "",
    subsections: Array.isArray(o.subsections) ? o.subsections.map(migrateSub) : [],
    items: Array.isArray(o.items) ? o.items.map(migrateItem) : [],
  };
}

function migrateGame(raw: unknown): OtherServiceGame {
  if (!raw || typeof raw !== "object") {
    return { id: "g0", name: "Игра", mainSections: [] };
  }
  const o = raw as Record<string, unknown>;
  const id =
    typeof o.id === "string" ? o.id : typeof o.projectKey === "string" ? o.projectKey : "g0";
  const name =
    typeof o.name === "string"
      ? o.name
      : typeof o.projectKey === "string"
        ? (LEGACY_LABEL[o.projectKey] ?? o.projectKey)
        : "Игра";
  return {
    id,
    name,
    mainSections: Array.isArray(o.mainSections) ? o.mainSections.map(migrateMain) : [],
  };
}

function normalizeCatalog(raw: unknown): OtherServicesCatalogV1 {
  if (!raw || typeof raw !== "object") {
    return { v: 1, games: [] };
  }
  const g = (raw as { games?: unknown }).games;
  const games = Array.isArray(g) ? g.map(migrateGame) : [];
  return { v: 1, games };
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
