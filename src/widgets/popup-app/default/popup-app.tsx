import { useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

import { AppText } from "@/ui/app-text";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/dialog";

import { cn } from "@/shared/utils";

/** `popup` — на весь экран по вертикали; `popupCentered` / `popupFormCentered` — по центру (FAQ, формы «купить»). */
export type PopupAppDialogVariant =
  | "popup"
  | "popupCentered"
  | "popupFormCentered";

type PopupAppProps = {
  children: ReactNode;
  content: ReactNode;
  contentClassName?: string;
  /** Классы для прокручиваемой области под шапкой (напр. `justify-center`). */
  contentBodyClassName?: string;
  /** Вариант `DialogContent`: по умолчанию `popup`. */
  dialogVariant?: PopupAppDialogVariant;
  open?: boolean;
  setOpen?: Dispatch<SetStateAction<boolean>>;
  slot?: ReactNode;
  title?: string;
};

export const PopupApp = ({
  children,
  content,
  contentClassName,
  contentBodyClassName,
  dialogVariant = "popup",
  open,
  setOpen,
  slot,
  title,
}: PopupAppProps) => {
  const [innerOpen, setInnerOpen] = useState(false);

  const isControlled = open !== undefined && setOpen !== undefined;
  const resolvedOpen = isControlled ? open : innerOpen;
  const resolvedSetOpen = useMemo(
    () => (isControlled ? setOpen : setInnerOpen),
    [isControlled, setOpen],
  );

  return (
    <Dialog open={resolvedOpen} onOpenChange={resolvedSetOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        variant={dialogVariant}
        lockBodyScroll={resolvedOpen}
        className={cn("overflow-hidden", contentClassName)}
      >
        <DialogHeader className="min-w-0 gap-3 pr-0">
          {slot}
          <DialogTitle className={cn({ hidden: !title })}>
            <AppText className="font-bold" variant="popupBody" size="popupBody">
              {title || ""}
            </AppText>
          </DialogTitle>
        </DialogHeader>
        <div
          className={cn(
            "hide-scrollbar mt-3 flex min-h-0 min-w-0 w-full max-w-full flex-1 flex-col touch-pan-y overflow-y-auto overscroll-contain",
            contentBodyClassName,
          )}
        >
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
};
