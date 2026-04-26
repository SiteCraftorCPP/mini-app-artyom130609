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
  orderStats: {
    content: "",
    title: ACCOUNT_PAGE_TEXT.menu.orderStats,
  },
  orderLookup: {
    content: "",
    title: ACCOUNT_PAGE_TEXT.menu.orderLookup,
  },
  orderHistory: {
    content: ACCOUNT_PAGE_TEXT.popup.orderHistory,
    title: ACCOUNT_PAGE_TEXT.menu.orderHistory,
  },
  orderPeriodStats: {
    content: "",
    title: ACCOUNT_PAGE_TEXT.menu.orderPeriodStats,
  },
  promoCodes: {
    content: "",
    title: ACCOUNT_PAGE_TEXT.menu.promoCodes,
  },
  referral: {
    content: ACCOUNT_PAGE_TEXT.popup.referral,
    title: ACCOUNT_PAGE_TEXT.menu.referral,
  },
};
