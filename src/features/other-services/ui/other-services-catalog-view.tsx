import { useWebApp } from "@vkruglikov/react-telegram-web-app";
import { useEffect, useMemo, useState } from "react";

import { AppText } from "@/ui/app-text";
import { TAG } from "@/ui/app-text/model";
import { Button } from "@/ui/button";
import {
  PaymentMethodDialog,
  type PaymentDialogContext,
} from "@/features/payment/payment-method-dialog";
import { SUPPORT_CHAT_URL } from "@/shared/constants/common";
import {
  HOME_ACTION_GRADIENTS,
  HOME_ACTION_GRADIENT_TOKEN,
  HOME_ACTION_ICON,
} from "@/shared/constants/home-screen";
import type {
  OtherServiceItem,
  OtherServiceMain,
  OtherServicePayOption,
  OtherServicesCatalogV1,
} from "@/shared/types/other-services-catalog";
import { cn } from "@/shared/utils";

const SERVICES_PILL_GRADIENT =
  HOME_ACTION_GRADIENTS[HOME_ACTION_GRADIENT_TOKEN.green];
const SERVICES_PILL_ICON = HOME_ACTION_ICON.services;

/** Строки «Ключ: значение» или произвольный текст в одной колонке. */
function descriptionToRows(description: string): { label: string; value: string }[] {
  const lines = description
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return [];
  }
  const rows: { label: string; value: string }[] = [];
  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx > 0 && idx < line.length - 1) {
      rows.push({
        label: line.slice(0, idx).trim(),
        value: line.slice(idx + 1).trim(),
      });
    } else {
      rows.push({ label: "", value: line });
    }
  }
  if (rows.length > 0 && rows.every((r) => !r.label)) {
    return [{ label: "", value: rows.map((r) => r.value).join("\n") }];
  }
  return rows;
}

function PayOptionsBar({ options }: { options: OtherServicePayOption[] }) {
  if (options.length === 0) {
    return null;
  }
  return (
    <ul className="mt-3 flex flex-col gap-2">
      {options.map((o) => (
        <li key={o.id} className="w-full min-w-0">
          <a
            href={o.payUrl}
            target="_blank"
            rel="noreferrer"
            className="flex w-full min-w-0 items-center justify-between gap-2 rounded-full border border-white/20 bg-gradient-to-r from-teal-500/95 via-emerald-600/90 to-teal-950/95 px-2 py-2 shadow-[0_8px_20px_rgba(0,0,0,0.35)] active:brightness-95"
          >
            <span className="min-w-0 max-w-[58%] truncate rounded-full bg-white/25 px-3 py-2 text-center text-sm font-bold text-white">
              {o.priceLabel}
            </span>
            <span className="shrink-0 rounded-full bg-black/40 px-4 py-2 text-center text-sm font-bold text-white">
              {o.payLabel ?? "Оплатить"}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function SectionPill({
  title,
  subtitle,
  onClick,
}: {
  title: string;
  subtitle?: string;
  onClick?: () => void;
}) {
  const hasSubtitle = Boolean(subtitle?.trim());
  const shellClass = cn(
    "relative flex w-full justify-start overflow-hidden rounded-full border border-white/30 px-8 text-left",
    SERVICES_PILL_GRADIENT,
    hasSubtitle ? "h-auto min-h-20 items-start py-3" : "h-20 items-center",
  );

  const inner = (
    <>
      <div
        className={cn(
          "relative z-10 min-w-0 max-w-[calc(100%-4.5rem)]",
          !hasSubtitle && "self-center",
        )}
      >
        <AppText
          className="relative z-10 text-[22px] font-bold leading-tight tracking-tight"
          variant="heroButton"
          size="heroButton"
        >
          {title}
        </AppText>
        {hasSubtitle ? (
          <AppText
            tag={TAG.p}
            variant="primaryMedium"
            size="small"
            className="!mt-1 !line-clamp-6 !whitespace-pre-wrap !text-left !text-white/90"
          >
            {subtitle!.trim()}
          </AppText>
        ) : null}
      </div>
      <span className="pointer-events-none absolute top-0 right-0 z-0 block text-white [&_svg]:size-auto [&_svg]:max-h-none [&_svg]:max-w-none">
        {SERVICES_PILL_ICON}
      </span>
    </>
  );

  if (onClick) {
    return (
      <Button
        type="button"
        variant="brand"
        size="pill"
        onClick={onClick}
        className={shellClass}
      >
        {inner}
      </Button>
    );
  }

  return (
    <div
      className={cn(shellClass, "shadow-[0_10px_30px_var(--app-shadow)]")}
    >
      {inner}
    </div>
  );
}

function ServiceItemCard({
  item,
  onOpenOtherServicePay,
}: {
  item: OtherServiceItem;
  onOpenOtherServicePay: (p: {
    amountRub: number;
    itemId: string;
    mode: "auto" | "manual";
  }) => void;
}) {
  const rows = descriptionToRows(item.description);

  return (
    <li className="w-full min-w-0">
      <div
        className={cn(
          "flex flex-col rounded-2xl border border-white/12 p-4",
          "bg-[#1a1d1f] shadow-[0_10px_28px_rgba(0,0,0,0.45)]",
        )}
      >
        {rows.length > 0 ? (
          <ul className="flex flex-col gap-2.5">
            {rows.map((r, i) => (
              <li key={i} className="min-w-0">
                {r.label ? (
                  <div className="flex min-w-0 w-full flex-col items-stretch gap-1">
                    <AppText
                      tag={TAG.p}
                      variant="primaryMedium"
                      size="small"
                      className="!w-full !text-left !text-white/55"
                    >
                      {r.label}:
                    </AppText>
                    <AppText
                      tag={TAG.p}
                      variant="primaryStrong"
                      size="small"
                      className="!w-full !text-left !font-bold !text-white !whitespace-pre-wrap !break-words"
                    >
                      {r.value}
                    </AppText>
                  </div>
                ) : (
                  <AppText
                    tag={TAG.p}
                    variant="primaryStrong"
                    size="medium"
                    className="!w-full !whitespace-pre-wrap !text-left !font-bold !text-white !break-words"
                  >
                    {r.value}
                  </AppText>
                )}
              </li>
            ))}
          </ul>
        ) : null}

        {item.paymentMode === "info" && item.paymentInfo ? (
          <div className="mt-3 border-t border-white/10 pt-3">
            <AppText
              tag={TAG.p}
              variant="primaryMedium"
              size="small"
              className="!whitespace-pre-wrap !text-left !text-white/80"
            >
              {item.paymentInfo}
            </AppText>
          </div>
        ) : null}

        {item.paymentMode === "pay" && item.payOptions?.length ? (
          <PayOptionsBar options={item.payOptions} />
        ) : null}

        {item.paymentMode === "manager" ? (
          <Button
            asChild
            variant="popupSubmit"
            size="popupSubmit"
            className="mt-3 h-9 w-full justify-center rounded-full border border-white/15 bg-teal-700/90 shadow-md hover:brightness-110"
          >
            <a href={SUPPORT_CHAT_URL} target="_blank" rel="noreferrer">
              <AppText variant="primaryStrong" size="small">
                Написать менеджеру
              </AppText>
            </a>
          </Button>
        ) : null}

        {item.paymentMode === "auto" || item.paymentMode === "manual" ? (
          <div className="mt-3 border-t border-white/10 pt-3">
            {item.amountRub != null &&
            Number.isFinite(item.amountRub) &&
            item.amountRub > 0 ? (
              <>
                <Button
                  type="button"
                  variant="popupSubmit"
                  size="popupSubmit"
                  className="h-11 min-h-11 w-full justify-center rounded-full border border-white/15 bg-gradient-to-r from-teal-600/95 to-emerald-800/95 px-4 py-2 shadow-md hover:brightness-110"
                  onClick={() => {
                    const mode = item.paymentMode;
                    if (mode !== "auto" && mode !== "manual") {
                      return;
                    }
                    onOpenOtherServicePay({
                      amountRub: item.amountRub!,
                      itemId: item.id,
                      mode,
                    });
                  }}
                >
                  <span className="text-center text-sm font-semibold leading-snug text-white">
                    Оплатить{" "}
                    {new Intl.NumberFormat("ru-RU").format(
                      Math.round(item.amountRub! * 100) / 100,
                    )}{" "}
                    ₽
                  </span>
                </Button>
                <AppText
                  tag={TAG.p}
                  variant="primaryMedium"
                  size="small"
                  className="!mt-2 !text-center !text-white/65"
                >
                  {item.paymentMode === "auto"
                    ? "После оплаты товар придёт вам в чат с ботом"
                    : "После оплаты заказ уйдёт администратору; когда выдачу подтвердят — вы получите товар в чат."}
                </AppText>
              </>
            ) : (
              <AppText
                tag={TAG.p}
                variant="primaryMedium"
                size="small"
                className="!text-amber-200/90"
              >
                Сумма не настроена. Попросите администратора задать цену для этой
                позиции.
              </AppText>
            )}
          </div>
        ) : null}
      </div>
    </li>
  );
}

function ItemsList({
  items,
  onOpenOtherServicePay,
}: {
  items: OtherServiceItem[];
  onOpenOtherServicePay: (p: {
    amountRub: number;
    itemId: string;
    mode: "auto" | "manual";
  }) => void;
}) {
  if (items.length === 0) {
    return null;
  }
  return (
    <ul className="flex flex-col gap-3 px-4 pt-1">
      {items.map((it) => (
        <ServiceItemCard
          key={it.id}
          item={it}
          onOpenOtherServicePay={onOpenOtherServicePay}
        />
      ))}
    </ul>
  );
}

type Props = {
  catalog: OtherServicesCatalogV1;
  drilledGameId: string | null;
  drilledMainId: string | null;
  onDrillGame: (gameId: string | null) => void;
  onDrillMain: (mainId: string | null) => void;
};

export const OtherServicesCatalogView = ({
  catalog,
  drilledGameId,
  drilledMainId,
  onDrillGame,
  onDrillMain,
}: Props) => {
  const games = catalog.games;
  const webApp = useWebApp();
  const initData = useMemo(() => {
    const fromHook = webApp?.initData?.trim();
    if (fromHook) {
      return fromHook;
    }
    if (typeof window !== "undefined") {
      const raw = (
        window as { Telegram?: { WebApp?: { initData?: string } } }
      ).Telegram?.WebApp?.initData?.trim();
      if (raw) {
        return raw;
      }
    }
    return "";
  }, [webApp?.initData]);

  const [payState, setPayState] = useState<{
    amountRub: number;
    context: PaymentDialogContext;
  } | null>(null);

  const openOtherServicePay =
    (gameId: string, mainId: string | null) =>
    (p: { amountRub: number; itemId: string; mode: "auto" | "manual" }) => {
      setPayState({
        amountRub: p.amountRub,
        context: {
          orderKind: "other_service",
          otherService: {
            itemId: p.itemId,
            gameId,
            mainId,
            mode: p.mode,
          },
        },
      });
    };

  const paymentDialog = (
    <PaymentMethodDialog
      open={payState !== null}
      onOpenChange={(v) => {
        if (!v) {
          setPayState(null);
        }
      }}
      initData={initData}
      amountRub={payState?.amountRub ?? 0}
      context={payState?.context ?? null}
    />
  );

  useEffect(() => {
    if (
      drilledGameId !== null &&
      !games.some((g) => g.id === drilledGameId)
    ) {
      onDrillGame(null);
      onDrillMain(null);
    }
  }, [games, drilledGameId, onDrillGame, onDrillMain]);

  const activeGame =
    drilledGameId === null
      ? undefined
      : games.find((g) => g.id === drilledGameId);

  useEffect(() => {
    if (!activeGame || drilledMainId === null) {
      return;
    }
    if (!activeGame.mainSections.some((m) => m.id === drilledMainId)) {
      onDrillMain(null);
    }
  }, [activeGame, drilledMainId, onDrillMain]);

  if (games.length === 0) {
    return null;
  }

  if (drilledGameId === null) {
    return (
      <>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-auto pb-4">
          <ul className="flex flex-col gap-3 px-4 pt-1">
            {games.map((g) => (
              <li key={g.id} className="w-full min-w-0">
                <SectionPill
                  title={g.name}
                  onClick={() => {
                    onDrillGame(g.id);
                    onDrillMain(null);
                  }}
                />
              </li>
            ))}
          </ul>
        </div>
        {paymentDialog}
      </>
    );
  }

  if (!activeGame) {
    return null;
  }

  if (drilledMainId !== null) {
    const main = activeGame.mainSections.find((m) => m.id === drilledMainId);
    if (!main) {
      return null;
    }
    return (
      <>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-auto pb-4">
          <ItemsList
            items={main.items}
            onOpenOtherServicePay={openOtherServicePay(activeGame.id, main.id)}
          />
        </div>
        {paymentDialog}
      </>
    );
  }

  const subs = activeGame.mainSections;
  const rootItems = activeGame.items ?? [];

  if (subs.length === 0) {
    return (
      <>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-auto pb-4">
          <ItemsList
            items={rootItems}
            onOpenOtherServicePay={openOtherServicePay(activeGame.id, null)}
          />
        </div>
        {paymentDialog}
      </>
    );
  }

  return (
    <>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-auto pb-4">
        <ul className="flex flex-col gap-3 px-4 pt-1">
          {subs.map((main: OtherServiceMain) => (
            <li key={main.id} className="w-full min-w-0">
              <SectionPill
                title={main.name}
                subtitle={main.description}
                onClick={() => onDrillMain(main.id)}
              />
            </li>
          ))}
        </ul>
      </div>
      {paymentDialog}
    </>
  );
}
