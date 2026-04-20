import { AppText } from "@/ui/app-text";
import { TAG } from "@/ui/app-text/model";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";

import { SUPPORT_CHAT_URL } from "@/shared/constants/common";
import { INFO_PAGE_TEXT } from "@/shared/constants/text";
import type { InfoFaqItem } from "@/shared/mock/info-page";

import CopyIcon from "@/assets/icon/copy.svg";

import { PopupApp, PopupAppHeader } from "@/widgets/popup-app";

type FaqProps = {
  items: InfoFaqItem[];
};

export const Faq = ({ items }: FaqProps) => {
  return (
    <Card className="space-y-5 p-4" bordered={true} glow="none">
      <section aria-labelledby="faq-title" className="space-y-3 pb-3">
        <ul className="mb-8 flex flex-col gap-12">
          {items.map((item) => (
            <li key={item.id}>
              <PopupApp
                slot={<PopupAppHeader title={INFO_PAGE_TEXT.supportButton} />}
                content={<FaqAnswer item={item} />}
              >
                <Button type="button" variant="faq" size="faq">
                  <CopyIcon className="size-4 shrink-0" />
                  <AppText
                    className="truncate group-hover:text-white hover:text-white"
                    variant="darkStrong"
                    size={"medium"}
                  >
                    {item.question}
                  </AppText>
                </Button>
              </PopupApp>
            </li>
          ))}
        </ul>

        <div className="flex justify-center">
          <Button
            asChild
            variant={"link"}
            className="h-[52px] border-white px-10"
            size={"link"}
          >
            <a href={SUPPORT_CHAT_URL} target="_blank" rel="noreferrer">
              <AppText variant="primaryStrong" size="popupBody">
                {INFO_PAGE_TEXT.supportButton}
              </AppText>
            </a>
          </Button>
        </div>
      </section>
    </Card>
  );
};

const FaqAnswer = ({ item }: { item: InfoFaqItem }) => {
  return (
    <article className="space-y-3 px-4 pb-4">
      <h3>
        <AppText variant="primaryStrong" size={"popupBody"}>
          {item.question}
        </AppText>
      </h3>
      <AppText tag={TAG.p} variant={"primaryMedium"} size={"popupBody"}>
        {item.answer}
      </AppText>
    </article>
  );
};
