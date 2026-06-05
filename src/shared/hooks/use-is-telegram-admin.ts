import { useInitData } from "@vkruglikov/react-telegram-web-app";
import { useMemo } from "react";

import { getAdminTelegramIdSet } from "@/shared/lib/admin-telegram-ids";

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
