import { VirtCard } from "@/entities/virt";
import type { useVirtPopupFlow } from "@/features/virt";

type FlowDefaultProps = {
  flow: ReturnType<typeof useVirtPopupFlow>;
};

export const FlowDefault = ({ flow }: FlowDefaultProps) => {
  return (
    <ul className="scrollbar-app flex max-h-[min(70vh,560px)] min-h-0 flex-col gap-2 overflow-y-scroll px-4 pb-4">
      {flow.data?.map((virt) => (
        <li key={virt.id}>
          <VirtCard virt={virt} onClick={() => flow.onSelectVirt(virt.id)} />
        </li>
      ))}
    </ul>
  );
};
