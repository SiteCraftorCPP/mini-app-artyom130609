import type { ReactElement } from "react";

import { InfoBadgeCard } from "@/ui/info-badge-card";

type CardInfoHeaderProps = {
  icon: ReactElement;
  info: ReactElement;
};

export const CardInfoHeader = ({ icon, info }: CardInfoHeaderProps) => {
  return <InfoBadgeCard icon={icon} info={info} variant="header" />;
};
