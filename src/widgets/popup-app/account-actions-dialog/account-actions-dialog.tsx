import type { ReactNode } from "react";
import { useState } from "react";

import { AppText } from "@/ui/app-text";
import { TAG } from "@/ui/app-text/model";

import { ACCOUNT_ACTION_DIALOG_TEXT } from "./model";
import { AccountCurrentOrders } from "./ui/account-current-orders";
import { AccountOrderDetail } from "./ui/account-order-detail";
import { AccountOrderHistory } from "./ui/account-order-history";
import { PopupAppHeader } from "@/widgets/popup-app";
import { PopupApp } from "@/widgets/popup-app";

export type AccountActionId = "currentOrders" | "orderHistory" | "referral";

type AccountActionsDialogProps = {
  actionId: AccountActionId;
  children: ReactNode;
  /** Открыть диалог сразу (deep link из бота: /profile?open=currentOrders) */
  defaultOpen?: boolean;
};

export const AccountActionsDialog = ({
  actionId,
  children,
  defaultOpen = false,
}: AccountActionsDialogProps) => {
  const action = ACCOUNT_ACTION_DIALOG_TEXT[actionId];
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [open, setOpen] = useState(defaultOpen);
  const isHistoryDetail = actionId === "orderHistory" && selectedOrderId;

  return (
    <PopupApp
      open={open}
      setOpen={setOpen}
      contentClassName="h-[var(--buy-account-popup-height)] !max-h-[var(--buy-account-popup-height)]"
      slot={
        <PopupAppHeader
          title={action.title}
          onBack={isHistoryDetail ? () => setSelectedOrderId(null) : undefined}
        />
      }
      content={renderAccountActionContent({
        actionId,
        content: action.content,
        selectedOrderId,
        setSelectedOrderId,
      })}
    >
      {children}
    </PopupApp>
  );
};

const renderAccountActionContent = ({
  actionId,
  content,
  selectedOrderId,
  setSelectedOrderId,
}: {
  actionId: AccountActionId;
  content: string;
  selectedOrderId: string | null;
  setSelectedOrderId: (orderId: string) => void;
}) => {
  if (actionId === "currentOrders") {
    return <AccountCurrentOrders />;
  }

  if (actionId === "orderHistory") {
    return selectedOrderId ? (
      <AccountOrderDetail orderId={selectedOrderId} />
    ) : (
      <AccountOrderHistory onSelectOrder={setSelectedOrderId} />
    );
  }

  return (
    <div className="px-4 pb-4">
      <AppText tag={TAG.p} variant="popupBody" size="popupBody">
        {content}
      </AppText>
    </div>
  );
};
