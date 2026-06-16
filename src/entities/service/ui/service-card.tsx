import type { Service } from "../model";

import { SERVICE_GRADIENT_CLASSES } from "@/shared/constants/service-gradients";
import { SERVICE_ICONS } from "@/shared/constants/service-icons";
import {
  plaqueNeedsTallLayout,
  plaqueTitleClass,
} from "@/shared/lib/plaque-title-class";
import { cn } from "@/shared/utils";
import { AppText, TAG } from "@/ui/app-text";
import { Button } from "@/ui/button";

type ServiceCardProps = {
  className?: string;
  onClick?: () => void;
  service: Service;
};

export const ServiceCard = ({
  className,
  onClick,
  service,
}: ServiceCardProps) => {
  const hasSubtitle = Boolean(service.subtitle?.trim());
  const title = service.title.trim();
  const tall = plaqueNeedsTallLayout(title, hasSubtitle);

  return (
    <Button
      type="button"
      variant="serviceCard"
      size="serviceCard"
      onClick={onClick}
      className={className}
    >
      <span
        className={cn(
          "relative flex w-full min-w-0 items-center rounded-full border border-white/30 py-3 pl-5 pr-[38%]",
          SERVICE_GRADIENT_CLASSES[service.gradientToken],
          tall ? "min-h-16 h-auto" : "h-16",
        )}
      >
        <div className="relative z-10 min-w-0 flex-1">
          <AppText
            variant="serviceTitle"
            className={plaqueTitleClass(title, "service")}
          >
            {title}
          </AppText>
          {hasSubtitle ? (
            <AppText
              tag={TAG.p}
              variant="primaryMedium"
              size="small"
              className="!mt-1 !line-clamp-4 !whitespace-pre-wrap !text-left !leading-snug !text-white/90"
            >
              {service.subtitle!.trim()}
            </AppText>
          ) : null}
        </div>
        <img
          src={SERVICE_ICONS[service.iconToken]}
          alt=""
          className="pointer-events-none absolute top-1/2 right-2 z-0 h-[78%] max-h-14 w-[34%] -translate-y-1/2 object-contain object-right"
          width="100%"
          height="100%"
        />
        {service.badge ? (
          <span className="absolute top-1/2 right-2 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md">
            <AppText variant="serviceBadge" size="service">
              {service.badge}
            </AppText>
          </span>
        ) : null}
      </span>
    </Button>
  );
};
