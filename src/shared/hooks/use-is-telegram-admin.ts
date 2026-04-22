import { useInitData } from "@vkruglikov/react-telegram-web-app";
import { useMemo } from "react";

import { getAdminTelegramIdSet } from "@/shared/lib/admin-telegram-ids";

/** Доступ к админ-данным в мини-аппе, если реальный TG user id в `VITE_ADMIN_TELEGRAM_IDS`. */
export function useIsTelegramAdmin(): boolean {
  const [initDataUnsafe] = useInitData();
  return useMemo(() => {
    const id = initDataUnsafe?.user?.id;
    if (id == null) {
      return false;
    }
    return getAdminTelegramIdSet().has(String(id));
  }, [initDataUnsafe?.user?.id]);
}
