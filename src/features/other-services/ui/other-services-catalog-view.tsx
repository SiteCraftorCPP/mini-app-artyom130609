import { useMemo, useState } from "react";

import { AppText } from "@/ui/app-text";
import { TAG } from "@/ui/app-text/model";
import { Button } from "@/ui/button";
import { SUPPORT_CHAT_URL } from "@/shared/constants/common";
import {
  HOME_ACTION_GRADIENTS,
  HOME_ACTION_GRADIENT_TOKEN,
} from "@/shared/constants/home-screen";
import type {
  OtherServiceItem,
  OtherServiceMain,
  OtherServiceSubsection,
  OtherServicesCatalogV1,
} from "@/shared/types/other-services-catalog";
import { cn } from "@/shared/utils";

/** Как кнопка «Купить вирты» на главной: бирюзовая pill, только текст. */
const SECTION_GRADIENT = HOME_ACTION_GRADIENTS[HOME_ACTION_GRADIENT_TOKEN.aqua];

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
      <AppText
        className="relative z-10 text-[22px] font-bold leading-tight tracking-tight"
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
          className="relative z-10 mt-1 !line-clamp-3 !whitespace-pre-wrap !text-left !text-white/95"
        >
          {subtitle.trim()}
        </AppText>
      ) : null}
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
          "relative flex min-h-20 w-full flex-col items-stretch justify-center overflow-hidden border border-white/30 px-8 py-3 text-left",
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
        "relative flex min-h-20 w-full flex-col items-stretch justify-center overflow-hidden rounded-full border border-white/30 px-8 py-3 text-left",
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

function SubSectionPicker({
  subsections,
  activeId,
  onSelect,
}: {
  subsections: OtherServiceSubsection[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="flex w-full min-w-0 flex-col gap-3">
      {subsections.map((s) => {
        const isOn = s.id === activeId;
        return (
          <li key={s.id} className="w-full min-w-0">
            <SectionPill
              title={s.name}
              subtitle={s.description}
              active={isOn}
              onClick={() => {
                onSelect(s.id);
              }}
            />
          </li>
        );
      })}
    </ul>
  );
}

function MainSectionBlock({ main }: { main: OtherServiceMain }) {
  const hasSub = main.subsections.length > 0;
  const [subId, setSubId] = useState(() => (hasSub ? main.subsections[0]!.id : ""));

  const activeSub: OtherServiceSubsection | undefined = useMemo(() => {
    if (!hasSub) {
      return undefined;
    }
    return main.subsections.find((s) => s.id === subId) ?? main.subsections[0];
  }, [hasSub, main.subsections, subId]);

  return (
    <li className="min-w-0">
      <div className="mb-3 w-full min-w-0">
        <SectionPill title={main.name} />
      </div>
      {hasSub && activeSub ? (
        <>
          <SubSectionPicker
            subsections={main.subsections}
            activeId={activeSub.id}
            onSelect={setSubId}
          />
          {activeSub.items.length === 0 ? (
            <AppText
              tag={TAG.p}
              variant="primaryMedium"
              size="small"
              className="!mt-3 !text-left text-white/45"
            >
              Пока пусто.
            </AppText>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {activeSub.items.map((it) => (
                <ServiceItemCard key={it.id} item={it} />
              ))}
            </ul>
          )}
        </>
      ) : !hasSub ? (
        main.items.length === 0 ? (
          <AppText
            tag={TAG.p}
            variant="primaryMedium"
            size="small"
            className="!text-left text-white/45"
          >
            Пусто.
          </AppText>
        ) : (
          <ul className="flex flex-col gap-2">
            {main.items.map((it) => (
              <ServiceItemCard key={it.id} item={it} />
            ))}
          </ul>
        )
      ) : null}
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
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 pb-4">
      <ul className="flex flex-col gap-3 px-4">
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
          className="!px-4 !text-left text-white/40"
        >
          Пусто.
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
