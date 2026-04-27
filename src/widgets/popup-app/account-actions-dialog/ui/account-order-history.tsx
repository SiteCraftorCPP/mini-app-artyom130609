import { AppText, TAG } from "@/ui/app-text";
import { Button } from "@/ui/button";
import { Spinner } from "@/ui/spinner";

import { TEXT } from "@/shared/constants/text";

import {
  AccountOrderCard,
  useGetHistoryOrders,
  type Order,
} from "@/entities/order";
import { ORDER_ADMIN_TEXT } from "@/entities/order/model";
import { useIsTelegramAdmin } from "@/shared/hooks/use-is-telegram-admin";

const stripAt = (u: string) => u.replace(/^@/, "");

function formatAdminListLine(order: Order): string {
  const cat = order.categoryLabel ?? "—";
  const un = order.telegramUsername ? stripAt(order.telegramUsername) : "—";
  return `#${order.id} (${cat}) - @${un}`;
}

type AccountOrderHistoryProps = {
  onSelectOrder: (orderId: string) => void;
};

export const AccountOrderHistory = ({
  onSelectOrder,
}: AccountOrderHistoryProps) => {
  const isAdmin = useIsTelegramAdmin();
  const { data: orders = [], isLoading } = useGetHistoryOrders();

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
          className="!text-left text-[#8C8C8C]"
        >
          {ORDER_ADMIN_TEXT.history50Header}
        </AppText>
        <ul className="flex min-h-0 min-w-0 max-h-[min(60vh,480px)] flex-col gap-2 overflow-y-auto">
          {orders.map((order) => (
            <li key={order.id} className="min-w-0">
              <Button
                type="button"
                variant="accountMenu"
                size="accountMenu"
                className="h-auto min-h-12 w-full max-w-full shrink [background-image:none] border border-white/10 !bg-[#1A1A1A] py-3 text-left shadow-none hover:brightness-105"
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
