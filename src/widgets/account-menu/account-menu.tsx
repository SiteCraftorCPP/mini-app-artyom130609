import { Link } from "react-router-dom";

import { AppText } from "@/ui/app-text";
import { Button } from "@/ui/button";

import { EXTERNAL_LINKS } from "@/shared/constants/common";
import { ROUTERS } from "@/shared/constants/routers";
import { ACCOUNT_PAGE_TEXT } from "@/shared/constants/text";

import Support from "@/assets/icon/account/support.svg";

import { AccountActionsDialog } from "../popup-app/account-actions-dialog";

import { ACCOUNT_POPUP_MENU_ITEMS, type AccountPopupMenuItem } from "./model";

type AccountMenuProps = {
  /** Ссылка из Telegram: открыть «Актуальные заказы» */
  openCurrentOrdersFromLink?: boolean;
  /** Параметр orderId из ссылки бота (WebApp) */
  orderIdFromLink?: string | null;
};

export const AccountMenu = ({
  openCurrentOrdersFromLink = false,
  orderIdFromLink = null,
}: AccountMenuProps) => {
  return (
    <section aria-label={ACCOUNT_PAGE_TEXT.pageTitle}>
      <ul className="flex flex-col gap-2">
        {ACCOUNT_POPUP_MENU_ITEMS.slice(0, 2).map((item) => (
          <AccountMenuPopupItem
            key={item.actionId}
            defaultOpen={
              openCurrentOrdersFromLink && item.actionId === "currentOrders"
            }
            initialOrderIdFromLink={
              item.actionId === "currentOrders" ? orderIdFromLink : null
            }
            item={item}
          />
        ))}
        <li>
          <Button asChild variant="accountMenu" size="accountMenu">
            <a href={EXTERNAL_LINKS.support} target="_blank" rel="noreferrer">
              <div className="bg-background-card flex h-12 w-12 items-center justify-center rounded-[10px] border border-white/50">
                <Support className="text-white" />
              </div>
              <AppText variant="primaryStrong" size="popupBody">
                {ACCOUNT_PAGE_TEXT.menu.support}
              </AppText>
            </a>
          </Button>
        </li>
        <AccountMenuPopupItem item={ACCOUNT_POPUP_MENU_ITEMS[2]} />
        <li>
          <Button asChild variant="accountMenu" size="accountMenu">
            <Link to={ROUTERS.INFO}>
              <AppText variant="primaryStrong" size="popupBody">
                {ACCOUNT_PAGE_TEXT.menu.faq}
              </AppText>
            </Link>
          </Button>
        </li>
      </ul>
    </section>
  );
};

const AccountMenuPopupItem = ({
  item,
  defaultOpen = false,
  initialOrderIdFromLink = null,
}: {
  item: AccountPopupMenuItem;
  defaultOpen?: boolean;
  initialOrderIdFromLink?: string | null;
}) => {
  return (
    <li>
      <AccountActionsDialog
        actionId={item.actionId}
        defaultOpen={defaultOpen}
        initialOrderIdFromLink={initialOrderIdFromLink}
      >
        <Button
          type="button"
          variant="accountMenu"
          size="accountMenu"
          className="border-white/50 text-white"
        >
          <div className="bg-background-card flex h-12 w-12 items-center justify-center rounded-[10px] border border-white/50">
            {item.icon}
          </div>

          <AppText variant="primaryStrong" size="popupBody">
            {item.label}
          </AppText>
        </Button>
      </AccountActionsDialog>
    </li>
  );
};
