import { AppText } from "@/ui/app-text";
import { Spinner } from "@/ui/spinner";

import { TEXT } from "@/shared/constants/text";

import {
  AccountOrderCard,
  AccountOrderInfoPanel,
  useGetOrderById,
} from "@/entities/order";

type AccountOrderDetailProps = {
  orderId: string;
};

export const AccountOrderDetail = ({ orderId }: AccountOrderDetailProps) => {
  const { data: order, isLoading } = useGetOrderById({ id: orderId });

  if (isLoading) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Spinner className="min-h-0" classNameLoader="mb-0 border-white" />
      </div>
    );
  }

  if (!order) {
    return (
      <AppText variant="popupBody" size="popupBody">
        {TEXT.base.empty}
      </AppText>
    );
  }

  return (
    <div className="flex gap-3 px-4 pb-4">
      <AccountOrderCard order={order} />
      <AccountOrderInfoPanel order={order} showClosedAt />
    </div>
  );
};
