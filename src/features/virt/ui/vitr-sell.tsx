import { useWebApp } from "@vkruglikov/react-telegram-web-app";
import { useCallback } from "react";

import { AppText } from "@/ui/app-text";
import { Button } from "@/ui/button";

import { SUPPORT_CHAT_URL } from "@/shared/constants/common";
import { TEXT, VIRT_SELL_TEXT } from "@/shared/constants/text";

import { type Virt, VirtCard } from "@/entities/virt";

type VirtSellProps = {
  virt: Virt;
};

function openTelegramExternal(
  webApp: ReturnType<typeof useWebApp>,
  url: string,
): void {
  const w = webApp as {
    openTelegramLink?: (u: string) => void;
    openLink?: (u: string, opts?: { try_instant_view?: boolean }) => void;
  };
  if (typeof w.openTelegramLink === "function") {
    w.openTelegramLink(url);
    return;
  }
  if (typeof w.openLink === "function") {
    w.openLink(url);
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

export const VirtSell = ({ virt }: VirtSellProps) => {
  const webApp = useWebApp();

  const goManager = useCallback(() => {
    openTelegramExternal(webApp, SUPPORT_CHAT_URL);
  }, [webApp]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 pb-6">
      <VirtCard virt={virt} interactive={false} className="shadow-none" />
      <div className="flex flex-col items-center justify-center gap-4 px-4">
        <Button
          type="button"
          variant="link"
          size="pill"
          className="border-white !h-[4.5rem] min-w-[min(100%,18rem)] !px-10 !text-xl !font-semibold"
          onClick={goManager}
        >
          <AppText variant={"primaryStrong"} size={"popupBody"} className="!text-xl">
            {TEXT.buttons.sell}
          </AppText>
        </Button>
        <AppText
          className="text-center"
          size="popupBody"
          variant="primaryStrong"
        >
          {VIRT_SELL_TEXT.description}
        </AppText>
        <AppText className="text-center leading-[120%]" variant="primaryMedium">
          {VIRT_SELL_TEXT.note}
        </AppText>
      </div>
    </div>
  );
};
