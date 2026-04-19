import type { ReactElement } from "react";

import { ACCOUNT_PAGE_TEXT } from "@/shared/constants/text";

import CurrentBuy from "@/assets/icon/account/current-buy.svg";
import HistoryBuy from "@/assets/icon/account/history-buy.svg";
import Referral from "@/assets/icon/account/referral-system.svg";

import type { AccountActionId } from "@/widgets/popup-app/account-actions-dialog";

export type AccountPopupMenuItem = {
  actionId: AccountActionId;
  icon: ReactElement;
  label: string;
};

export const ACCOUNT_POPUP_MENU_ITEMS: AccountPopupMenuItem[] = [
  {
    actionId: "currentOrders",
    icon: <CurrentBuy />,
    label: ACCOUNT_PAGE_TEXT.menu.currentOrders,
  },
  {
    actionId: "orderHistory",
    icon: <HistoryBuy />,
    label: ACCOUNT_PAGE_TEXT.menu.orderHistory,
  },
  {
    actionId: "referral",
    icon: <Referral />,
    label: ACCOUNT_PAGE_TEXT.menu.referral,
  },
];
