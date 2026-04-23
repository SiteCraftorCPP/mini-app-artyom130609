import { AppText, TAG } from "@/ui/app-text";
import { Spinner } from "@/ui/spinner";

import { useGetOrders } from "@/entities/order";
import { ORDER_ADMIN_TEXT } from "@/entities/order/model";
import { useIsTelegramAdmin } from "@/shared/hooks/use-is-telegram-admin";

function sumOrdersRub(orders: { amountRub?: number }[]) {
  return orders.reduce(
    (s, o) => s + (typeof o.amountRub === "number" ? o.amountRub : 0),
    0,
  );
}

/** Сумма и количество актуальных заказов (для админов; те же данные, что в боте). */
export const AccountOrderStats = () => {
  const isAdmin = useIsTelegramAdmin();
  const { data: orders = [], isLoading } = useGetOrders();

  if (!isAdmin) {
    return (
      <div className="px-4 pb-4">
        <AppText variant="popupBody" size="popupBody">
          Нет доступа.
        </AppText>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Spinner className="min-h-0" classNameLoader="mb-0 border-white" />
      </div>
    );
  }

  const count = orders.length;
  const total = sumOrdersRub(orders);
  const formatted = total.toFixed(2);

  return (
    <div className="space-y-3 px-4 pb-4">
      <AppText
        tag={TAG.p}
        variant="primaryStrong"
        size="small"
        className="!text-left"
      >
        {ORDER_ADMIN_TEXT.statsTitle}
      </AppText>
      <AppText
        tag={TAG.p}
        variant="popupBody"
        size="popupBody"
        className="!text-left"
      >
        {ORDER_ADMIN_TEXT.statsOrderCount(count)}
      </AppText>
      <AppText
        tag={TAG.p}
        variant="popupBody"
        size="popupBody"
        className="!text-left"
      >
        {ORDER_ADMIN_TEXT.statsTotalRub(formatted)}
      </AppText>
    </div>
  );
};
