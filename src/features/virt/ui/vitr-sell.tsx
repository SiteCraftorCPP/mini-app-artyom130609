import { AppText } from "@/ui/app-text";
import { Button } from "@/ui/button";

import { CHANEL_BUY } from "@/shared/constants/common";
import { TEXT, VIRT_SELL_TEXT } from "@/shared/constants/text";

import { type Virt, VirtCard } from "@/entities/virt";

type VirtSellProps = {
  virt: Virt;
};

export const VirtSell = ({ virt }: VirtSellProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 pb-6">
      <VirtCard virt={virt} interactive={false} className="shadow-none" />
      <div className="flex flex-col items-center justify-center gap-4 px-4">
        <Button asChild variant={"link"} className="border-white" size={"link"}>
          <a href={`${CHANEL_BUY}`} target="_blanck">
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
