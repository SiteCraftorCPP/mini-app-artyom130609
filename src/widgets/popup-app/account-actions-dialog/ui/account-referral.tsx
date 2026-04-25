import { AppText, TAG } from "@/ui/app-text";
import { Spinner } from "@/ui/spinner";
import { useQuery } from "@tanstack/react-query";
import { useWebApp } from "@vkruglikov/react-telegram-web-app";

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

export const AccountReferral = () => {
  const webApp = useWebApp();
  const initDataString = resolveInitData(webApp);

  const { data, isLoading, error } = useQuery({
    queryKey: ["referral-data"],
    queryFn: async () => {
      if (!initDataString) {
        throw new Error("No init data: try opening from Telegram");
      }
      
      let apiUrl = typeof window !== "undefined" && window.location?.origin ? window.location.origin : "";
      if (import.meta.env.VITE_API_URL) apiUrl = import.meta.env.VITE_API_URL;

      const res = await fetch(`${apiUrl}/notify/sell-virt-webapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: initDataString, action: "get_referral" }),
      });
      
      if (!res.ok) {
        const errText = await res.text().catch(() => "Unknown error");
        throw new Error(`HTTP ${res.status}: ${errText || res.statusText}`);
      }
      return res.json();
    },
    enabled: !!initDataString,
  });

  if (!initDataString) {
    return (
      <div className="px-4 pb-4">
        <AppText variant="popupBody" size="popupBody">
          Пожалуйста, откройте мини-приложение внутри Telegram, чтобы увидеть реферальную систему.
        </AppText>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Spinner className="min-h-0" classNameLoader="mb-0 border-white" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="px-4 pb-4">
        <AppText variant="popupBody" size="popupBody">
          Не удалось загрузить данные реферальной системы. 
          Ошибка: {error instanceof Error ? error.message : String(error)}
        </AppText>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 pb-4">
      <div className="rounded-xl bg-[#1A1A1A] p-4 text-center">
        <AppText tag={TAG.p} variant="default" size="small" className="mb-1 text-[#8C8C8C]">
          Ваша реферальная ссылка
        </AppText>
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg bg-[#2A2A2A] p-2 mt-2">
          <AppText className="text-xs break-all" variant="primaryStrong" size="small">{data.link}</AppText>
          <button 
            onClick={() => navigator.clipboard.writeText(data.link)}
            className="mt-1 px-3 py-1 bg-[#00FF00]/10 text-[#00FF00] rounded text-xs"
          >
            Скопировать
          </button>
        </div>
        <AppText tag={TAG.p} variant="default" size="small" className="mt-3 text-[#8C8C8C]">
          Вы получаете 5% от суммы каждого успешно выполненного заказа пользователя, перешедшего по вашей ссылке.
        </AppText>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[#1A1A1A] p-4 text-center">
          <AppText tag={TAG.p} variant="default" size="small" className="mb-1 text-[#8C8C8C]">
            Баланс
          </AppText>
          <AppText tag={TAG.p} variant="primaryStrong" size="xxxl" className="text-[#00FF00]">
            {data.balance.toFixed(2)} ₽
          </AppText>
        </div>
        <div className="rounded-xl bg-[#1A1A1A] p-4 text-center">
          <AppText tag={TAG.p} variant="default" size="small" className="mb-1 text-[#8C8C8C]">
            Заработано всего
          </AppText>
          <AppText tag={TAG.p} variant="primaryStrong" size="xxxl" className="text-[#00FF00]">
            {data.earned.toFixed(2)} ₽
          </AppText>
        </div>
      </div>
      
      <div className="rounded-xl bg-[#1A1A1A] p-4 text-center">
        <AppText tag={TAG.p} variant="default" size="small" className="mb-1 text-[#8C8C8C]">
          Приглашено пользователей
        </AppText>
        <AppText tag={TAG.p} variant="primaryStrong" size="xxxl">
          {data.invitedCount}
        </AppText>
      </div>
    </div>
  );
};
