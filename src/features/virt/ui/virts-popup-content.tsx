import { AppText } from "@/ui/app-text";
import { TAG } from "@/ui/app-text/model";
import { Spinner } from "@/ui/spinner";

import { useVirtsPopupContent } from "../hooks";
import type { VirtPopupType } from "../model/virt-popup.type";

import { useGetOtherServicesCatalog } from "@/entities/other-services/hooks/use-get-other-services-catalog";
import { OtherServicesCatalogView } from "@/features/other-services/ui/other-services-catalog-view";

import { VirtCard } from "@/entities/virt";

type VirtsPopupContentProps = {
  enabled: boolean;
  type: VirtPopupType;
  /** Экран раздела «Другие услуги»: id выбранной игры или null — список разделов. */
  otherServicesDrilledGameId?: string | null;
  onOtherServicesDrillGame?: (gameId: string | null) => void;
};

export const VirtsPopupContent = ({
  enabled,
  type,
  otherServicesDrilledGameId = null,
  onOtherServicesDrillGame = () => {},
}: VirtsPopupContentProps) => {
  const { data, isLoading } = useVirtsPopupContent({ enabled, type });
  const catalogQuery = useGetOtherServicesCatalog({
    enabled: enabled && type === "services",
  });

  if (isLoading) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center">
        <Spinner className="min-h-0" classNameLoader="mb-0 border-white" />
      </div>
    );
  }

  if (type === "services" && !enabled) {
    return null;
  }

  if (type === "services") {
    if (catalogQuery.isLoading) {
      return (
        <div className="flex min-h-full flex-1 items-center justify-center">
          <Spinner className="min-h-0" classNameLoader="mb-0 border-white" />
        </div>
      );
    }
    if (catalogQuery.isError || !catalogQuery.data) {
      return (
        <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4">
          <AppText
            variant="popupBody"
            size="popupBody"
            tag={TAG.p}
            className="text-balance text-red-300/90"
          >
            {catalogQuery.error?.message ?? "Ошибка загрузки."}
          </AppText>
        </div>
      );
    }
    return (
      <OtherServicesCatalogView
        catalog={catalogQuery.data}
        drilledGameId={otherServicesDrilledGameId}
        onDrillGame={onOtherServicesDrillGame}
      />
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
