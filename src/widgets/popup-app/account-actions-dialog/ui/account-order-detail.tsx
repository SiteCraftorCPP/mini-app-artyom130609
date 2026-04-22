import { AppText } from "@/ui/app-text";
import { Spinner } from "@/ui/spinner";

import {
  AccountOrderCard,
  AccountOrderInfoPanel,
  useGetOrderById,
} from "@/entities/order";
import { TEXT } from "@/shared/constants/text";
import { useIsTelegramAdmin } from "@/shared/hooks/use-is-telegram-admin";

import { AccountAdminOrderDetail } from "./account-order-admin-detail";

type AccountOrderDetailProps = {
  orderId: string;
};

const isAdminDetailModel = (order: {
  categoryLabel?: string;
  openedAtLine?: string;
  telegramUserId?: string;
}) => Boolean(order.openedAtLine && order.categoryLabel && order.telegramUserId);

export const AccountOrderDetail = ({ orderId }: AccountOrderDetailProps) => {
  const isAdmin = useIsTelegramAdmin();
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
      <div className="px-4 pb-4">
        <AppText variant="popupBody" size="popupBody">
          {TEXT.base.empty}
        </AppText>
      </div>
    );
  }

  if (isAdmin && isAdminDetailModel(order)) {
    return <AccountAdminOrderDetail order={order} />;
  }

  return (
    <div className="flex gap-3 px-4 pb-4">
      <AccountOrderCard order={order} />
      <AccountOrderInfoPanel order={order} showClosedAt />
    </div>
  );
};
