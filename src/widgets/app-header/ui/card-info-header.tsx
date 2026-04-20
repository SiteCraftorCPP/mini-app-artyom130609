import type { ReactElement } from "react";

import { InfoBadgeCard } from "@/ui/info-badge-card";

type CardInfoHeaderProps = {
  icon: ReactElement;
  info: ReactElement;
  className?: string;
};

export const CardInfoHeader = ({ icon, info, className }: CardInfoHeaderProps) => {
  return (
    <InfoBadgeCard className={className} icon={icon} info={info} variant="header" />
  );
};
