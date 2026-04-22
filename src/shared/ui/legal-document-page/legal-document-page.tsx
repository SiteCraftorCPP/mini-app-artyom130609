import { AppText, TAG } from "@/ui/app-text";

type LegalDocumentPageProps = {
  title: string;
  body: string;
};

/**
 * Пользовательское соглашение / политика: прокрутка, отступ снизу под нижнюю навигацию, компактный текст.
 */
export const LegalDocumentPage = ({ title, body }: LegalDocumentPageProps) => {
  return (
    <div
      className="box-border w-full min-w-0 max-w-full flex-1 self-stretch px-2 pt-3"
      style={{
        paddingBottom: `max(7.5rem, calc(6rem + env(safe-area-inset-bottom, 0px)))`,
      }}
    >
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 py-2">
        <h1 className="sr-only">{title}</h1>
        <AppText
          tag={TAG.div}
          variant="primaryStrong"
          size="headerInfo"
          className="w-full text-center text-balance text-[17px] leading-tight sm:text-lg"
        >
          {title}
        </AppText>
        <AppText
          tag={TAG.div}
          variant="popupBody"
          size="medium"
          className="w-full text-center font-sans text-[14px] leading-normal sm:text-[15px] break-words whitespace-pre-wrap mt-1"
        >
          {body}
        </AppText>
      </div>
    </div>
  );
};
