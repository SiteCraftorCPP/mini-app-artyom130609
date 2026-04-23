import { LegalDocumentPage } from "@/ui/legal-document-page";

import { USER_AGREEMENT_BODY } from "@/shared/constants/user-agreement";

export const UserAgreementPage = () => {
  return (
    <LegalDocumentPage title={""} body={USER_AGREEMENT_BODY} />
  );
};
