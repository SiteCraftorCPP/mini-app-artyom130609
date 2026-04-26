import type { ReactNode } from "react";
import { useState } from "react";

import { AppText } from "@/ui/app-text";
import { TAG } from "@/ui/app-text/model";

import { ACCOUNT_ACTION_DIALOG_TEXT } from "./model";
import { AccountCurrentOrders } from "./ui/account-current-orders";
import { AccountOrderDetail } from "./ui/account-order-detail";
import { AccountOrderHistory } from "./ui/account-order-history";
import { AccountOrderLookup } from "./ui/account-order-lookup";
import { AccountOrderPeriodStats } from "./ui/account-order-period-stats";
import { AccountOrderStats } from "./ui/account-order-stats";
import { AccountReferral } from "./ui/account-referral";
import { PopupAppHeader } from "@/widgets/popup-app";
import { PopupApp } from "@/widgets/popup-app";

export type AccountActionId =
  | "currentOrders"
  | "orderStats"
  | "orderLookup"
  | "orderHistory"
  | "orderPeriodStats"
  | "referral";

type AccountActionsDialogProps = {
  actionId: AccountActionId;
  children: ReactNode;
  /** Открыть диалог сразу (deep link из бота: /profile?open=currentOrders) */
  defaultOpen?: boolean;
  /** Deep link: /profile?...&orderId=… — показать карточку этого заказа */
  initialOrderIdFromLink?: string | null;
};

export const AccountActionsDialog = ({
  actionId,
  children,
  defaultOpen = false,
  initialOrderIdFromLink = null,
}: AccountActionsDialogProps) => {
  const action = ACCOUNT_ACTION_DIALOG_TEXT[actionId];
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [open, setOpen] = useState(defaultOpen);
  const [focusedCurrentOrderId, setFocusedCurrentOrderId] = useState<
    string | null
  >(() =>
    actionId === "currentOrders" && initialOrderIdFromLink
      ? initialOrderIdFromLink
      : null,
  );

  const isHistoryDetail = actionId === "orderHistory" && selectedOrderId;
  const isCurrentDetail =
    actionId === "currentOrders" && Boolean(focusedCurrentOrderId);

  return (
    <PopupApp
      open={open}
      setOpen={setOpen}
      contentClassName="!min-h-0"
      slot={
        <PopupAppHeader
          title={action.title}
          onBack={
            isHistoryDetail
              ? () => setSelectedOrderId(null)
              : isCurrentDetail
                ? () => setFocusedCurrentOrderId(null)
                : undefined
          }
        />
      }
      content={renderAccountActionContent({
        actionId,
        content: action.content,
        focusedCurrentOrderId,
        selectedOrderId,
        setSelectedOrderId,
        setFocusedCurrentOrderId,
      })}
    >
      {children}
    </PopupApp>
  );
};

const renderAccountActionContent = ({
  actionId,
  content,
  focusedCurrentOrderId,
  selectedOrderId,
  setSelectedOrderId,
  setFocusedCurrentOrderId,
}: {
  actionId: AccountActionId;
  content: string;
  focusedCurrentOrderId: string | null;
  selectedOrderId: string | null;
  setSelectedOrderId: (orderId: string) => void;
  setFocusedCurrentOrderId: (orderId: string) => void;
}) => {
  if (actionId === "currentOrders") {
    if (focusedCurrentOrderId) {
      return <AccountOrderDetail orderId={focusedCurrentOrderId} />;
    }
    return <AccountCurrentOrders onSelectOrder={setFocusedCurrentOrderId} />;
  }

  if (actionId === "orderStats") {
    return <AccountOrderStats />;
  }

  if (actionId === "orderLookup") {
    return <AccountOrderLookup />;
  }

  if (actionId === "orderPeriodStats") {
    return <AccountOrderPeriodStats />;
  }

  if (actionId === "orderHistory") {
    return selectedOrderId ? (
      <AccountOrderDetail orderId={selectedOrderId} />
    ) : (
      <AccountOrderHistory onSelectOrder={setSelectedOrderId} />
    );
  }

  if (actionId === "referral") {
    return <AccountReferral />;
  }

  return (
    <div className="px-4 pb-4">
      <AppText tag={TAG.p} variant="popupBody" size="popupBody">
        {content}
      </AppText>
    </div>
  );
};
