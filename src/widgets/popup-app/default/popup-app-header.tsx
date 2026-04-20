import { X } from "lucide-react";

import { AppText } from "@/ui/app-text";
import { Button } from "@/ui/button";
import { DialogClose, dialogPopupCloseButtonClassName } from "@/ui/dialog";

import ArrowLeft from "@/assets/icon/button-back.svg";

type PopupAppHeaderProps = {
  onBack?: () => void;
  title: string;
};

export const PopupAppHeader = ({ onBack, title }: PopupAppHeaderProps) => {
  return (
    <div className="flex w-full min-w-0 items-center gap-3 px-4 pb-1">
      <div className="min-w-0 flex-1">
        <div className="tw-bg-gradient-badge-background flex h-8 w-fit max-w-full min-w-0 items-center justify-center rounded-[6px] border border-white/50 px-3">
          <AppText
            variant="primaryStrong"
            size="popupBadge"
            className="truncate"
          >
            {title}
          </AppText>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {onBack ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="tw-bg-popup-submit hover:bg-app-surface-overlay-hover size-8 shrink-0 rounded-[6px] border border-white px-0 text-white"
            onClick={onBack}
          >
            <ArrowLeft className="size-6" />
          </Button>
        ) : null}
        <DialogClose
          type="button"
          className={dialogPopupCloseButtonClassName}
          aria-label="Закрыть"
        >
          <X className="size-5" strokeWidth={2.5} />
        </DialogClose>
      </div>
    </div>
  );
};
