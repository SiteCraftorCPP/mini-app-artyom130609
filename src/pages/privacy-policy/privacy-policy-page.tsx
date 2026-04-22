import { LegalDocumentPage } from "@/ui/legal-document-page";

import {
  PRIVACY_POLICY_BODY,
  PRIVACY_POLICY_PAGE_TITLE,
} from "@/shared/constants/privacy-policy";

export const PrivacyPolicyPage = () => {
  return (
    <LegalDocumentPage
      title={PRIVACY_POLICY_PAGE_TITLE}
      body={PRIVACY_POLICY_BODY}
    />
  );
};
