import { type ReactNode, useState } from "react";

import { AppText } from "@/ui/app-text";
import { TAG } from "@/ui/app-text/model";

import { PopupApp } from "../default/popup-app";
import { PopupAppHeader } from "../default/popup-app-header";

import { FlowBuyAccount } from "./ui/flow-buy-account";
import { FlowSellVirt } from "./ui/flow-sell-virt";
import { FlowBuyVirt } from "./ui/fow-buy-virt";
import {
  type VirtPopupType,
  VirtsPopupContent,
  useVirtPopupFlow,
} from "@/features/virt";

type DefaultContentProps = {
  description: string;
};

const DefaultContent = ({ description }: DefaultContentProps) => (
  <AppText variant="popupBody" size="popupBody" tag={TAG.p}>
    {description}
  </AppText>
);

type HomeActionDialogProps = {
  actionId: string;
  children: ReactNode;
  description: string;
  title: string;
};

export const HomeActionDialog = ({
  actionId,
  children,
  description,
  title,
}: HomeActionDialogProps) => {
  const [open, setOpen] = useState(false);

  const actionToVirtType: Record<string, VirtPopupType | null> = {
    "buy-virtual-currency": "buy",
    "sell-virtual-currency": "sell",
    "buy-account": "buy-accounts",
    services: "services",
  };
  const virtPopupType = actionToVirtType[actionId] ?? null;

  const virtPopupFlow = useVirtPopupFlow({
    enabled: open,
    type: virtPopupType || "buy",
  });

  const isBuyVirtsAction = actionId === "buy-virtual-currency";
  const isSellVirtsAction = actionId === "sell-virtual-currency";
  const isBuyAccountAction = actionId === "buy-account";
  const isFormCenteredFlow = isBuyVirtsAction || isBuyAccountAction;
  /** Показываем «назад», как только выбран пункт (даже пока грузится virt по id). */
  const shouldShowBackButton =
    (isBuyVirtsAction || isSellVirtsAction || isBuyAccountAction) &&
    Boolean(virtPopupFlow.selectedVirtId);

  let content: ReactNode;
  if (isBuyVirtsAction) {
    content = <FlowBuyVirt flow={virtPopupFlow} />;
  } else if (isSellVirtsAction) {
    content = <FlowSellVirt flow={virtPopupFlow} />;
  } else if (isBuyAccountAction) {
    content = <FlowBuyAccount flow={virtPopupFlow} />;
  } else if (virtPopupType) {
    content = <VirtsPopupContent enabled={open} type={virtPopupType} />;
  } else {
    content = <DefaultContent description={description} />;
  }

  return (
    <PopupApp
      contentClassName="!min-h-0"
      contentBodyClassName={
        isFormCenteredFlow ? "flex flex-1 flex-col justify-start" : undefined
      }
      dialogVariant="popup"
      open={open}
      setOpen={setOpen}
      slot={
        <PopupAppHeader
          title={title}
          onBack={shouldShowBackButton ? virtPopupFlow.onBack : undefined}
        />
      }
      content={content}
    >
      {children}
    </PopupApp>
  );
};
