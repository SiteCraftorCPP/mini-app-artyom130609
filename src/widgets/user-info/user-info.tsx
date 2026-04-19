import { AppText, TAG } from "@/ui/app-text";
import { InfoBadgeCard } from "@/ui/info-badge-card";

import { ACCOUNT_PAGE_TEXT } from "@/shared/constants/text";

import Id from "@/assets/icon/account/id.svg";
import Wallet from "@/assets/icon/wallet.svg";

import { useAuthMe } from "@/entities/user";

const getInitials = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials = words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  return initials || "U";
};

export const UserInfo = () => {
  const { data: user } = useAuthMe();

  if (!user) {
    return null;
  }

  return (
    <section aria-label={ACCOUNT_PAGE_TEXT.pageTitle}>
      <div className="flex items-center gap-4">
        <div className="bg-surface-inverse text-text-primary flex size-35 items-center justify-center overflow-hidden rounded-full">
          {user.photoUrl ? (
            <img
              src={user.photoUrl}
              alt={user.name}
              className="size-full object-cover"
            />
          ) : (
            <AppText variant="primaryStrong" size="xxxl">
              {getInitials(user.name)}
            </AppText>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <AppText tag={TAG.div} variant="primaryStrong" size="xxxl">
            {user.name}
          </AppText>
          <InfoBadgeCard
            variant="profile"
            icon={<Id className="size-8" />}
            info={
              <AppText variant="primaryStrong" size="xxxl">
                {user.telegramId}
              </AppText>
            }
          />
          <InfoBadgeCard
            icon={<Wallet className="size-8" />}
            info={
              <AppText variant="darkStrong">
                {`${user.balance} ${user.currency.name}`}
              </AppText>
            }
          />
        </div>
      </div>
    </section>
  );
};
