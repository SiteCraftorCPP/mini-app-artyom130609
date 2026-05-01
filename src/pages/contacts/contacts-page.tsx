import { LegalDocumentPage } from "@/ui/legal-document-page";

import {
  CONTACTS_PAGE_BODY,
  CONTACTS_PAGE_TITLE,
} from "@/shared/constants/contacts-page";

export const ContactsPage = () => {
  return (
    <LegalDocumentPage title={CONTACTS_PAGE_TITLE} body={CONTACTS_PAGE_BODY} />
  );
};
