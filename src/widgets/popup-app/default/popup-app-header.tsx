import { AppText } from "@/ui/app-text";
import { Button } from "@/ui/button";

import ArrowLeft from "@/assets/icon/button-back.svg";

type PopupAppHeaderProps = {
  onBack?: () => void;
  title: string;
};

export const PopupAppHeader = ({ onBack, title }: PopupAppHeaderProps) => {
  return (
    <div className="flex items-center gap-2 px-4 pt-4 pr-6 pb-1">
      <div className="flex-1">
        <div className="tw-bg-gradient-badge-background flex h-8 w-fit items-center justify-center rounded-[6px] border px-3 border-white/50">
          <AppText variant="primaryStrong" size="popupBadge">
            {title}
          </AppText>
        </div>
      </div> 
      {onBack ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="tw-bg-popup-submit hover:bg-app-surface-overlay-hover size-8 rounded-[6px] border border-white px-0 text-white"
          onClick={onBack}
        >
          <ArrowLeft className="size-6" />
        </Button>
      ) : null}
    </div>
  );
};
