import { useEffect } from "react";

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

/** Как кнопка «Другие услуги» на `home-page.tsx`: зелёный градиент + иконка карты справа. */
const SERVICES_PILL_GRADIENT =
  HOME_ACTION_GRADIENTS[HOME_ACTION_GRADIENT_TOKEN.green];
const SERVICES_PILL_ICON = HOME_ACTION_ICON.services;

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
  /** Как `home-page.tsx`: общий `px-8` на плашке, текст не прижат к обводке слева. */
  const shellClass = cn(
    "relative flex w-full justify-start overflow-hidden rounded-full border border-white/30 px-8 text-left",
    SERVICES_PILL_GRADIENT,
    hasSubtitle
      ? "h-auto min-h-20 items-start py-3"
      : "h-20 items-center",
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
      {main.items.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {main.items.map((it) => (
            <ServiceItemCard key={it.id} item={it} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

type Props = {
  catalog: OtherServicesCatalogV1;
  drilledGameId: string | null;
  onDrillGame: (gameId: string | null) => void;
};

export const OtherServicesCatalogView = ({
  catalog,
  drilledGameId,
  onDrillGame,
}: Props) => {
  const games = catalog.games;

  useEffect(() => {
    if (
      drilledGameId !== null &&
      !games.some((g) => g.id === drilledGameId)
    ) {
      onDrillGame(null);
    }
  }, [games, drilledGameId, onDrillGame]);

  if (games.length === 0) {
    return null;
  }

  if (drilledGameId === null) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-auto pb-4">
        <ul className="flex flex-col gap-3 px-4 pt-1">
          {games.map((g) => (
            <li key={g.id} className="w-full min-w-0">
              <SectionPill title={g.name} onClick={() => onDrillGame(g.id)} />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const activeGame = games.find((g) => g.id === drilledGameId);
  if (!activeGame) {
    return null;
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-auto pb-4">
      <ul className="flex flex-col gap-8 px-4 pt-1">
        {activeGame.mainSections.map((main) => (
          <MainSectionBlock key={main.id} main={main} />
        ))}
      </ul>
    </div>
  );
};
