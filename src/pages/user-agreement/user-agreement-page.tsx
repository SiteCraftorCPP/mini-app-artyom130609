import { AppText, TAG } from "@/ui/app-text";

import {
  USER_AGREEMENT_BODY,
  USER_AGREEMENT_PAGE_TITLE,
} from "@/shared/constants/user-agreement";

export const UserAgreementPage = () => {
  return (
    <div className="space-y-4 px-4 pb-8">
      <h1 className="sr-only">{USER_AGREEMENT_PAGE_TITLE}</h1>
      <AppText tag={TAG.div} variant="primaryStrong" size="xxxl" className="pt-1">
        {USER_AGREEMENT_PAGE_TITLE}
      </AppText>
      <AppText
        tag={TAG.div}
        variant="darkStrong"
        size="popupBody"
        className="text-text-primary font-sans whitespace-pre-wrap break-words"
      >
        {USER_AGREEMENT_BODY}
      </AppText>
    </div>
  );
};
