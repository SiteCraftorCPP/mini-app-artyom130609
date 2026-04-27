import { useMemo, useState } from "react";

import { AppText } from "@/ui/app-text";
import { TAG } from "@/ui/app-text/model";
import { Button } from "@/ui/button";
import { SUPPORT_CHAT_URL } from "@/shared/constants/common";
import {
  HOME_ACTION_GRADIENTS,
  HOME_ACTION_GRADIENT_TOKEN,
  HOME_ACTION_ICON,
} from "@/shared/constants/home-screen";
import type {
  OtherServiceItem,
  OtherServiceMain,
  OtherServicesCatalogV1,
} from "@/shared/types/other-services-catalog";
import { cn } from "@/shared/utils";

const SECTION_GRADIENT = HOME_ACTION_GRADIENTS[HOME_ACTION_GRADIENT_TOKEN.aqua];
/** Иконка в углу как у «Купить вирты» (сумка). */
const PLASH_ICON = HOME_ACTION_ICON.currency;

function SectionPill({
  title,
  subtitle,
  active,
  onClick,
}: {
  title: string;
  subtitle?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <span className="pointer-events-none absolute top-1/2 right-2 z-0 max-h-16 -translate-y-1/2 text-white/35 [&_svg]:max-h-16">
        {PLASH_ICON}
      </span>
      <div className="relative z-10 min-w-0 pr-14">
        <AppText
          className="!text-left text-[20px] font-bold leading-tight tracking-tight md:text-[22px]"
          variant="heroButton"
          size="heroButton"
        >
          {title}
        </AppText>
        {subtitle?.trim() ? (
          <AppText
            tag={TAG.p}
            variant="primaryMedium"
            size="small"
            className="!mt-1 !line-clamp-3 !whitespace-pre-wrap !text-left !text-white/90"
          >
            {subtitle.trim()}
          </AppText>
        ) : null}
      </div>
    </>
  );

  if (onClick) {
    return (
      <Button
        type="button"
        variant="brand"
        size="pill"
        onClick={onClick}
        className={cn(
          "relative flex min-h-20 w-full items-start justify-center overflow-visible border border-white/30 py-3 pl-6 pr-20 text-left",
          SECTION_GRADIENT,
          active && "ring-2 ring-white/45",
        )}
      >
        {inner}
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "relative flex min-h-20 w-full items-start justify-center overflow-visible rounded-full border border-white/30 py-3 pl-6 pr-20 text-left",
        SECTION_GRADIENT,
      )}
    >
      {inner}
    </div>
  );
}

function ServiceItemCard({ item }: { item: OtherServiceItem }) {
  return (
    <li className="w-full min-w-0">
      <div className="flex flex-col gap-3 rounded-[12px] border border-white/10 bg-white p-3 shadow-sm">
        <AppText
          variant="primaryStrong"
          size="medium"
          className="!whitespace-pre-wrap !text-left !text-neutral-900"
        >
          {item.description}
        </AppText>
        {item.paymentMode === "info" && item.paymentInfo ? (
          <div className="rounded-md border border-neutral-200 bg-neutral-50 p-2.5">
            <AppText
              tag={TAG.p}
              variant="primaryMedium"
              size="small"
              className="!whitespace-pre-wrap !text-left !text-neutral-800"
            >
              {item.paymentInfo}
            </AppText>
          </div>
        ) : null}
        {item.paymentMode === "manager" ? (
          <Button
            asChild
            variant="popupSubmit"
            size="popupSubmit"
            className="h-9 w-full justify-center"
          >
            <a href={SUPPORT_CHAT_URL} target="_blank" rel="noreferrer">
              <AppText variant="primaryStrong" size="small">
                Написать менеджеру
              </AppText>
            </a>
          </Button>
        ) : null}
      </div>
    </li>
  );
}

function MainSectionBlock({ main }: { main: OtherServiceMain }) {
  return (
    <li className="min-w-0">
      <div className="mb-3 w-full min-w-0">
        <SectionPill title={main.name} subtitle={main.description} />
      </div>
      {main.items.length === 0 ? (
        <AppText
          tag={TAG.p}
          variant="primaryMedium"
          size="small"
          className="!text-left text-white/45"
        >
          Пока пусто.
        </AppText>
      ) : (
        <ul className="flex flex-col gap-2">
          {main.items.map((it) => (
            <ServiceItemCard key={it.id} item={it} />
          ))}
        </ul>
      )}
    </li>
  );
}

type Props = { catalog: OtherServicesCatalogV1 };

export const OtherServicesCatalogView = ({ catalog }: Props) => {
  const games = catalog.games;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (games.length === 0) {
    return (
      <div className="px-4 pb-4">
        <AppText tag={TAG.p} variant="primaryMedium" size="small" className="!text-left text-white/50">
          Каталог пуст.
        </AppText>
      </div>
    );
  }

  const current = useMemo(() => {
    const k = selectedId ?? games[0]!.id;
    return games.find((g) => g.id === k) ?? games[0]!;
  }, [games, selectedId]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-auto pb-4">
      <ul className="flex flex-col gap-3 px-4 pt-1">
        {games.map((g) => {
          const isActive = (selectedId ?? games[0]!.id) === g.id;
          return (
            <li key={g.id} className="w-full min-w-0">
              <SectionPill
                title={g.name}
                active={isActive}
                onClick={() => {
                  setSelectedId(g.id);
                }}
              />
            </li>
          );
        })}
      </ul>

      {current.mainSections.length === 0 ? (
        <AppText
          tag={TAG.p}
          variant="primaryMedium"
          size="small"
          className="!px-4 !text-left text-white/50"
        >
          В разделе пока нет подразделов — настройка в боте.
        </AppText>
      ) : null}

      <ul className="flex flex-col gap-8 px-4">
        {current.mainSections.map((main) => (
          <MainSectionBlock key={main.id} main={main} />
        ))}
      </ul>
    </div>
  );
};
