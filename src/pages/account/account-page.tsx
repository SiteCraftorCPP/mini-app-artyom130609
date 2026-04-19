import { ACCOUNT_PAGE_TEXT } from "@/shared/constants/text";

import { AccountMenu } from "@/widgets/account-menu";
import { ContactInfo } from "@/widgets/contact-info";
import { LogoCard } from "@/widgets/logo-card";
import { UserInfo } from "@/widgets/user-info";

export const AccountPage = () => {
  return (
    <div className="space-y-4">
      <h1 className="sr-only">{ACCOUNT_PAGE_TEXT.pageTitle}</h1>

      <LogoCard />
      <UserInfo />
      <AccountMenu />
      <ContactInfo />
    </div>
  );
};
