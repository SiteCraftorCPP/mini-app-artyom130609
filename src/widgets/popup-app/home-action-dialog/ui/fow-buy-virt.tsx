import { Spinner } from "@/ui/spinner";

import { FlowDefault } from "./default/flow-default";
import { VirtRequestForm, type useVirtPopupFlow } from "@/features/virt";

type FlowBuyVirtProps = {
  flow: ReturnType<typeof useVirtPopupFlow>;
};

export const FlowBuyVirt = ({ flow }: FlowBuyVirtProps) => {
  if (flow.isLoading || flow.isVirtLoading) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center">
        <Spinner className="min-h-0" classNameLoader="mb-0 border-white" />
      </div>
    );
  }

  if (flow.selectedVirt) {
    return <VirtRequestForm virt={flow.selectedVirt} />;
  }

  return <FlowDefault flow={flow} />;
};
