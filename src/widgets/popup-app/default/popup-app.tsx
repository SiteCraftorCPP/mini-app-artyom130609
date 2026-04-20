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

type PopupAppProps = {
  children: ReactNode;
  content: ReactNode;
  contentClassName?: string;
  open?: boolean;
  setOpen?: Dispatch<SetStateAction<boolean>>;
  slot?: ReactNode;
  title?: string;
};

export const PopupApp = ({
  children,
  content,
  contentClassName,
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
        variant="popup"
        lockBodyScroll={resolvedOpen}
        className={cn("overflow-hidden", contentClassName)}
      >
        <DialogHeader className="gap-3 pr-0">
          {slot}
          <DialogTitle className={cn({ hidden: !title })}>
            <AppText className="font-bold" variant="popupBody" size="popupBody">
              {title || ""}
            </AppText>
          </DialogTitle>
        </DialogHeader>
        <div className="hide-scrollbar mt-3 flex min-h-0 flex-1 flex-col touch-pan-y overflow-y-auto overscroll-contain">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
};
