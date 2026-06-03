import { VirtCard } from "@/entities/virt";
import type { useVirtPopupFlow } from "@/features/virt";

type FlowDefaultProps = {
  flow: ReturnType<typeof useVirtPopupFlow>;
};

export const FlowDefault = ({ flow }: FlowDefaultProps) => {
  return (
    <ul className="hide-scrollbar flex max-h-[min(70vh,560px)] min-h-0 flex-col gap-2 overflow-y-auto px-4 pb-4 [-webkit-overflow-scrolling:touch]">
      {flow.data?.map((virt) => (
        <li key={virt.id}>
          <VirtCard virt={virt} onClick={() => flow.onSelectVirt(virt.id)} />
        </li>
      ))}
    </ul>
  );
};
