import { useMemo, useState } from "react";

import { AppText } from "@/ui/app-text";
import { TAG } from "@/ui/app-text/model";
import { Button } from "@/ui/button";
import { SUPPORT_CHAT_URL } from "@/shared/constants/common";
import { BUY_VIRTS_MOCK } from "@/shared/mock/buy-virts.mock";
import { VIRT_GRADIENT_CLASSES } from "@/shared/constants/virt-gradients";
import type { VirtGradientToken } from "@/entities/virt";
import type {
  OtherServiceItem,
  OtherServiceMain,
  OtherServiceSubsection,
  OtherServicesCatalogV1,
} from "@/shared/types/other-services-catalog";
import { cn } from "@/shared/utils";

/** Второй уровень (подраздел-переключатель) — нейтральный тёмный, как «внутри» выбранного. */
const SUB_GRADIENT: VirtGradientToken = "dark";

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
    <ul className="flex w-full min-w-0 flex-col gap-2">
      {subsections.map((s) => {
        const isOn = s.id === activeId;
        return (
          <li key={s.id} className="w-full min-w-0">
            <Button
              type="button"
              variant="virtCard"
              size="virtCard"
              onClick={() => {
                onSelect(s.id);
              }}
              className="w-full"
            >
              <span
                className={cn(
                  "m-px flex w-full min-w-0 items-center rounded-[10px] px-3 py-2.5",
                  VIRT_GRADIENT_CLASSES[SUB_GRADIENT],
                  isOn && "ring-1 ring-white/40",
                )}
              >
                <AppText
                  variant="primaryStrong"
                  size="headerInfo"
                  className="!line-clamp-2 min-w-0 w-full !text-left !text-base !leading-snug"
                >
                  {s.name}
                </AppText>
              </span>
            </Button>
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
        <div className="tw-bg-gradient-virt-card-border tw-shadow-virt-card w-full min-w-0 overflow-hidden rounded-[12px] p-px text-left">
          <div
            className={cn(
              "m-px flex w-full min-w-0 items-center rounded-[10px] px-3 py-3",
              VIRT_GRADIENT_CLASSES.red,
            )}
          >
            <AppText
              variant="primaryStrong"
              size="xxxl"
              className="!line-clamp-3 min-w-0 w-full !text-left !leading-snug"
            >
              {main.name}
            </AppText>
          </div>
        </div>
      </div>
      {hasSub && activeSub ? (
        <>
          <SubSectionPicker
            subsections={main.subsections}
            activeId={activeSub.id}
            onSelect={setSubId}
          />
          {activeSub.description?.trim() ? (
            <AppText
              tag={TAG.p}
              variant="primaryMedium"
              size="small"
              className="!mb-3 !whitespace-pre-wrap !px-0 !text-left !text-white/80"
            >
              {activeSub.description.trim()}
            </AppText>
          ) : null}
          {activeSub.items.length === 0 ? (
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
      <ul className="flex flex-col gap-2 px-4">
        {games.map((g, idx) => {
          const isActive = (selectedId ?? games[0]!.id) === g.id;
          const grad: VirtGradientToken =
            BUY_VIRTS_MOCK[idx % BUY_VIRTS_MOCK.length]!.gradientToken;
          return (
            <li key={g.id} className="w-full min-w-0">
              <Button
                type="button"
                variant="virtCard"
                size="virtCard"
                onClick={() => {
                  setSelectedId(g.id);
                }}
                className="w-full"
              >
                <span
                  className={cn(
                    "m-px flex w-full min-w-0 items-center rounded-[10px] px-3 py-3",
                    VIRT_GRADIENT_CLASSES[grad],
                    isActive && "ring-1 ring-white/40",
                  )}
                >
                  <AppText
                    variant="primaryStrong"
                    size="xxxl"
                    className="!line-clamp-3 min-w-0 w-full !text-left !leading-snug"
                  >
                    {g.name}
                  </AppText>
                </span>
              </Button>
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
