import { X } from "lucide-react";
import { useCallback, useState } from "react";

import { KZT_REQUISITES } from "@/shared/constants/payment-requisites-kzt";
import { PAYMENT_TEXT, TEXT } from "@/shared/constants/text";
import {
  type PaymentMethodCode,
  type PaymentPrepareInput,
  openPaymentUrl,
  requestPaymentPrepare,
} from "@/shared/lib/prepare-payment";
import { showErrorMessage, showSuccessMessage } from "@/shared/lib/notify";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  dialogPopupCloseButtonClassName,
} from "@/shared/ui/dialog";
import { AppText, TAG } from "@/ui/app-text";
import { cn } from "@/shared/utils";

export type PaymentDialogContext =
  | {
      orderKind: "virt";
      game: string;
      server: string;
      bankAccount: string;
      virtAmountLabel: string;
      transferMethod: string;
      promoCode: string;
    }
  | {
      orderKind: "account";
      game: string;
      server: string;
      transferMethod: string;
      accountMode: string;
      accountOptionLabel: string;
    };

type PaymentMethodDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initData: string;
  amountRub: number;
  context: PaymentDialogContext | null;
};

const RUB_METHODS: { id: PaymentMethodCode; label: string }[] = [
  { id: "sbp", label: PAYMENT_TEXT.methodSbp },
  { id: "mir", label: PAYMENT_TEXT.methodMir },
  { id: "card_rub", label: PAYMENT_TEXT.methodCard },
];

const methodBtnClass =
  "h-12 w-full rounded-[12px] border border-app-border-soft text-white shadow-[0_8px_20px_var(--app-shadow)] tw-bg-popup-submit hover:brightness-110 active:brightness-90";

function buildPrepareInput(
  method: PaymentMethodCode,
  initData: string,
  amountRub: number,
  ctx: PaymentDialogContext,
): PaymentPrepareInput {
  if (ctx.orderKind === "virt") {
    return {
      initData,
      orderKind: "virt",
      method,
      amountRub,
      game: ctx.game,
      server: ctx.server,
      bankAccount: ctx.bankAccount,
      virtAmountLabel: ctx.virtAmountLabel,
      transferMethod: ctx.transferMethod,
      promoCode: ctx.promoCode,
    };
  }
  return {
    initData,
    orderKind: "account",
    method,
    amountRub,
    game: ctx.game,
    server: ctx.server,
    transferMethod: ctx.transferMethod,
    accountMode: ctx.accountMode,
    accountOptionLabel: ctx.accountOptionLabel,
  };
}

export function PaymentMethodDialog({
  open,
  onOpenChange,
  initData,
  amountRub,
  context,
}: PaymentMethodDialogProps) {
  const [step, setStep] = useState<"list" | "kzt">("list");
  const [busy, setBusy] = useState(false);

  const resetAndClose = useCallback(
    (v: boolean) => {
      if (!v) {
        setStep("list");
        setBusy(false);
      }
      onOpenChange(v);
    },
    [onOpenChange],
  );

  const copy = useCallback(async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showSuccessMessage(TEXT.notification.copied);
    } catch {
      showErrorMessage(label);
    }
  }, []);

  const onSelectRub = useCallback(
    async (method: PaymentMethodCode) => {
      if (!initData.trim() || !context) {
        showErrorMessage("Откройте магазин из Telegram (WebApp).");
        return;
      }
      setBusy(true);
      try {
        const body = buildPrepareInput(
          method,
          initData,
          amountRub,
          context,
        );
        const { payUrl } = await requestPaymentPrepare(body);
        openPaymentUrl(payUrl);
        resetAndClose(false);
      } catch {
        showErrorMessage("Не удалось открыть оплату. Попробуйте снова.");
      } finally {
        setBusy(false);
      }
    },
    [amountRub, context, initData, resetAndClose],
  );

  if (!context) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent
        variant="popupFormCentered"
        lockBodyScroll
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="p-0"
        aria-describedby={undefined}
      >
        <div className="border-app-border-soft text-text-primary flex min-h-0 w-full min-w-0 flex-col gap-2 border-b px-4 py-3">
          <div className="flex w-full min-w-0 items-start justify-end gap-2">
            <AppText
              tag={TAG.p}
              variant="primaryStrong"
              className="mr-auto pl-0.5 text-center text-sm leading-tight font-semibold tracking-wide uppercase"
            >
              {step === "list" ? PAYMENT_TEXT.title : PAYMENT_TEXT.kztBlockTitle}
            </AppText>
            <DialogClose
              className={cn(
                dialogPopupCloseButtonClassName,
                "mt-0.5 -mr-1 shrink-0",
              )}
              onClick={() => resetAndClose(false)}
            >
              <X className="h-3.5 w-3.5" />
            </DialogClose>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4">
          {step === "kzt" ? (
            <div className="flex flex-col gap-3">
              <AppText tag={TAG.p} variant="darkStrong" className="text-sm leading-relaxed">
                {PAYMENT_TEXT.kztNote}
              </AppText>
              <div className="bg-surface-base border-app-border-soft text-text-primary flex flex-col gap-2 rounded-xl border p-3 text-sm">
                <div>
                  <span className="text-app-text-muted block text-xs">
                    {PAYMENT_TEXT.halykLabel}
                  </span>
                  <code className="text-xs break-all">{KZT_REQUISITES.halyk}</code>
                </div>
                <div>
                  <span className="text-app-text-muted block text-xs">
                    {PAYMENT_TEXT.kaspiLabel}
                  </span>
                  <code className="text-xs break-all">{KZT_REQUISITES.kaspi}</code>
                </div>
                <div>
                  <span className="text-app-text-muted block text-xs">
                    {PAYMENT_TEXT.recipient}
                  </span>
                  {KZT_REQUISITES.recipient}
                </div>
              </div>
              <div className="grid gap-2">
                <Button
                  type="button"
                  size="default"
                  className={methodBtnClass}
                  onClick={() => void copy("Halyk", KZT_REQUISITES.halyk)}
                >
                  {PAYMENT_TEXT.copyHalyk}
                </Button>
                <Button
                  type="button"
                  size="default"
                  className={methodBtnClass}
                  onClick={() => void copy("Kaspi", KZT_REQUISITES.kaspi)}
                >
                  {PAYMENT_TEXT.copyKaspi}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setStep("list");
                  }}
                >
                  {PAYMENT_TEXT.kztClose}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {RUB_METHODS.map((m) => (
                <Button
                  key={m.id}
                  type="button"
                  size="default"
                  disabled={busy}
                  className={methodBtnClass}
                  onClick={() => void onSelectRub(m.id)}
                >
                  {m.label}
                </Button>
              ))}
              <Button
                type="button"
                size="default"
                disabled={busy}
                className={methodBtnClass}
                onClick={() => setStep("kzt")}
              >
                {PAYMENT_TEXT.methodKzt}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
