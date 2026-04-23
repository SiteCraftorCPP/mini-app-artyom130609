import { useState } from "react";

import { AppText, TAG } from "@/ui/app-text";
import { Button } from "@/ui/button";

import {
  getOrderPeriodMockStats,
  ORDER_ADMIN_TEXT,
  ORDER_PERIOD_OPTIONS,
  ORDER_PERIOD_STATS_UI,
  type OrderPeriodKey,
} from "@/entities/order";

type View = { kind: "menu" } | { kind: "result"; key: OrderPeriodKey };

export const AccountOrderPeriodStats = () => {
  const [view, setView] = useState<View>({ kind: "menu" });

  if (view.kind === "result") {
    const option = ORDER_PERIOD_OPTIONS.find((o) => o.key === view.key);
    const label = option?.label ?? view.key;
    const { count, totalRub } = getOrderPeriodMockStats(view.key);
    return (
      <div className="flex min-w-0 flex-col gap-3 px-4 pb-4">
        <AppText
          tag={TAG.p}
          variant="primaryMedium"
          size="small"
          className="!text-left"
        >
          {ORDER_PERIOD_STATS_UI.resultHint(label)}
        </AppText>
        <AppText
          tag={TAG.p}
          variant="popupBody"
          size="popupBody"
          className="!text-left"
        >
          {ORDER_PERIOD_STATS_UI.countLine(count)}
        </AppText>
        <AppText
          tag={TAG.p}
          variant="popupBody"
          size="popupBody"
          className="!text-left"
        >
          {ORDER_PERIOD_STATS_UI.totalLine(totalRub.toFixed(2))}
        </AppText>
        <Button
          type="button"
          variant="popupSubmit"
          size="popupSubmit"
          className="w-full"
          onClick={() => setView({ kind: "menu" })}
        >
          {ORDER_ADMIN_TEXT.periodStatsBackToMenu}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-2 px-4 pb-4">
      <AppText
        tag={TAG.p}
        variant="primaryMedium"
        size="small"
        className="!mb-2 !text-left"
      >
        {ORDER_PERIOD_STATS_UI.prompt}
      </AppText>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {ORDER_PERIOD_OPTIONS.map((opt) => (
          <li key={opt.key}>
            <Button
              type="button"
              variant="accountMenu"
              size="accountMenu"
              className="h-auto min-h-12 w-full max-w-full border-white/50 py-2.5 text-left"
              onClick={() => setView({ kind: "result", key: opt.key })}
            >
              <AppText
                variant="primaryStrong"
                size="small"
                className="!line-clamp-3 !whitespace-normal !break-words"
              >
                {opt.label}
              </AppText>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};
