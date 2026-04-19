import { Spinner } from "@/ui/spinner";

import { useVirtsPopupContent } from "../hooks";
import type { VirtPopupType } from "../model/virt-popup.type";

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
