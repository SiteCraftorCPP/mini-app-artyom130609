import type { MouseEvent } from "react";

import { AppText } from "@/ui/app-text";
import { Button } from "@/ui/button";

import { resolveSellVirtTelegramLink } from "@/shared/constants/common";
import { TEXT, VIRT_SELL_TEXT } from "@/shared/constants/text";

import { type Virt, VirtCard } from "@/entities/virt";

type VirtSellProps = {
  virt: Virt;
};

export const VirtSell = ({ virt }: VirtSellProps) => {
  const sellLink = resolveSellVirtTelegramLink();

  const handleSellClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!sellLink) {
      e.preventDefault();
      return;
    }
    const tg = (
      window as unknown as {
        Telegram?: { WebApp?: { openTelegramLink?: (url: string) => void } };
      }
    ).Telegram?.WebApp;
    if (tg?.openTelegramLink) {
      e.preventDefault();
      tg.openTelegramLink(sellLink);
      return;
    }
    /* Вне Telegram — обычный переход по t.me */
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 pb-6">
      <VirtCard virt={virt} interactive={false} className="shadow-none" />
      <div className="flex flex-col items-center justify-center gap-4 px-4">
        <Button asChild variant={"link"} className="border-white" size={"link"}>
          <a
            href={sellLink || undefined}
            onClick={handleSellClick}
            rel="noreferrer"
          >
            <AppText variant={"primaryStrong"} size={"popupBody"}>
              {TEXT.buttons.sell}
            </AppText>
          </a>
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
