import { AppText, TAG } from "@/ui/app-text";
import { Button } from "@/ui/button";

import type { Order } from "@/entities/order";
import { ORDER_ADMIN_TEXT, ORDER_INFO_TEXT } from "@/entities/order/model";
import { showMessage } from "@/shared/lib/notify";

type AccountAdminOrderDetailProps = {
  order: Order;
};

const stripAt = (u: string) => u.replace(/^@/, "");

function buildAdminOrderPlainText(order: Order): string {
  const id = order.publicOrderId ?? order.id;
  const un = order.telegramUsername ? stripAt(order.telegramUsername) : "—";
  const uid = order.telegramUserId ?? "—";
  const bank = order.bankAccount ?? order.accountNumber;
  const lines = [
    ORDER_ADMIN_TEXT.title(id),
    `${ORDER_ADMIN_TEXT.opened} ${order.openedAtLine ?? "—"}`,
  ];
  if (order.closedAtLine) {
    lines.push(
      `${ORDER_ADMIN_TEXT.closedAt} ${order.closedAtLine}`,
    );
  }
  lines.push(
    `${ORDER_ADMIN_TEXT.user} @${un} (${uid})`,
    `${ORDER_ADMIN_TEXT.game} ${order.game}`,
    `${ORDER_INFO_TEXT.server} ${order.server}`,
    `${ORDER_ADMIN_TEXT.virtAmount} ${order.virtAmountLabel ?? "—"}`,
    `${ORDER_ADMIN_TEXT.transfer} ${order.transferMethod ?? "—"}`,
    `${ORDER_ADMIN_TEXT.bank} ${bank}`,
    `${ORDER_ADMIN_TEXT.amountRub} ${
      order.amountRub != null ? `${order.amountRub}` : "—"
    }`,
  );
  return lines.join("\n");
}

export const AccountAdminOrderDetail = ({ order }: AccountAdminOrderDetailProps) => {
  const id = order.publicOrderId ?? order.id;
  const un = order.telegramUsername ? stripAt(order.telegramUsername) : "—";
  const uid = order.telegramUserId ?? "—";
  const bank = order.bankAccount ?? order.accountNumber;

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(buildAdminOrderPlainText(order));
      showMessage(ORDER_ADMIN_TEXT.copied);
    } catch {
      showMessage(ORDER_ADMIN_TEXT.copyAllFailed);
    }
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 px-4 pb-4">
      <div className="space-y-2 rounded-[8px] bg-app-surface-overlay/80 p-3">
        <AppText tag={TAG.h2} variant="primaryStrong" size="popupBody" className="!text-left">
          {ORDER_ADMIN_TEXT.title(id)}
        </AppText>
        <AdminLine
          k={ORDER_ADMIN_TEXT.opened}
          v={order.openedAtLine ?? "—"}
        />
        {order.closedAtLine ? (
          <AdminLine
            k={ORDER_ADMIN_TEXT.closedAt}
            v={order.closedAtLine}
          />
        ) : null}
        <AdminLine
          k={ORDER_ADMIN_TEXT.user}
          v={ORDER_ADMIN_TEXT.usernameLine(un, uid)}
        />
        <AdminLine k={ORDER_ADMIN_TEXT.game} v={order.game} em />
        <AdminLine
          k={ORDER_INFO_TEXT.server}
          v={order.server}
          em
        />
        <AdminLine
          k={ORDER_ADMIN_TEXT.virtAmount}
          v={order.virtAmountLabel ?? "—"}
          em
        />
        <AdminLine
          k={ORDER_ADMIN_TEXT.transfer}
          v={order.transferMethod ?? "—"}
          em
        />
        <AdminLine k={ORDER_ADMIN_TEXT.bank} v={bank} />
        <AdminLine
          k={ORDER_ADMIN_TEXT.amountRub}
          v={order.amountRub != null ? String(order.amountRub) : "—"}
        />
      </div>
      <Button
        type="button"
        variant="popupSubmit"
        size="popupSubmit"
        className="w-full max-w-full shrink-0"
        onClick={handleCopyAll}
      >
        {ORDER_ADMIN_TEXT.copyAll}
      </Button>
    </div>
  );
};

const AdminLine = ({
  k,
  v,
  em = false,
}: {
  k: string;
  v: string;
  em?: boolean;
}) => (
  <div className="min-w-0 break-words text-left">
    <AppText variant="primaryMedium" size="small" className="!inline">
      {k}{" "}
    </AppText>
    <AppText
      variant="primaryMedium"
      size="small"
      className={em ? "!font-semibold !italic" : ""}
    >
      {v}
    </AppText>
  </div>
);
