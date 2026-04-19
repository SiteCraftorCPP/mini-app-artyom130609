import { AppText } from "@/ui/app-text";
import { Spinner } from "@/ui/spinner";

import { TEXT } from "@/shared/constants/text";

import { AccountOrderCard, useGetHistoryOrders } from "@/entities/order";

type AccountOrderHistoryProps = {
  onSelectOrder: (orderId: string) => void;
};

export const AccountOrderHistory = ({
  onSelectOrder,
}: AccountOrderHistoryProps) => {
  const { data: orders = [], isLoading } = useGetHistoryOrders();

  if (isLoading) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Spinner className="min-h-0" classNameLoader="mb-0 border-white" />
      </div>
    );
  }

  if (!orders.length) {
    return (
      <AppText variant="popupBody" size="popupBody">
        {TEXT.base.empty}
      </AppText>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-x-3 gap-y-4 px-4 pb-4">
      {orders.map((order) => (
        <AccountOrderCard
          key={order.id}
          order={order}
          onClick={() => onSelectOrder(order.id)}
        />
      ))}
    </div>
  );
};
