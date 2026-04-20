import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { ACCOUNT_PAGE_TEXT } from "@/shared/constants/text";

import { AccountMenu } from "@/widgets/account-menu";
import { ContactInfo } from "@/widgets/contact-info";
import { LogoCard } from "@/widgets/logo-card";
import { UserInfo } from "@/widgets/user-info";

export const AccountPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [openCurrentOrdersFromLink] = useState(
    () => searchParams.get("open") === "currentOrders",
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
      <AccountMenu openCurrentOrdersFromLink={openCurrentOrdersFromLink} />
      <ContactInfo />
    </div>
  );
};
