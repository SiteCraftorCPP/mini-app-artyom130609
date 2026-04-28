import { X } from "lucide-react";

import { AppText } from "@/ui/app-text";
import { Button } from "@/ui/button";
import { DialogClose, dialogPopupCloseButtonClassName } from "@/ui/dialog";
import { cn } from "@/shared/utils";

import ArrowLeft from "@/assets/icon/button-back.svg";

type PopupAppHeaderProps = {
  onBack?: () => void;
  title: string;
  /** `plain` — без «плашки», текст переносится (успех оплаты, длинные заголовки). */
  titleVariant?: "badge" | "plain";
};

export const PopupAppHeader = ({
  onBack,
  title,
  titleVariant = "badge",
}: PopupAppHeaderProps) => {
  return (
    <div className="flex w-full min-w-0 items-center gap-2 px-4 pb-1 sm:gap-3">
      <div
        className={cn(
          "min-w-0 flex-1",
          titleVariant === "badge" ? "overflow-hidden" : "",
        )}
      >
        {titleVariant === "plain" ? (
          <AppText
            variant="primaryStrong"
            size="popupBody"
            className="w-full min-w-0 whitespace-normal text-pretty break-words"
          >
            {title}
          </AppText>
        ) : (
          <div className="tw-bg-gradient-badge-background inline-flex h-8 min-w-0 max-w-full items-center rounded-[6px] border border-white/50 px-3">
            <AppText
              variant="primaryStrong"
              size="popupBadge"
              className="min-w-0 truncate"
            >
              {title}
            </AppText>
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {onBack ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="size-8 shrink-0 rounded-[6px] border border-white/15 bg-[#1A1A1A] px-0 text-white hover:bg-[#252525] hover:brightness-100"
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
