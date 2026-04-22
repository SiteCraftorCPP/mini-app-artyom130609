import { AppText, TAG } from "@/ui/app-text";
import { Button } from "@/ui/button";
import { Spinner } from "@/ui/spinner";

import {
  AccountOrderCard,
  AccountOrderInfoPanel,
  useGetOrders,
  type Order,
} from "@/entities/order";
import { ORDER_ADMIN_TEXT } from "@/entities/order/model";
import { TEXT } from "@/shared/constants/text";
import { useIsTelegramAdmin } from "@/shared/hooks/use-is-telegram-admin";

const stripAt = (u: string) => u.replace(/^@/, "");

function formatAdminListLine(order: Order): string {
  const cat = order.categoryLabel ?? "—";
  const un = order.telegramUsername ? stripAt(order.telegramUsername) : "—";
  return `#${order.id} (${cat}) - @${un}`;
}

type AccountCurrentOrdersProps = {
  onSelectOrder: (orderId: string) => void;
};

export const AccountCurrentOrders = ({
  onSelectOrder,
}: AccountCurrentOrdersProps) => {
  const isAdmin = useIsTelegramAdmin();
  const { data: orders = [], isLoading } = useGetOrders();

  if (isLoading) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Spinner className="min-h-0" classNameLoader="mb-0 border-white" />
      </div>
    );
  }

  if (isAdmin) {
    if (!orders.length) {
      return (
        <div className="px-4 pb-4">
          <AppText variant="popupBody" size="popupBody">
            {TEXT.base.empty}
          </AppText>
        </div>
      );
    }
    return (
      <div className="flex min-h-0 w-full min-w-0 flex-col gap-3 px-4 pb-4">
        <AppText
          tag={TAG.p}
          variant="primaryMedium"
          size="small"
          className="!text-left"
        >
          {ORDER_ADMIN_TEXT.pendingHeader}
        </AppText>
        <ul className="flex min-w-0 flex-col gap-2">
          {orders.map((order) => (
            <li key={order.id} className="min-w-0">
              <Button
                type="button"
                variant="accountMenu"
                size="accountMenu"
                className="h-auto min-h-12 w-full max-w-full shrink border-white/50 py-3 text-left"
                onClick={() => onSelectOrder(order.id)}
              >
                <AppText
                  variant="primaryStrong"
                  size="small"
                  className="!line-clamp-3 !whitespace-normal !break-words text-left"
                >
                  {formatAdminListLine(order)}
                </AppText>
              </Button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const [order] = orders;

  if (!order) {
    return (
      <div className="px-4 pb-4">
        <AppText variant="popupBody" size="popupBody">
          {TEXT.base.empty}
        </AppText>
      </div>
    );
  }

  return (
    <div className="flex gap-3 px-4 pb-4">
      <AccountOrderCard order={order} />
      <AccountOrderInfoPanel order={order} />
    </div>
  );
};
