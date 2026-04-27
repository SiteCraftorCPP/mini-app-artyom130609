import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useInitData, useWebApp } from "@vkruglikov/react-telegram-web-app";

import { QUERY_KEYS } from "@/api/constants/queryKeys";
import { CURRENCY } from "@/shared/constants/common";
import type { User } from "../model";

type TgUserLike = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string | true;
} | null;

function resolveInitData(webApp: any): string {
  const fromHook = webApp?.initData?.trim();
  if (fromHook) return fromHook;
  if (typeof window !== "undefined") {
    const tg = (window as any).Telegram?.WebApp;
    const raw = tg?.initData?.trim();
    if (raw) return raw;
  }
  return "";
}

/** `initDataUnsafe` иногда пуст на первом кадре, а `user=...` в `initData` уже есть. */
function parseUserFromInitDataString(initData: string): TgUserLike {
  if (!initData) return null;
  try {
    const params = new URLSearchParams(initData);
    const raw = params.get("user");
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(raw)) as TgUserLike;
  } catch {
    return null;
  }
}

function resolveTelegramUser(
  webApp: any,
  initDataFromHook: string | undefined,
  initDataUnsafeFromHook: { user?: TgUserLike } | undefined,
): TgUserLike {
  const u1 = initDataUnsafeFromHook?.user ?? webApp?.initDataUnsafe?.user;
  if (u1) return u1;
  if (typeof window !== "undefined") {
    const wu = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
    if (wu) return wu;
  }
  const line =
    resolveInitData(webApp) || initDataFromHook?.trim() || "";
  return parseUserFromInitDataString(line);
}

function displayNameFromTelegramUser(
  u: { first_name?: string; last_name?: string; username?: string } | undefined,
): string {
  if (!u) {
    return "User";
  }
  const full = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
  if (full.length > 0) {
    return full;
  }
  if (u.username) {
    return `@${u.username}`;
  }
  return "User";
}

function telegramUserPhotoUrl(
  u: { photo_url?: string | true } | undefined,
): string | null {
  const p = u?.photo_url;
  if (typeof p === "string" && p.length > 0) {
    return p;
  }
  return null;
}

export const useAuthMe = (): UseQueryResult<User, Error> => {
  const webApp = useWebApp();
  const [initDataUnsafe, initDataFromLib] = useInitData();
  const initDataString = resolveInitData(webApp) || initDataFromLib?.trim() || "";
  const tgUser = resolveTelegramUser(webApp, initDataFromLib, initDataUnsafe);

  return useQuery<User, Error>({
    queryKey: [QUERY_KEYS.USERS.ME, initDataString, tgUser?.id, tgUser?.first_name],
    queryFn: async () => {
      const name = displayNameFromTelegramUser(tgUser ?? undefined);
      const photoUrl = telegramUserPhotoUrl(tgUser ?? undefined);
      const idStr = tgUser ? String(tgUser.id) : "1";

      let balance = 0;
      try {
        if (initDataString) {
          let apiUrl =
            typeof window !== "undefined" && window.location?.origin
              ? window.location.origin
              : "";
          if (import.meta.env.VITE_API_URL) {
            apiUrl = import.meta.env.VITE_API_URL;
          }

          const res = await fetch(`${apiUrl}/notify/sell-virt-webapp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ initData: initDataString, action: "get_referral" }),
          });
          if (res.ok) {
            const d = await res.json();
            balance = d.balance || 0;
          }
        }
      } catch (e) {
        console.error("Failed to fetch balance in useAuthMe", e);
      }

      return {
        id: idStr,
        telegramId: idStr,
        name,
        photoUrl,
        level: 1,
        balance,
        status: "Новичок",
        currency: {
          name: CURRENCY.RUB,
          icon: "string",
        },
      };
    },
  });
};
