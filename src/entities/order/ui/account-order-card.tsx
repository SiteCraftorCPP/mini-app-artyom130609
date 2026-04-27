import { AppText } from "@/ui/app-text";
import { Button } from "@/ui/button";

import { resolveOrderProjectLogoUrl } from "../lib/resolve-order-project-logo";
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
      <div className="flex size-19.5 shrink-0 items-center justify-center">
        <img
          src={resolveOrderProjectLogoUrl(order)}
          alt=""
          className="h-full w-full object-contain"
        />
      </div>
      <span className="rounded-md bg-[#1A1A1A] px-2 py-1">
        <AppText variant="primaryStrong" size="small">
          {order.number}
        </AppText>
      </span>
    </Button>
  );
};
