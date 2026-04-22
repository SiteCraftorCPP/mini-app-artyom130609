import React from "react";
import { Link } from "react-router-dom";

import { AppText } from "@/ui/app-text";
import { Button } from "@/ui/button";

import { ACCOUNT_PAGE_TEXT } from "@/shared/constants/text";

import { CONTACT_LEGAL_LINKS, CONTACT_SOCIAL_LINKS } from "./model";

export const ContactInfo = () => {
  return (
    <section
      aria-label={ACCOUNT_PAGE_TEXT.contact.contacts}
      className="space-y-3 pt-2"
    >
      <div className="grid grid-cols-2 gap-3 pb-2">
        {CONTACT_LEGAL_LINKS.map((link, index) => {
          const isInternal = link.href.startsWith("/");
          return (
            <Button
              key={link.label}
              asChild
              variant="faq"
              size="lg"
              className={index === 0 ? "col-span-2 rounded-full" : "rounded-full"}
            >
              {isInternal ? (
                <Link to={link.href}>
                  <AppText variant="darkStrong" className="w-full text-center">
                    {link.label}
                  </AppText>
                </Link>
              ) : (
                <a href={link.href} target="_blank" rel="noreferrer">
                  <AppText variant="darkStrong" className="w-full text-center">
                    {link.label}
                  </AppText>
                </a>
              )}
            </Button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {CONTACT_SOCIAL_LINKS.map((link) => {
          const Icon = link.icon;

          return (
            <Button
              key={link.label}
              asChild
              variant="support"
              size={"supportLink"}
              className="rounded-[4px] justify-center items-center bg-background-card"
            >
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
              
              >
                {React.cloneElement(Icon, {
                  className: "text-white",
                })}
                <AppText variant="primaryStrong" size={"popupBody"}>
                  {link.label}
                </AppText>
              </a>
            </Button>
          );
        })}
      </div>
    </section>
  );
};
