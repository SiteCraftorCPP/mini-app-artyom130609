import { AppText, TAG } from "@/ui/app-text";

import { INFO_PAGE_TEXT } from "@/shared/constants/text";
import { INFO_FAQ_MOCK } from "@/shared/mock/info-page";

import { Faq } from "@/widgets/faq";
import { LogoCard } from "@/widgets/logo-card";

export const InfoPage = () => {
  return (
    <div className="space-y-4">
      <h1 className="sr-only">{INFO_PAGE_TEXT.pageTitle}</h1>

      <LogoCard />

      <div className="space-y-2">
        <AppText
          id="faq-title"
          tag={TAG.h2}
          variant="primaryStrong"
          size={"popupBody"}
        >
          {INFO_PAGE_TEXT.faqTitle}
        </AppText>

        <Faq items={INFO_FAQ_MOCK} />
      </div>
    </div>
  );
};
