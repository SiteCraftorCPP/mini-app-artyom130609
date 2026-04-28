import { type ReactNode, useEffect, useState } from "react";

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
  const [servicesDrillGameId, setServicesDrillGameId] = useState<string | null>(
    null,
  );
  const [servicesDrillMainId, setServicesDrillMainId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!open) {
      setServicesDrillGameId(null);
      setServicesDrillMainId(null);
    }
  }, [open]);

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
  const isServicesAction = actionId === "services";

  /** «Назад»: вложенный virt / подразделы «Другие услуги». */
  const shouldShowBackButton =
    (Boolean(virtPopupFlow.activeVirtId) &&
      (isBuyVirtsAction || isSellVirtsAction || isBuyAccountAction)) ||
    (isServicesAction &&
      (servicesDrillGameId !== null || servicesDrillMainId !== null));

  let content: ReactNode;
  if (isBuyVirtsAction) {
    content = <FlowBuyVirt flow={virtPopupFlow} />;
  } else if (isSellVirtsAction) {
    content = <FlowSellVirt flow={virtPopupFlow} />;
  } else if (isBuyAccountAction) {
    content = <FlowBuyAccount flow={virtPopupFlow} />;
  } else if (virtPopupType) {
    content = (
      <VirtsPopupContent
        enabled={open}
        type={virtPopupType}
        otherServicesDrilledGameId={servicesDrillGameId}
        onOtherServicesDrillGame={(id) => {
          setServicesDrillGameId(id);
          setServicesDrillMainId(null);
        }}
        otherServicesDrilledMainId={servicesDrillMainId}
        onOtherServicesDrillMain={setServicesDrillMainId}
      />
    );
  } else {
    content = <DefaultContent description={description} />;
  }

  return (
    <PopupApp
      contentClassName="!min-h-0"
      contentBodyClassName={
        isFormCenteredFlow ? "flex flex-1 flex-col justify-start" : undefined
      }
      /** Видимый скролл только в выпадашках (сервер и т.д.), не на всём попапе — иначе двойной трек у края экрана. */
      scrollAreaVariant="hidden"
      dialogVariant="popup"
      open={open}
      setOpen={setOpen}
      slot={
        <PopupAppHeader
          title={title}
          onBack={
            shouldShowBackButton
              ? () => {
                  if (isServicesAction && servicesDrillMainId !== null) {
                    setServicesDrillMainId(null);
                    return;
                  }
                  if (isServicesAction && servicesDrillGameId !== null) {
                    setServicesDrillGameId(null);
                    return;
                  }
                  virtPopupFlow.onBack();
                }
              : undefined
          }
        />
      }
      content={content}
    >
      {children}
    </PopupApp>
  );
};
