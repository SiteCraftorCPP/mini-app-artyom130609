import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";

import { ACCOUNT_PAGE_TEXT } from "@/shared/constants/text";

import { AccountMenu } from "@/widgets/account-menu";
import { ContactInfo } from "@/widgets/contact-info";
import { LogoCard } from "@/widgets/logo-card";
import { UserInfo } from "@/widgets/user-info";

type ProfileDeepLinkAction = "currentOrders" | "orderHistory";

export const AccountPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [deepLink, setDeepLink] = useState<{
    deepLinkActionId: ProfileDeepLinkAction;
    orderIdFromLink: string | null;
  } | null>(null);

  useEffect(() => {
    const open = searchParams.get("open");
    const orderId = searchParams.get("orderId");
    if (open === "currentOrders" || open === "orderHistory") {
      setDeepLink({ deepLinkActionId: open, orderIdFromLink: orderId });
    }
    if (!searchParams.has("open") && !searchParams.has("orderId")) {
      return;
    }
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("open");
        next.delete("orderId");
        return next;
      },
      { replace: true },
    );
  }, [searchParams, setSearchParams]);

  const deepLinkActionId = deepLink?.deepLinkActionId ?? null;
  const orderIdFromLink = deepLink?.orderIdFromLink ?? null;

  const menuKey = deepLinkActionId
    ? `${deepLinkActionId}-${orderIdFromLink ?? ""}-${location.key}`
    : location.key;

  return (
    <div className="space-y-4">
      <h1 className="sr-only">{ACCOUNT_PAGE_TEXT.pageTitle}</h1>

      <LogoCard />
      <UserInfo />
      <AccountMenu
        key={menuKey}
        deepLinkActionId={deepLinkActionId}
        orderIdFromLink={orderIdFromLink}
      />
      <ContactInfo />
    </div>
  );
};
