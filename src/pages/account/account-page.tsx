import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { ACCOUNT_PAGE_TEXT } from "@/shared/constants/text";

import { AccountMenu } from "@/widgets/account-menu";
import { ContactInfo } from "@/widgets/contact-info";
import { LogoCard } from "@/widgets/logo-card";
import { UserInfo } from "@/widgets/user-info";

type ProfileDeepLinkAction = "currentOrders" | "orderHistory";

function readProfileDeepLink(): {
  deepLinkActionId: ProfileDeepLinkAction | null;
  orderId: string | null;
} {
  if (typeof window === "undefined") {
    return { deepLinkActionId: null, orderId: null };
  }
  const p = new URLSearchParams(window.location.search);
  const open = p.get("open");
  const orderId = p.get("orderId");
  const deepLinkActionId: ProfileDeepLinkAction | null =
    open === "currentOrders" || open === "orderHistory" ? open : null;
  return { deepLinkActionId, orderId };
}

export const AccountPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [{ deepLinkActionId, orderId: orderIdFromLink }] = useState(
    () => readProfileDeepLink(),
  );

  useEffect(() => {
    if (!searchParams.has("open") && !searchParams.has("orderId")) return;
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

  return (
    <div className="space-y-4">
      <h1 className="sr-only">{ACCOUNT_PAGE_TEXT.pageTitle}</h1>

      <LogoCard />
      <UserInfo />
      <AccountMenu
        deepLinkActionId={deepLinkActionId}
        orderIdFromLink={orderIdFromLink}
      />
      <ContactInfo />
    </div>
  );
};
