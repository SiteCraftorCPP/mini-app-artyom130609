import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { QUERY_KEYS } from "@/api/constants/queryKeys";
import {
  buildPostPaymentReturnBody,
  buildPostPaymentReturnTitle,
} from "@/shared/constants/post-payment-return";
import { ROUTERS } from "@/shared/constants/routers";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { AppText } from "@/ui/app-text";
import { cn } from "@/shared/utils";
import { PopupAppHeader } from "@/widgets/popup-app/default/popup-app-header";

import {
  clearPostPaymentNotice,
  readPostPaymentNotice,
  type StoredPostPaymentNotice,
} from "./post-payment-notice-storage";

const bodyClass = cn(
  "w-full min-w-0 max-w-full text-pretty break-words text-[20px] leading-[120%] font-medium whitespace-pre-line text-white",
);

export function PostPaymentReturnDialog() {
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<StoredPostPaymentNotice | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const tryOpenFromStorage = useCallback(() => {
    const n = readPostPaymentNotice();
    if (!n) {
      return;
    }
    clearPostPaymentNotice();
    setNotice(n);
    setOpen(true);
  }, []);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") {
        tryOpenFromStorage();
      }
    };
    const onFocus = () => tryOpenFromStorage();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
    };
  }, [tryOpenFromStorage]);

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setNotice(null);
    }
    setOpen(v);
  };

  const title = notice ? buildPostPaymentReturnTitle(notice.orderNumber) : "";
  const body = notice ? buildPostPaymentReturnBody(notice) : "";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent variant="popupCentered" lockBodyScroll={open}>
        {notice ? (
          <>
            <DialogHeader className="min-w-0 gap-3 pr-0">
              <DialogTitle className="sr-only">{title}</DialogTitle>
              <PopupAppHeader title={title} titleVariant="plain" />
            </DialogHeader>
            <div
              className={cn(
                "scrollbar-app mt-3 flex min-h-0 w-full min-w-0 max-h-[min(72vh,560px)] max-w-full flex-1 flex-col self-stretch touch-pan-y overflow-y-scroll overflow-x-clip overscroll-contain px-4 pb-2",
              )}
            >
              <div className={bodyClass}>{body}</div>
              <Button
                type="button"
                className="mt-6 min-h-12 w-full justify-center rounded-[14px] border border-app-border-soft px-4 tw-bg-popup-submit text-sm font-semibold text-white shadow-[0_8px_20px_var(--app-shadow)] hover:brightness-110 active:brightness-90"
                onClick={() => {
                  handleOpenChange(false);
                  void queryClient.invalidateQueries({
                    queryKey: [QUERY_KEYS.ORDERS.CURRENT],
                  });
                  void queryClient.invalidateQueries({
                    queryKey: [QUERY_KEYS.ORDERS.BY_ID],
                  });
                  const oid = notice.orderId?.trim();
                  const q = oid
                    ? `open=currentOrders&orderId=${encodeURIComponent(oid)}`
                    : "open=currentOrders";
                  navigate(`${ROUTERS.PROFILE}?${q}`);
                }}
              >
                <AppText variant="primaryStrong" size="popupBody">
                  Узнать детали
                </AppText>
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
