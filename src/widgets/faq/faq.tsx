import { useState } from "react";

import { AppText } from "@/ui/app-text";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";

import { SUPPORT_CHAT_URL } from "@/shared/constants/common";
import { INFO_PAGE_TEXT } from "@/shared/constants/text";
import type { InfoFaqItem } from "@/shared/mock/info-page";
import { cn } from "@/shared/utils";

import CopyIcon from "@/assets/icon/copy.svg";

import { PopupAppHeader } from "@/widgets/popup-app/default/popup-app-header";

type FaqProps = {
  items: InfoFaqItem[];
};

const faqAnswerTextClass = cn(
  "max-w-full min-w-0 text-pretty break-words font-medium text-white text-[20px] leading-[120%] whitespace-pre-line",
);

export const Faq = ({ items }: FaqProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [active, setActive] = useState<InfoFaqItem | null>(null);

  return (
    <Card className="space-y-5 p-4" bordered={true} glow="none">
      <section aria-labelledby="faq-title" className="space-y-3 pb-3">
        <ul className="mb-8 flex flex-col gap-4">
          {items.map((item) => (
            <li key={item.id}>
              <Button
                type="button"
                variant="faq"
                size="faq"
                onClick={() => {
                  setActive(item);
                  setDialogOpen(true);
                }}
              >
                <CopyIcon className="size-4 shrink-0" />
                <AppText
                  className="truncate group-hover:text-white hover:text-white"
                  variant="darkStrong"
                  size={"medium"}
                >
                  {item.question}
                </AppText>
              </Button>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent variant="popupCentered" lockBodyScroll={dialogOpen}>
          {active && (
            <>
              <DialogHeader className="min-w-0 gap-3 pr-0">
                <DialogTitle className="sr-only">{active.question}</DialogTitle>
                <PopupAppHeader title={active.question} />
              </DialogHeader>
              <div
                className={cn(
                  "scrollbar-app mt-3 flex min-h-0 w-full min-w-0 max-h-[min(72vh,560px)] max-w-full flex-1 flex-col self-stretch touch-pan-y overflow-y-scroll overflow-x-clip overscroll-contain px-4 pb-2",
                )}
              >
                <FaqAnswerText answer={active.answer} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

const FaqAnswerText = ({ answer }: { answer: string }) => {
  return <div className={cn(faqAnswerTextClass, "w-full min-w-0")}>{answer}</div>;
};

