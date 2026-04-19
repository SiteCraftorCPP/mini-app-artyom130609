import { ACCOUNT_PAGE_TEXT } from "@/shared/constants/text";

import type { AccountActionId } from "../account-actions-dialog";

export const ACCOUNT_ACTION_DIALOG_TEXT: Record<
  AccountActionId,
  { content: string; title: string }
> = {
  currentOrders: {
    content: ACCOUNT_PAGE_TEXT.popup.currentOrders,
    title: ACCOUNT_PAGE_TEXT.menu.currentOrders,
  },
  orderHistory: {
    content: ACCOUNT_PAGE_TEXT.popup.orderHistory,
    title: ACCOUNT_PAGE_TEXT.menu.orderHistory,
  },
  referral: {
    content: ACCOUNT_PAGE_TEXT.popup.referral,
    title: ACCOUNT_PAGE_TEXT.menu.referral,
  },
};
