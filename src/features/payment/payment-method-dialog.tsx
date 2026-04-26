import { ArrowLeft, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { KZT_REQUISITES } from "@/shared/constants/payment-requisites-kzt";
import { CURRENCY } from "@/shared/constants/common";
import { PAYMENT_TEXT, TEXT } from "@/shared/constants/text";
import { formatNumberWithSpaces } from "@/shared/lib/format-numbers";
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

/** Крупные кнопки под палец, читаемый текст */
const methodBtnClass =
  "min-h-14 w-full justify-center rounded-[14px] border border-app-border-soft px-3 py-3.5 text-left text-sm leading-snug font-semibold text-white shadow-[0_8px_20px_var(--app-shadow)] tw-bg-popup-submit hover:brightness-110 active:brightness-90 sm:text-[15px]";

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

function formatErr(e: unknown): string {
  if (e instanceof Error && e.message) {
    return e.message;
  }
  return String(e);
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

  useEffect(() => {
    if (open) {
      setStep("list");
      setBusy(false);
    }
  }, [open]);

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
        showErrorMessage("Откройте магазин из Telegram (кнопка в боте), не из обычного браузера.");
        return;
      }
      if (!Number.isFinite(amountRub) || amountRub <= 0) {
        showErrorMessage("Некорректная сумма. Вернитесь к форме и проверьте рубли.");
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
        const opened = openPaymentUrl(payUrl);
        if (opened) {
          resetAndClose(false);
        } else {
          showErrorMessage(
            "Не удалось открыть оплату в приложении. Обновите Telegram, откройте магазин снова из бота или скопируйте ссылку у поддержки.",
          );
        }
      } catch (e) {
        showErrorMessage(formatErr(e));
      } finally {
        setBusy(false);
      }
    },
    [amountRub, context, initData, resetAndClose],
  );

  if (!context) {
    return null;
  }

  const amountLine = `${formatNumberWithSpaces(Math.round(amountRub * 100) / 100)} ${CURRENCY.RUB}`.replace(
    /\s/g,
    "\u00a0",
  );

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent
        variant="popupFormCentered"
        stackOnTop
        lockBodyScroll
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="flex !max-h-[min(92dvh,700px)] !w-[min(100vw-0.5rem,26rem)] flex-col p-0"
        aria-describedby={undefined}
      >
        {/* шапка: RUB — сумма; KZT — только заголовок (без лишнего текста) */}
        <div
          className={cn(
            "border-app-border-soft text-text-primary flex shrink-0 flex-col gap-2 border-b px-4 pt-3 pb-3.5",
            step === "kzt" && "border-b-0 pb-2",
          )}
        >
          <div className="flex w-full min-w-0 items-start justify-between gap-2">
            <div className="flex w-9 shrink-0 justify-start">
              {step === "kzt" ? (
                <button
                  type="button"
                  className="text-app-text-muted border-app-border-soft/80 flex size-8 items-center justify-center rounded-[4px] border bg-black/20 transition hover:brightness-110"
                  onClick={() => setStep("list")}
                  aria-label={PAYMENT_TEXT.backToMethods}
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              ) : (
                <span className="inline-block size-8 shrink-0" aria-hidden />
              )}
            </div>
            <div className="min-w-0 flex-1 px-1 text-center">
              <AppText
                tag={TAG.p}
                variant="primaryStrong"
                className="text-base leading-tight font-bold tracking-tight"
              >
                {step === "list" ? PAYMENT_TEXT.title : PAYMENT_TEXT.kztBlockTitle}
              </AppText>
              {step === "list" && (
                <AppText
                  tag={TAG.p}
                  variant="darkStrong"
                  className="text-app-text-muted mt-1.5 text-xs font-medium"
                >
                  {PAYMENT_TEXT.subtitleMethods}
                </AppText>
              )}
            </div>
            <div className="flex w-9 shrink-0 justify-end">
              <DialogClose
                className={cn(dialogPopupCloseButtonClassName, "shrink-0")}
                onClick={() => resetAndClose(false)}
              >
                <X className="h-3.5 w-3.5" />
              </DialogClose>
            </div>
          </div>
          {step === "list" && (
            <div className="border-app-border-soft tw-bg-gradient-badge-background/90 flex w-full items-center justify-center rounded-2xl border py-2.5 text-white">
              <AppText tag={TAG.span} variant="primaryStrong" className="text-sm font-bold tabular-nums">
                {amountLine}
              </AppText>
            </div>
          )}
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto overscroll-contain px-4 pb-5 pt-1",
            busy && "pointer-events-none opacity-90",
          )}
        >
          {busy && (
            <div className="text-app-text-muted absolute inset-0 z-10 flex items-center justify-center bg-black/25 backdrop-blur-[2px]">
              <div className="bg-surface-base flex items-center gap-2.5 rounded-2xl border border-white/20 px-4 py-3 shadow-lg">
                <Loader2
                  className="text-app-highlight h-6 w-6 shrink-0 animate-spin"
                  aria-hidden
                />
                <AppText tag={TAG.span} variant="darkStrong" className="text-sm">
                  {PAYMENT_TEXT.preparing}
                </AppText>
              </div>
            </div>
          )}

          {step === "kzt" ? (
            <div className="mt-2 flex flex-1 flex-col justify-center gap-3 px-1 pb-6">
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
            </div>
          ) : (
            <div className="flex flex-col gap-3">
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
                className={cn(methodBtnClass, "mt-0.5 border-dashed border-white/35")}
                onClick={() => setStep("kzt")}
              >
                {PAYMENT_TEXT.methodKzt}
              </Button>
            </div>
          )}
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
