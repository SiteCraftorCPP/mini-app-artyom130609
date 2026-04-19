import { Spinner } from "@/ui/spinner";

import { FlowDefault } from "./default/flow-default";
import { BuyAccountOptions, useVirtPopupFlow } from "@/features/virt";

type FlowBuyAccountProps = {
  flow: ReturnType<typeof useVirtPopupFlow>;
};

export const FlowBuyAccount = ({ flow }: FlowBuyAccountProps) => {
  if (flow.isLoading || flow.isVirtLoading) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center">
        <Spinner className="min-h-0" classNameLoader="mb-0 border-white" />
      </div>
    );
  }

  if (flow.selectedVirt) {
    return (
      <BuyAccountOptions
        virt={flow.selectedVirt}
        onBackStateChange={flow.registerNestedBackHandler}
      />
    );
  }

  return <FlowDefault flow={flow} />;
};
