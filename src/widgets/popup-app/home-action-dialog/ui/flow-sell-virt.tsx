import { Spinner } from "@/ui/spinner";

import { FlowDefault } from "./default/flow-default";
import { VirtSell, type useVirtPopupFlow } from "@/features/virt";

type FlowSellVirtProps = {
  flow: ReturnType<typeof useVirtPopupFlow>;
};

export const FlowSellVirt = ({ flow }: FlowSellVirtProps) => {
  if (flow.isLoading || flow.isVirtLoading) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center">
        <Spinner className="min-h-0" classNameLoader="mb-0 border-white" />
      </div>
    );
  }

  if (flow.selectedVirt) {
    return <VirtSell virt={flow.selectedVirt} />;
  }

  return <FlowDefault flow={flow} />;
};
