import { Loader2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { useAuthMe } from "@/entities/user/hooks/use-auth-me";
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

const methodBtnClass =
  "min-h-14 w-full justify-center rounded-[14px] border border-app-border-soft px-3 py-3.5 text-center text-sm leading-snug font-semibold text-white shadow-[0_8px_20px_var(--app-shadow)] tw-bg-popup-submit hover:brightness-110 active:brightness-90 sm:text-[15px]";

const partialBalanceToggleClass = cn(
  methodBtnClass,
  "grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-3.5",
);

function buildPrepareInput(
  method: PaymentMethodCode | "balance",
  initData: string,
  amountRub: number,
  ctx: PaymentDialogContext,
  streampayPreset?: StreampayFiatPreset,
  useBalance?: boolean,
): PaymentPrepareInput & { useBalance?: boolean } {
  const sp =
    method === "streampay" && streampayPreset ? { streampayPreset } : {};
  if (ctx.orderKind === "virt") {
    return {
      initData,
      orderKind: "virt",
      method: method as PaymentMethodCode,
      amountRub,
      game: ctx.game,
      server: ctx.server,
      bankAccount: ctx.bankAccount,
      virtAmountLabel: ctx.virtAmountLabel,
      transferMethod: ctx.transferMethod,
      promoCode: ctx.promoCode,
      useBalance,
      ...sp,
    };
  }
  if (ctx.orderKind === "account") {
    return {
      initData,
      orderKind: "account",
      method: method as PaymentMethodCode,
      amountRub,
      game: ctx.game,
      server: ctx.server,
      transferMethod: ctx.transferMethod,
      accountMode: ctx.accountMode,
      accountOptionLabel: ctx.accountOptionLabel,
      useBalance,
      ...sp,
    };
  }
  return {
    initData,
    orderKind: "other_service",
    method: method as PaymentMethodCode,
    amountRub,
    otherService: ctx.otherService,
    useBalance,
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
  const [useBalance, setUseBalance] = useState(false);
  const { data: user, refetch: refetchUser } = useAuthMe();

  const balance = user?.balance ?? 0;
  const balanceToDeduct = useBalance ? Math.min(balance, amountRub) : 0;
  const amountToPay = amountRub - balanceToDeduct;

  useEffect(() => {
    if (open) {
      setBusy(false);
      setUseBalance(false);
      void refetchUser();
    }
  }, [open, refetchUser]);

  const resetAndClose = useCallback(
    (v: boolean) => {
      if (!v) {
        setBusy(false);
      }
      onOpenChange(v);
    },
    [onOpenChange],
  );

  const submitPayment = useCallback(
    async (
      method: PaymentMethodCode | "balance",
      streampayPreset?: StreampayFiatPreset,
      deductFromBalance = false,
    ) => {
      if (!initData.trim() || !context) {
        showErrorMessage("Откройте магазин из Telegram (кнопка в боте), не из обычного браузера.");
        return;
      }
      if (!Number.isFinite(amountRub) || amountRub <= 0) {
        showErrorMessage("Некорректная сумма. Вернитесь к форме и проверьте рубли.");
        return;
      }

      const willUseBalance = deductFromBalance || useBalance;
      const remainder = willUseBalance ? Math.max(0, amountRub - balance) : amountRub;

      if (method === "balance") {
        if (balance <= 0) {
          showErrorMessage("На балансе нет средств.");
          return;
        }
        if (balance < amountRub) {
          showErrorMessage(
            `На балансе ${formatNumberWithSpaces(balance)} ${CURRENCY.RUB} — недостаточно. Включите «Частично с баланса» и выберите способ доплаты.`,
          );
          return;
        }
      } else if (willUseBalance && remainder > 0) {
        const minRub = minRubForPaymentMethod(method, streampayPreset);
        if (remainder + 1e-9 < minRub) {
          showErrorMessage(
            method === "sbp"
              ? PAYMENT_TEXT.paymentMinSbp(minRub)
              : method === "streampay"
                ? PAYMENT_TEXT.paymentMinStreamPay(minRub, streampayPreset)
                : PAYMENT_TEXT.paymentMinCard(minRub),
          );
          return;
        }
      } else if (!willUseBalance) {
        const minRub = minRubForPaymentMethod(method, streampayPreset);
        if (amountRub + 1e-9 < minRub) {
          showErrorMessage(
            method === "sbp"
              ? PAYMENT_TEXT.paymentMinSbp(minRub)
              : method === "streampay"
                ? PAYMENT_TEXT.paymentMinStreamPay(minRub, streampayPreset)
                : PAYMENT_TEXT.paymentMinCard(minRub),
          );
          return;
        }
      }

      setBusy(true);
      try {
        const body = buildPrepareInput(
          method === "balance" ? "sbp" : method,
          initData,
          amountRub,
          context,
          streampayPreset,
          method === "balance" ? true : willUseBalance,
        );
        const res = await requestPaymentPrepare(body as PaymentPrepareInput & { useBalance?: boolean });
        if (res.payUrl === "balance_success") {
          showSuccessMessage("Оплата успешно списана с баланса!");
          void refetchUser();
          resetAndClose(false);
          return;
        }
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
    [amountRub, balance, context, initData, refetchUser, resetAndClose, useBalance],
  );

  if (!context) {
    return null;
  }

  const amountLine = `${formatNumberWithSpaces(Math.round(amountToPay * 100) / 100)} ${CURRENCY.RUB}`.replace(
    /\s/g,
    "\u00a0",
  );
  const balanceLine = `${formatNumberWithSpaces(Math.round(balance * 100) / 100)} ${CURRENCY.RUB}`.replace(
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
              <Button
                type="button"
                size="default"
                disabled={busy || balance <= 0}
                className={cn(methodBtnClass, "flex-col items-center gap-0.5 py-3", balance <= 0 && "opacity-60")}
                onClick={() => void submitPayment("balance", undefined, true)}
              >
                <span>Оплатить с баланса</span>
                <span className="text-xs font-medium opacity-90">
                  {balance > 0
                    ? `Доступно: ${balanceLine}`
                    : "На балансе 0 ₽"}
                </span>
              </Button>

              {balance > 0 && balance < amountRub && (
                <div
                  role="switch"
                  aria-checked={useBalance}
                  tabIndex={0}
                  className={cn(partialBalanceToggleClass, "cursor-pointer")}
                  onClick={() => !busy && setUseBalance(!useBalance)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (!busy) {
                        setUseBalance(!useBalance);
                      }
                    }
                  }}
                >
                  <span aria-hidden className="col-start-1" />
                  <span className="col-start-2 text-center text-[15px] font-bold leading-snug text-white">
                    Частично с баланса
                  </span>
                  <div
                    className={cn(
                      "col-start-3 inline-flex h-6 w-11 shrink-0 items-center justify-self-end rounded-full transition-colors duration-200 ease-in-out",
                      useBalance ? "bg-app-highlight" : "bg-app-border-soft",
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        useBalance ? "translate-x-5" : "translate-x-0.5",
                      )}
                    />
                  </div>
                </div>
              )}

              {RUB_METHODS.map((m) => (
                <Button
                  key={m.rowKey}
                  type="button"
                  size="default"
                  disabled={busy}
                  className={methodBtnClass}
                  onClick={() => void submitPayment(m.method, m.streampayPreset)}
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
