import { useWebApp } from "@vkruglikov/react-telegram-web-app";
import { useState } from "react";

import { AppText } from "@/ui/app-text";
import { Button } from "@/ui/button";

import { TEXT, VIRT_SELL_TEXT } from "@/shared/constants/text";
import { showErrorMessage, showSuccessMessage } from "@/shared/lib/notify";
import { notifySellVirtFromMiniApp } from "@/shared/lib/telegram-sell-notify";

import { type Virt, VirtCard } from "@/entities/virt";

type VirtSellProps = {
  virt: Virt;
};

export const VirtSell = ({ virt }: VirtSellProps) => {
  const webApp = useWebApp();
  const [pending, setPending] = useState(false);

  const handleSellClick = async () => {
    setPending(true);
    try {
      const ok = await notifySellVirtFromMiniApp(webApp);
      if (ok) {
        showSuccessMessage(VIRT_SELL_TEXT.notifySuccess);
      } else {
        showErrorMessage(VIRT_SELL_TEXT.notifyError);
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 pb-6">
      <VirtCard virt={virt} interactive={false} className="shadow-none" />
      <div className="flex flex-col items-center justify-center gap-4 px-4">
        <Button
          type="button"
          variant="link"
          className="border-white"
          size="link"
          disabled={pending}
          onClick={handleSellClick}
        >
          <AppText variant={"primaryStrong"} size={"popupBody"}>
            {pending ? VIRT_SELL_TEXT.notifyPending : TEXT.buttons.sell}
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
