import { Loader2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  minRubForPaymentMethod,
} from "@/shared/constants/payment-method-limits";
import { CURRENCY } from "@/shared/constants/common";
import { PAYMENT_TEXT } from "@/shared/constants/text";
import { formatNumberWithSpaces } from "@/shared/lib/format-numbers";
import {
  type PaymentMethodCode,
  type PaymentPrepareInput,
  type StreampayFiatPreset,
  openPaymentUrl,
  requestPaymentPrepare,
} from "@/shared/lib/prepare-payment";
import { showErrorMessage } from "@/shared/lib/notify";
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

/** Кнопки StreamPay: разные подписи + `streampayPreset` в prepare (в заказе/логах); сумма и валюта API как в ЛК (USDT, payment_type из env). */
const RUB_METHODS: {
  rowKey: string;
  method: PaymentMethodCode;
  label: string;
  streampayPreset?: StreampayFiatPreset;
}[] = [
  { rowKey: "sbp", method: "sbp", label: PAYMENT_TEXT.methodSbp },
  { rowKey: "mir", method: "mir", label: PAYMENT_TEXT.methodMir },
  { rowKey: "card_rub", method: "card_rub", label: PAYMENT_TEXT.methodCard },
  { rowKey: "streampay-tenge", method: "streampay", label: "Тенге (Казахстан)", streampayPreset: "tenge" },
  { rowKey: "streampay-uah", method: "streampay", label: "Гривны (Украина)", streampayPreset: "uah" },
  { rowKey: "streampay-aze", method: "streampay", label: "Манат (Азербайджан)", streampayPreset: "azn" },
  { rowKey: "streampay-byn", method: "streampay", label: "Белорусский рубль", streampayPreset: "byn" },
];

/** Крупные кнопки под палец, читаемый текст */
const methodBtnClass =
  "min-h-14 w-full justify-center rounded-[14px] border border-app-border-soft px-3 py-3.5 text-left text-sm leading-snug font-semibold text-white shadow-[0_8px_20px_var(--app-shadow)] tw-bg-popup-submit hover:brightness-110 active:brightness-90 sm:text-[15px]";

function buildPrepareInput(
  method: PaymentMethodCode,
  initData: string,
  amountRub: number,
  ctx: PaymentDialogContext,
  streampayPreset?: StreampayFiatPreset,
): PaymentPrepareInput {
  const sp =
    method === "streampay" && streampayPreset ? { streampayPreset } : {};
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
      ...sp,
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
      ...sp,
    };
  }
  return {
    initData,
    orderKind: "other_service",
    method,
    amountRub,
    otherService: ctx.otherService,
    ...sp,
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
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setBusy(false);
    }
  }, [open]);

  const resetAndClose = useCallback(
    (v: boolean) => {
      if (!v) {
        setBusy(false);
      }
      onOpenChange(v);
    },
    [onOpenChange],
  );

  const onSelectRub = useCallback(
    async (method: PaymentMethodCode, streampayPreset?: StreampayFiatPreset) => {
      if (!initData.trim() || !context) {
        showErrorMessage("Откройте магазин из Telegram (кнопка в боте), не из обычного браузера.");
        return;
      }
      if (!Number.isFinite(amountRub) || amountRub <= 0) {
        showErrorMessage("Некорректная сумма. Вернитесь к форме и проверьте рубли.");
        return;
      }
      const minRub = minRubForPaymentMethod(method);
      if (amountRub + 1e-9 < minRub) {
        showErrorMessage(
          method === "sbp"
            ? PAYMENT_TEXT.paymentMinSbp(minRub)
            : method === "streampay"
              ? PAYMENT_TEXT.paymentMinStreamPay(minRub)
              : PAYMENT_TEXT.paymentMinCard(minRub),
        );
        return;
      }
      setBusy(true);
      try {
        const body = buildPrepareInput(
          method,
          initData,
          amountRub,
          context,
          streampayPreset,
        );
        const res = await requestPaymentPrepare(body);
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
        <div
          className={cn(
            "border-app-border-soft text-text-primary flex shrink-0 flex-col gap-2 border-b px-4 pt-3 pb-3.5",
          )}
        >
          <div className="flex w-full min-w-0 items-start justify-between gap-2">
            <div className="flex w-9 shrink-0 justify-start">
              <span className="inline-block size-8 shrink-0" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 px-1 text-center">
              <AppText
                tag={TAG.p}
                variant="primaryStrong"
                className="text-base leading-tight font-bold tracking-tight"
              >
                {PAYMENT_TEXT.title}
              </AppText>
              <AppText
                tag={TAG.p}
                variant="darkStrong"
                className="text-app-text-muted mt-1.5 text-center text-xs font-medium"
              >
                {PAYMENT_TEXT.subtitleMethods}
              </AppText>
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
          <div className="border-app-border-soft tw-bg-gradient-badge-background/90 flex w-full items-center justify-center rounded-2xl border py-2.5 text-white">
            <AppText tag={TAG.span} variant="primaryStrong" className="text-sm font-bold tabular-nums">
              {amountLine}
            </AppText>
          </div>
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

            <div className="mt-2 flex flex-col gap-3">
              {RUB_METHODS.map((m) => (
                <Button
                  key={m.rowKey}
                  type="button"
                  size="default"
                  disabled={busy}
                  className={methodBtnClass}
                  onClick={() => void onSelectRub(m.method, m.streampayPreset)}
                >
                  {m.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
