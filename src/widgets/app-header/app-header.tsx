import { AppText } from "@/ui/app-text";
import { Spinner } from "@/ui/spinner";

import Wallet from "@/assets/icon/wallet.svg";

import { CardInfoHeader } from "./ui/card-info-header";
import { useAuthMe } from "@/entities/user";

/** Поставьте `true` — снова показывается вся плашка: «N LVL» + «Новичок». */
const SHOW_USER_STATUS_BADGE = false;

export const AppHeader = () => {
  const { data: me, isLoading } = useAuthMe();

  return (
    <header className="relative z-10">
      {isLoading && <Spinner />}
      {me ? (
        <div aria-label="Статус профиля">
          <h2 className="sr-only">Статус профиля</h2>
          <div className="flex flex-wrap w-full gap-3">
            {SHOW_USER_STATUS_BADGE ? (
              <CardInfoHeader
                icon={
                  <AppText variant="primaryStrong" size="headerInfo">
                    {`${me.level} LVL`}
                  </AppText>
                }
                info={
                  <AppText variant="darkStrong" size="headerInfo">
                    {me.status}
                  </AppText>
                }
              />
            ) : null}

            <CardInfoHeader
              className={
                SHOW_USER_STATUS_BADGE
                  ? undefined
                  : "ml-auto w-[calc((100%-0.75rem)/2)] max-w-[calc((100%-0.75rem)/2)] flex-none"
              }
              icon={<Wallet />}
              info={
                <AppText variant="darkStrong" size="headerInfo">
                  {`${me.balance} ${me.currency.name}`}
                </AppText>
              }
            />
          </div>
        </div>
      ) : (
        <AppText>Не авторизованы</AppText>
      )}
    </header>
  );
};
