import { LegalDocumentPage } from "@/ui/legal-document-page";

import {
  USER_AGREEMENT_BODY,
  USER_AGREEMENT_PAGE_TITLE,
} from "@/shared/constants/user-agreement";

export const UserAgreementPage = () => {
  return (
    <LegalDocumentPage title={USER_AGREEMENT_PAGE_TITLE} body={USER_AGREEMENT_BODY} />
  );
};
