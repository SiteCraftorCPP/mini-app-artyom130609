import { AppText } from "@/ui/app-text";
import { Card } from "@/ui/card";
import { Spinner } from "@/ui/spinner";

import Wallet from "@/assets/icon/wallet.svg";

import { CardInfoHeader } from "./ui/card-info-header";
import { useAuthMe } from "@/entities/user";

/** Поставьте `true` — снова показывается бирка «N LVL» слева от статуса. */
const SHOW_USER_LEVEL_BADGE = false;

export const AppHeader = () => {
  const { data: me, isLoading } = useAuthMe();

  return (
    <header className="relative z-10">
      {isLoading && <Spinner />}
      {me ? (
        <div aria-label="Статус профиля">
          <h2 className="sr-only">Статус профиля</h2>
          <div className="flex flex-wrap w-full gap-3">
            {SHOW_USER_LEVEL_BADGE ? (
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
            ) : (
              <Card className="h-10 flex-1 rounded-2xl border-none bg-transparent">
                <div className="bg-surface-base ml-1 flex h-full min-h-0 items-center overflow-hidden rounded-md px-2">
                  <AppText variant="darkStrong" size="headerInfo">
                    {me.status}
                  </AppText>
                </div>
              </Card>
            )}

            <CardInfoHeader
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
