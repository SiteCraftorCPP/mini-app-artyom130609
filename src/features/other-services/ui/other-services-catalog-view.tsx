import { useMemo, useState } from "react";

import type { VirtGradientToken } from "@/entities/virt";
import { AppText } from "@/ui/app-text";
import { TAG } from "@/ui/app-text/model";
import { Button } from "@/ui/button";
import { SUPPORT_CHAT_URL } from "@/shared/constants/common";
import { VIRT_GRADIENT_CLASSES } from "@/shared/constants/virt-gradients";
import type {
  OtherServiceGame,
  OtherServiceItem,
  OtherServiceMain,
  OtherServiceSubsection,
  OtherServicesCatalogV1,
} from "@/shared/types/other-services-catalog";
import { cn } from "@/shared/utils";

const PLAQUE_GRADIENTS: VirtGradientToken[] = [
  "blue",
  "dark",
  "pink",
  "purple",
  "red",
  "yellow",
  "orange",
  "gold",
  "grey",
];

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]!.charAt(0)}${parts[1]!.charAt(0)}`.toUpperCase();
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
        {item.paymentMode === "info" && item.paymentInfo ? (
          <div className="rounded-md border border-cyan-500/25 bg-[#0a1415] p-2.5">
            <AppText
              tag={TAG.p}
              variant="primaryMedium"
              size="small"
              className="!whitespace-pre-wrap !text-left text-white/90"
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

function SubChipRow({
  subsections,
  activeId,
  onSelect,
}: {
  subsections: OtherServiceSubsection[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="hide-scrollbar mb-2 flex min-w-0 flex-nowrap gap-2 overflow-x-auto pb-1">
      {subsections.map((s) => {
        const isOn = s.id === activeId;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              onSelect(s.id);
            }}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-left transition",
              isOn
                ? "border-cyan-400/70 bg-cyan-500/20 shadow-[0_0_0_1px_rgba(34,211,238,0.15)]"
                : "border-white/10 bg-white/5 hover:bg-white/10",
            )}
          >
            <AppText variant="primaryStrong" size="small" className="!max-w-[10rem] !truncate !leading-tight">
              {s.name}
            </AppText>
          </button>
        );
      })}
    </div>
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
      <div className="mb-3">
        <AppText variant="primaryStrong" size="headerInfo" className="!text-left !tracking-tight !text-base">
          {main.name}
        </AppText>
        <div className="mt-1 h-px w-full max-w-full bg-gradient-to-r from-cyan-500/50 via-white/10 to-transparent" />
      </div>
      {hasSub && activeSub ? (
        <>
          <SubChipRow
            subsections={main.subsections}
            activeId={activeSub.id}
            onSelect={setSubId}
          />
          {activeSub.items.length === 0 ? (
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

  const current: OtherServiceGame = useMemo(() => {
    const k = selectedId ?? games[0]!.id;
    return games.find((g) => g.id === k) ?? games[0]!;
  }, [games, selectedId]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-5 px-3 pb-4 sm:px-4">
      <div className="hide-scrollbar -mx-1 flex min-w-0 flex-nowrap gap-2.5 overflow-x-auto px-1 pb-1">
        {games.map((g, idx) => {
          const isActive = (selectedId ?? games[0]!.id) === g.id;
          const grad = PLAQUE_GRADIENTS[idx % PLAQUE_GRADIENTS.length]!;
          return (
            <Button
              key={g.id}
              type="button"
              variant="virtCard"
              size="virtCard"
              onClick={() => {
                setSelectedId(g.id);
              }}
              className="min-w-[8.2rem] max-w-[13rem] shrink-0"
            >
              <span
                className={cn(
                  "m-px flex min-h-14 w-full min-w-0 items-center gap-2.5 rounded-[10px] px-2.5 py-2.5",
                  VIRT_GRADIENT_CLASSES[grad],
                  isActive && "ring-2 ring-cyan-300/50 ring-offset-0 ring-offset-black/5",
                )}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-black/20 text-[11px] font-bold text-white/95">
                  {initialsFromName(g.name)}
                </span>
                <AppText
                  variant="primaryStrong"
                  size="small"
                  className="!line-clamp-2 min-w-0 !flex-1 !text-left !leading-tight"
                >
                  {g.name}
                </AppText>
              </span>
            </Button>
          );
        })}
      </div>

      {current.mainSections.length === 0 ? (
        <AppText tag={TAG.p} variant="primaryMedium" size="small" className="!text-left text-white/45">
          Пусто.
        </AppText>
      ) : null}

      <ul className="flex flex-col gap-8">
        {current.mainSections.map((main) => (
          <MainSectionBlock key={main.id} main={main} />
        ))}
      </ul>
    </div>
  );
};
