import { AppText, TAG } from "@/ui/app-text";

type LegalDocumentPageProps = {
  title: string;
  body: string;
};

/**
 * Пользовательское соглашение / политика: узкая колонка по центру ширины экрана.
 */
export const LegalDocumentPage = ({ title, body }: LegalDocumentPageProps) => {
  return (
    <div className="box-border flex min-h-0 w-full flex-1 flex-col justify-center self-stretch px-4 py-6 pb-8">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <h1 className="sr-only">{title}</h1>
        <AppText
          tag={TAG.div}
          variant="primaryStrong"
          size="xxxl"
          className="w-full text-center text-balance"
        >
          {title}
        </AppText>
        <AppText
          tag={TAG.div}
          variant="darkStrong"
          size="popupBody"
          className="text-text-primary w-full text-left font-sans leading-[1.5] break-words whitespace-pre-wrap"
        >
          {body}
        </AppText>
      </div>
    </div>
  );
};
