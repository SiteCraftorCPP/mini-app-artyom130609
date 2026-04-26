import { AppText } from "@/ui/app-text";
import { TAG } from "@/ui/app-text/model";
import { Spinner } from "@/ui/spinner";

import { useVirtsPopupContent } from "../hooks";
import type { VirtPopupType } from "../model/virt-popup.type";
import { HOME_SCREEN_TEXT } from "@/shared/constants/home-screen";

import { VirtCard } from "@/entities/virt";

type VirtsPopupContentProps = {
  enabled: boolean;
  type: VirtPopupType;
};

export const VirtsPopupContent = ({
  enabled,
  type,
}: VirtsPopupContentProps) => {
  const { data, isLoading } = useVirtsPopupContent({ enabled, type });

  if (isLoading) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center">
        <Spinner className="min-h-0" classNameLoader="mb-0 border-white" />
      </div>
    );
  }

  if (type === "services") {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4">
        <AppText
          variant="popupBody"
          size="popupBody"
          tag={TAG.p}
          className="text-balance"
        >
          {HOME_SCREEN_TEXT.popups.servicesBody}
        </AppText>
        {/*
         * Плашки направлений (OTHER_SERVICES_MOCK) — оставляем в коде; когда будет оформление заявок, раскомментировать:
         *
         * <ul className="flex flex-col gap-2">
         *   {data?.map((virt) => (
         *     <li key={virt.id}>
         *       <VirtCard virt={virt} interactive={false} />
         *     </li>
         *   ))}
         * </ul>
         */}
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2 px-4 pb-4">
      {data?.map((virt) => (
        <li key={virt.id}>
          <VirtCard virt={virt} interactive={false} />
        </li>
      ))}
    </ul>
  );
};
