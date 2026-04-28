import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useWebApp } from "@vkruglikov/react-telegram-web-app";

import { BASE_API_URL } from "@/shared/constants/common";
import { QUERY_KEYS } from "@/api/constants/queryKeys";
import { TIMING } from "@/shared/constants/timing";
import type {
  OtherServiceGame,
  OtherServiceItem,
  OtherServiceMain,
  OtherServicePayOption,
  OtherServicesCatalogV1,
} from "@/shared/types/other-services-catalog";

type Params = { enabled?: boolean };

function migratePayOption(raw: unknown): OtherServicePayOption | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const priceLabel = typeof o.priceLabel === "string" ? o.priceLabel.trim() : "";
  const payUrl = typeof o.payUrl === "string" ? o.payUrl.trim() : "";
  if (!priceLabel || !payUrl) {
    return null;
  }
  return {
    id: typeof o.id === "string" ? o.id : "p0",
    priceLabel,
    payUrl,
    payLabel: typeof o.payLabel === "string" ? o.payLabel.trim() || undefined : undefined,
  };
}

function migratePayOptions(raw: unknown): OtherServicePayOption[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map(migratePayOption).filter((x): x is OtherServicePayOption => x != null);
}

function migrateItem(raw: unknown): OtherServiceItem {
  if (!raw || typeof raw !== "object") {
    return { id: "i0", description: "", paymentMode: "manager" };
  }
  const o = raw as Record<string, unknown>;
  if (o.paymentMode === "auto" || o.paymentMode === "manual") {
    const amountRub = typeof o.amountRub === "number" ? o.amountRub : undefined;
    const deliverText = typeof o.deliverText === "string" ? o.deliverText : undefined;
    return {
      id: typeof o.id === "string" ? o.id : "i0",
      description: typeof o.description === "string" ? o.description : "",
      paymentMode: o.paymentMode,
      deliverText: deliverText?.trim() || undefined,
      amountRub: amountRub != null && Number.isFinite(amountRub) ? amountRub : undefined,
    };
  }
  if (o.paymentMode === "pay") {
    const payOptions = migratePayOptions(o.payOptions);
    return {
      id: typeof o.id === "string" ? o.id : "i0",
      description: typeof o.description === "string" ? o.description : "",
      paymentMode: "pay",
      payOptions: payOptions.length > 0 ? payOptions : undefined,
    };
  }
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

function migrateLegacySubToMain(subRaw: unknown): OtherServiceMain {
  if (!subRaw || typeof subRaw !== "object") {
    return { id: "m0", name: "", items: [] };
  }
  const o = subRaw as Record<string, unknown>;
  const d = o.description;
  const description = typeof d === "string" && d.trim() ? d.trim() : undefined;
  const base: OtherServiceMain = {
    id: typeof o.id === "string" ? o.id : "m0",
    name: typeof o.name === "string" ? o.name : "Подраздел",
    items: Array.isArray(o.items) ? o.items.map(migrateItem) : [],
  };
  if (description) {
    return { ...base, description };
  }
  return base;
}

function migrateMainEntry(raw: unknown): OtherServiceMain[] {
  if (!raw || typeof raw !== "object") {
    return [{ id: "m0", name: "", items: [] }];
  }
  const o = raw as Record<string, unknown>;
  const subsections = Array.isArray(o.subsections) ? o.subsections : [];
  const baseItems = Array.isArray(o.items) ? o.items.map(migrateItem) : [];
  const d = o.description;
  const descM = typeof d === "string" && d.trim() ? d.trim() : undefined;
  const id = typeof o.id === "string" ? o.id : "m0";
  const name = typeof o.name === "string" ? o.name : "";
  if (subsections.length === 0) {
    const b: OtherServiceMain = { id, name, items: baseItems };
    return [descM ? { ...b, description: descM } : b];
  }
  const fromSubs = subsections.map((s) => migrateLegacySubToMain(s));
  if (baseItems.length > 0) {
    const first: OtherServiceMain = { id, name, items: baseItems, ...(descM ? { description: descM } : {}) };
    return [first, ...fromSubs];
  }
  return fromSubs;
}

function migrateGame(raw: unknown): OtherServiceGame {
  if (!raw || typeof raw !== "object") {
    return { id: "g0", name: "Игра", items: [], mainSections: [] };
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
  const items = Array.isArray(o.items) ? o.items.map(migrateItem) : [];
  return {
    id,
    name,
    items,
    mainSections: Array.isArray(o.mainSections) ? o.mainSections.flatMap(migrateMainEntry) : [],
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
