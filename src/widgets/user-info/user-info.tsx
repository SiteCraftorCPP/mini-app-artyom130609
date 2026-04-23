import { useRef } from "react";
import { useInitData } from "@vkruglikov/react-telegram-web-app";

import { AppText, TAG } from "@/ui/app-text";
import { InfoBadgeCard } from "@/ui/info-badge-card";

import { ACCOUNT_PAGE_TEXT } from "@/shared/constants/text";
import { useLocalProfileAvatar } from "@/shared/hooks/use-local-profile-avatar";

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
  const [initDataUnsafe] = useInitData();
  const { dataUrl: localAvatarUrl, setFromFile } = useLocalProfileAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const displayPhotoUrl = localAvatarUrl ?? user?.photoUrl;

  if (!user) {
    return null;
  }

  const telegramIdDisplay =
    initDataUnsafe?.user?.id != null
      ? String(initDataUnsafe.user.id)
      : user.telegramId;

  return (
    <section aria-label={ACCOUNT_PAGE_TEXT.pageTitle}>
      <div className="flex items-center gap-4">
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                await setFromFile(file);
              }
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title={ACCOUNT_PAGE_TEXT.changeProfilePhoto}
            className="bg-surface-inverse text-text-primary focus-visible:ring-primary flex size-35 shrink-0 items-center justify-center overflow-hidden rounded-full ring-offset-2 focus-visible:ring-2 focus-visible:ring-offset-surface-void focus-visible:outline-none"
          >
            {displayPhotoUrl ? (
              <img
                src={displayPhotoUrl}
                alt={user.name}
                className="size-full object-cover"
              />
            ) : (
              <AppText variant="primaryStrong" size="xxxl">
                {getInitials(user.name)}
              </AppText>
            )}
          </button>
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
                {telegramIdDisplay}
              </AppText>
            }
          />
          <InfoBadgeCard
            variant="profileWallet"
            icon={<Wallet className="size-8" />}
            info={
              <AppText tag={TAG.span} variant="darkStrong" size="xxxl">
                {`${user.balance} ${user.currency.name}`}
              </AppText>
            }
          />
        </div>
      </div>
    </section>
  );
};
