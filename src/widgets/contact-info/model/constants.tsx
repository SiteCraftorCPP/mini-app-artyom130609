import { EXTERNAL_LINKS } from "@/shared/constants/common";
import { ACCOUNT_PAGE_TEXT } from "@/shared/constants/text";

import Reviews from "@/assets/icon/account/reviews.svg";
import Telegram from "@/assets/icon/account/telegram.svg";

export const CONTACT_LEGAL_LINKS = [
  {
    href: EXTERNAL_LINKS.privacyPolicy,
    label: ACCOUNT_PAGE_TEXT.contact.privacyPolicy,
  },
  {
    href: EXTERNAL_LINKS.terms,
    label: ACCOUNT_PAGE_TEXT.contact.terms,
  },
  {
    href: EXTERNAL_LINKS.contacts,
    label: ACCOUNT_PAGE_TEXT.contact.contacts,
  },
] as const;

export const CONTACT_SOCIAL_LINKS = [
  {
    href: EXTERNAL_LINKS.channel,
    icon: <Telegram />,
    label: ACCOUNT_PAGE_TEXT.contact.channel,
  },
  {
    href: EXTERNAL_LINKS.reviews,
    icon: <Reviews />,
    label: ACCOUNT_PAGE_TEXT.contact.reviews,
  },
] as const;
