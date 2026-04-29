import { ArrowLeft, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useWebApp } from "@vkruglikov/react-telegram-web-app";

import { KZT_REQUISITES, rubToKztAmount } from "@/shared/constants/payment-requisites-kzt";
import { CURRENCY } from "@/shared/constants/common";
import { PAYMENT_TEXT, TEXT } from "@/shared/constants/text";
import { formatNumberWithSpaces } from "@/shared/lib/format-numbers";
import {
  type KztPrepareInput,
  type PaymentMethodCode,
  type PaymentPrepareInput,
  openPaymentUrl,
  requestKztPrepare,
  requestPaymentPrepare,
} from "@/shared/lib/prepare-payment";
import { showErrorMessage, showSuccessMessage } from "@/shared/lib/notify";
import { savePostPaymentNotice } from "@/features/payment/post-payment-notice-storage";
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
    }
  | {
      orderKind: "other_service";
      otherService: {
        itemId: string;
        gameId: string;
        mainId: string | null;
        mode: "auto" | "manual";
      };
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
  if (ctx.orderKind === "account") {
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
  return {
    initData,
    orderKind: "other_service",
    method,
    amountRub,
    otherService: ctx.otherService,
  };
}

function buildKztPrepareInput(
  initData: string,
  amountRub: number,
  ctx: PaymentDialogContext,
): KztPrepareInput {
  if (ctx.orderKind === "virt") {
    return {
      initData,
      orderKind: "virt",
      amountRub,
      game: ctx.game,
      server: ctx.server,
      bankAccount: ctx.bankAccount,
      virtAmountLabel: ctx.virtAmountLabel,
      transferMethod: ctx.transferMethod,
      promoCode: ctx.promoCode,
    };
  }
  if (ctx.orderKind === "account") {
    return {
      initData,
      orderKind: "account",
      amountRub,
      game: ctx.game,
      server: ctx.server,
      transferMethod: ctx.transferMethod,
      accountMode: ctx.accountMode,
      accountOptionLabel: ctx.accountOptionLabel,
    };
  }
  return {
    initData,
    orderKind: "other_service",
    amountRub,
    otherService: ctx.otherService,
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
  const webApp = useWebApp();
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
        const res = await requestPaymentPrepare(body);
        savePostPaymentNotice({
          orderNumber: res.orderNumber,
          orderId: res.orderId,
          orderKind: context.orderKind,
          otherMode:
            context.orderKind === "other_service"
              ? context.otherService.mode
              : undefined,
        });
        const opened = openPaymentUrl(res.payUrl);
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

  const onKztPaid = useCallback(async () => {
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
      const body = buildKztPrepareInput(initData, amountRub, context);
      const res = await requestKztPrepare(body);
      const url = `https://t.me/${res.botUsername}?start=${encodeURIComponent(res.startParam)}`;
      const w = webApp as {
        openTelegramLink?: (u: string) => void;
        openLink?: (u: string, o?: { try_instant_view?: boolean }) => void;
      };
      if (typeof w.openTelegramLink === "function") {
        w.openTelegramLink(url);
      } else if (typeof w.openLink === "function") {
        w.openLink(url, { try_instant_view: false });
      } else {
        openPaymentUrl(url);
      }
      resetAndClose(false);
    } catch (e) {
      showErrorMessage(formatErr(e));
    } finally {
      setBusy(false);
    }
  }, [amountRub, context, initData, resetAndClose, webApp]);

  if (!context) {
    return null;
  }

  const amountLine = `${formatNumberWithSpaces(Math.round(amountRub * 100) / 100)} ${CURRENCY.RUB}`.replace(
    /\s/g,
    "\u00a0",
  );
  const amountKztLine =
    Number.isFinite(amountRub) && amountRub > 0
      ? `${formatNumberWithSpaces(rubToKztAmount(Math.round(amountRub * 100) / 100))} ₸`.replace(
          /\s/g,
          "\u00a0",
        )
      : "";

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
                  className="text-app-text-muted flex size-8 items-center justify-center rounded-[4px] border-0 bg-white/5 transition hover:bg-white/10 hover:brightness-110"
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
                  className="text-app-text-muted mt-1.5 text-center text-xs font-medium"
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
            <div className="mt-2 flex flex-1 flex-col justify-start gap-4 px-1 pb-6">
              <AppText
                tag={TAG.p}
                variant="darkStrong"
                className="text-app-text-muted text-center text-xs font-medium leading-snug whitespace-pre-line"
              >
                {PAYMENT_TEXT.kztInstructions}
              </AppText>
              <AppText
                tag={TAG.p}
                variant="darkStrong"
                className="text-app-text-muted text-center text-xs font-semibold leading-snug whitespace-pre-line"
              >
                {PAYMENT_TEXT.kztRateLine}
                {amountKztLine
                  ? `\nК перечислению в тенге (ориентир): ${amountLine} ≈ ${amountKztLine}`
                  : ""}
              </AppText>
              <div className="flex flex-col gap-3">
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
                  size="default"
                  disabled={busy}
                  className={cn(methodBtnClass, "!font-bold")}
                  onClick={() => void onKztPaid()}
                >
                  {PAYMENT_TEXT.kztPaidButton}
                </Button>
              </div>
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
              {context.orderKind !== "other_service" ? (
                <Button
                  type="button"
                  size="default"
                  disabled={busy}
                  className={cn(methodBtnClass, "mt-0.5")}
                  onClick={() => setStep("kzt")}
                >
                  {PAYMENT_TEXT.methodKzt}
                </Button>
              ) : null}
            </div>
          )}
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
