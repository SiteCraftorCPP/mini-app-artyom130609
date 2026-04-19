import { AppText } from "@/ui/app-text";
import { Button } from "@/ui/button";

import { showMessage } from "@/shared/lib/notify";

import CopyIcon from "@/assets/icon/copy.svg";

import { ORDER_INFO_TEXT } from "../model/order-info.constants";
import type { Order } from "../model";

type AccountOrderInfoPanelProps = {
  order: Order;
  showClosedAt?: boolean;
};

export const AccountOrderInfoPanel = ({
  order,
  showClosedAt = false,
}: AccountOrderInfoPanelProps) => {
  const handleCopyOrderNumber = async () => {
    await navigator.clipboard.writeText(order.number);
    showMessage(ORDER_INFO_TEXT.copied);
  };

  return (
    <div className="bg-order-panel flex-1 rounded-[8px] p-4">
      <div className="flex flex-col gap-2">
        <OrderLine
          label={ORDER_INFO_TEXT.createdAt}
          value={`${order.title} ${order.time}`}
        />
        <OrderLine label={ORDER_INFO_TEXT.game} value={order.game} />
        <OrderLine label={ORDER_INFO_TEXT.server} value={order.server} />
        <OrderLine
          label={ORDER_INFO_TEXT.subject}
          value={order.accountNumber}
        />
        {showClosedAt ? (
          <OrderLine
            label={ORDER_INFO_TEXT.closedAt}
            value={`${order.title} ${order.completedAt}`}
          />
        ) : null}
        <div className="mt-1 flex items-center justify-between gap-3">
          <OrderLine label={ORDER_INFO_TEXT.orderNumber} value={order.number} />
          <Button
            type="button"
            variant="popupSubmit"
            size="popupSubmit"
            onClick={handleCopyOrderNumber}
            className="rounded-[4px] p-1"
          >
            <CopyIcon className="text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const OrderLine = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="flex flex-wrap gap-1">
      <AppText variant="primaryMedium" size="small">
        {label}
      </AppText>
      <AppText variant="primaryMedium" size="small">
        {value}
      </AppText>
    </div>
  );
};
