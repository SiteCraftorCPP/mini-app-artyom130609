import { AppText } from "@/ui/app-text";
import { Button } from "@/ui/button";

import type { Order } from "../model";

type AccountOrderCardProps = {
  order: Order;
  onClick?: () => void;
};

export const AccountOrderCard = ({ onClick, order }: AccountOrderCardProps) => {
  return (
    <Button
      type="button"
      variant="accouuntVirt"
      menuState="none"
      size="accountVirt"
      className={
        onClick !== undefined ? "hover:cursor-pointer" : "hover:cursor-default"
      }
      onClick={onClick}
    >
      <div className="tw-bg-gradient-card-border flex size-19.5 items-center justify-center rounded-2xl p-px">
        <span className="bg-surface-inverse flex h-full w-full items-center justify-center overflow-hidden rounded-2xl">
          <img src={order.logo} alt="" className="size-full object-contain" />
        </span>
      </div>
      <span className="bg-surface-inverse rounded-md px-2 py-1">
        <AppText variant="primaryStrong" size="small">
          {order.number}
        </AppText>
      </span>
    </Button>
  );
};
