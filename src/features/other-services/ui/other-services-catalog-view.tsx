import { useMemo, useState } from "react";

import { AppText } from "@/ui/app-text";
import { TAG } from "@/ui/app-text/model";
import { Button } from "@/ui/button";
import { SUPPORT_CHAT_URL } from "@/shared/constants/common";
import type {
  OtherServiceGame,
  OtherServiceItem,
  OtherServicesCatalogV1,
  OtherServicesDelivery,
} from "@/shared/types/other-services-catalog";
import { cn } from "@/shared/utils";
import { VIRTS_ICONS, type VirtProjectIconKey } from "@/shared/constants/virt-icons";

const GAME_TITLES: Record<string, string> = {
  "black-russia": "Black Russia",
  "matryoshka-rp": "Матрешка РП",
  "gta-v-rp": "GTA V RP",
  "majestic-rp": "Majestic RP",
  "arizona-rp": "Arizona RP",
  "radmir-rp": "Radmir RP",
  "province-rp": "Province RP",
  "amazing-rp": "Amazing RP",
  "grand-mobile-rp": "Grand Mobile RP",
};

function gameTitle(pk: string): string {
  return GAME_TITLES[pk] ?? pk;
}

function logoFor(pk: string): string | undefined {
  const k = pk as VirtProjectIconKey;
  if (k in VIRTS_ICONS) {
    return VIRTS_ICONS[k];
  }
  return undefined;
}

function deliveryRu(d: OtherServicesDelivery): string {
  if (d === "manager") {
    return "Через менеджера";
  }
  if (d === "auto") {
    return "Автоматически";
  }
  return "Вручную (данные после оплаты)";
}

function ServiceItemCard({ item }: { item: OtherServiceItem }) {
  return (
    <li className="tw-bg-gradient-card-border flex flex-col gap-2 rounded-[12px] p-px">
      <div
        className={cn(
          "flex min-w-0 flex-col gap-2 rounded-[11px] border border-white/10 bg-[#1A1A1A] p-3",
        )}
      >
        <AppText variant="primaryStrong" size="medium" className="!whitespace-pre-wrap !text-left">
          {item.description}
        </AppText>
        <AppText
          tag={TAG.p}
          variant="primaryMedium"
          size="popupBody"
          className="!text-left text-[#00FF00]"
        >
          {item.price}
        </AppText>
        {item.payment ? (
          <AppText tag={TAG.p} variant="primaryMedium" size="small" className="!text-left text-white/75">
            Оплата: {item.payment}
          </AppText>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded border border-white/20 bg-white/5 px-2 py-0.5 text-[11px] text-[#8C8C8C]">
            {deliveryRu(item.delivery)}
          </span>
        </div>
        {item.delivery === "auto" && item.autoText ? (
          <div className="rounded-md border border-white/10 bg-[#0d1819] p-2">
            <AppText
              tag={TAG.p}
              variant="primaryMedium"
              size="small"
              className="!whitespace-pre-wrap !text-left text-white/90"
            >
              {item.autoText}
            </AppText>
          </div>
        ) : null}
        {item.delivery === "manager" ? (
          <Button asChild variant="popupSubmit" size="popupSubmit" className="h-9 w-full justify-center">
            <a href={SUPPORT_CHAT_URL} target="_blank" rel="noreferrer">
              <AppText variant="primaryStrong" size="small">
                Написать менеджеру
              </AppText>
            </a>
          </Button>
        ) : null}
        {item.delivery === "manual" ? (
          <AppText
            tag={TAG.p}
            variant="primaryMedium"
            size="small"
            className="!text-left text-[#8C8C8C]"
          >
            Реквизиты или доступ пришлём в Telegram после оформления.
          </AppText>
        ) : null}
      </div>
    </li>
  );
}

type Props = { catalog: OtherServicesCatalogV1 };

export const OtherServicesCatalogView = ({ catalog }: Props) => {
  const games = catalog.games;
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  if (games.length === 0) {
    return (
      <div className="px-4 pb-4">
        <AppText
          tag={TAG.p}
          variant="primaryMedium"
          size="small"
          className="!text-left text-[#8C8C8C]"
        >
          Пока нет опубликованных услуг. Загляните позже.
        </AppText>
      </div>
    );
  }

  const current: OtherServiceGame = useMemo(() => {
    const key = selectedKey ?? games[0]!.projectKey;
    return games.find((g) => g.projectKey === key) ?? games[0]!;
  }, [games, selectedKey]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 px-4 pb-4">
      <AppText
        tag={TAG.p}
        variant="primaryMedium"
        size="small"
        className="!text-balance !text-left text-white/80"
      >
        Выберите проект, затем раздел — оформление зависит от типа выдачи (менеджер, автоматически, вручную).
      </AppText>
      <div className="hide-scrollbar flex min-w-0 flex-nowrap gap-2 overflow-x-auto pb-1">
        {games.map((g) => {
          const active = (selectedKey ?? games[0]!.projectKey) === g.projectKey;
          const src = logoFor(g.projectKey);
          return (
            <button
              key={g.projectKey}
              type="button"
              onClick={() => {
                setSelectedKey(g.projectKey);
              }}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full border px-2 py-1.5 transition",
                active
                  ? "border-cyan-400/60 bg-cyan-500/15"
                  : "border-white/10 bg-white/5 hover:bg-white/10",
              )}
            >
              {src ? (
                <img src={src} alt="" className="size-7 shrink-0 object-contain" />
              ) : null}
              <AppText
                variant="primaryStrong"
                size="small"
                className="!max-w-[8rem] !truncate"
              >
                {gameTitle(g.projectKey)}
              </AppText>
            </button>
          );
        })}
      </div>
      {current.mainSections.length === 0 ? (
        <AppText tag={TAG.p} variant="primaryMedium" size="small" className="!text-left text-[#8C8C8C]">
          Для этой игры ещё не добавлены разделы.
        </AppText>
      ) : null}
      <ul className="flex flex-col gap-4">
        {current.mainSections.map((main) => (
          <li key={main.id} className="min-w-0">
            <div className="mb-2">
              <AppText variant="primaryStrong" size="medium" className="!text-left">
                {main.name}
              </AppText>
            </div>
            <ul className="flex flex-col gap-3">
              {main.subsections.map((sub) => (
                <li key={sub.id} className="min-w-0">
                  <div className="mb-1.5">
                    <AppText variant="primaryMedium" size="small" className="!text-left text-[#8C8C8C]">
                      {sub.name}
                    </AppText>
                  </div>
                  {sub.items.length === 0 ? (
                    <AppText tag={TAG.p} variant="primaryMedium" size="small" className="!text-left text-white/50">
                      Пока пусто.
                    </AppText>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {sub.items.map((it) => (
                        <ServiceItemCard key={it.id} item={it} />
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
};
