import { VirtCard } from "@/entities/virt";
import type { useVirtPopupFlow } from "@/features/virt";

type FlowDefaultProps = {
  flow: ReturnType<typeof useVirtPopupFlow>;
};

export const FlowDefault = ({ flow }: FlowDefaultProps) => {
  return (
    <ul className="flex flex-col gap-2 px-4 pb-4">
      {flow.data?.map((virt) => (
        <li key={virt.id}>
          <VirtCard virt={virt} onClick={() => flow.onSelectVirt(virt.id)} />
        </li>
      ))}
    </ul>
  );
};
