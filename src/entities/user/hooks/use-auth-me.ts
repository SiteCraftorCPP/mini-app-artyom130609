import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useWebApp } from "@vkruglikov/react-telegram-web-app";

import { QUERY_KEYS } from "@/api/constants/queryKeys";
import { CURRENCY } from "@/shared/constants/common";
import type { User } from "../model";

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
  const initDataString = resolveInitData(webApp);

  return useQuery<User, Error>({
    queryKey: [QUERY_KEYS.USERS.ME, initDataString],
    queryFn: async () => {
      const tgUser = webApp?.initDataUnsafe?.user;
      const name = displayNameFromTelegramUser(tgUser);
      const photoUrl = telegramUserPhotoUrl(tgUser);
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
