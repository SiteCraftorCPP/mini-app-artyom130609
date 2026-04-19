import { AppText } from "@/ui/app-text";
import { Spinner } from "@/ui/spinner";

import Wallet from "@/assets/icon/wallet.svg";

import { CardInfoHeader } from "./ui/card-info-header";
import { useAuthMe } from "@/entities/user";

export const AppHeader = () => {
  const { data: me, isLoading } = useAuthMe();

  return (
    <header className="relative z-10">
      {isLoading && <Spinner />}
      {me ? (
        <div aria-label="Статус профиля">
          <h2 className="sr-only">Статус профиля</h2>
          <div className="flex flex-wrap w-full gap-3">
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
