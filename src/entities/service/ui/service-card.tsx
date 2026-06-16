import type { Service } from "../model";

import { SERVICE_GRADIENT_CLASSES } from "@/shared/constants/service-gradients";
import { SERVICE_ICONS } from "@/shared/constants/service-icons";
import { cn } from "@/shared/utils";
import { AppText, TAG } from "@/ui/app-text";
import { Button } from "@/ui/button";

type ServiceCardProps = {
  className?: string;
  onClick?: () => void;
  service: Service;
};

function serviceTitleSizeClass(title: string): string {
  const n = title.trim().length;
  if (n > 42) {
    return "text-xs leading-tight";
  }
  if (n > 30) {
    return "text-sm leading-tight";
  }
  if (n > 22) {
    return "text-[15px] leading-tight";
  }
  return "leading-tight";
}

export const ServiceCard = ({
  className,
  onClick,
  service,
}: ServiceCardProps) => {
  const hasSubtitle = Boolean(service.subtitle?.trim());
  const title = service.title.trim();

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
          "relative flex w-full items-center overflow-hidden rounded-full border border-white/30 px-5",
          SERVICE_GRADIENT_CLASSES[service.gradientToken],
          hasSubtitle || title.length > 22 ? "min-h-16 h-auto py-3" : "h-16",
        )}
      >
        <div className="relative z-10 min-w-0 max-w-[calc(100%-4.5rem)] py-0.5">
          <AppText
            variant="serviceTitle"
            size="service"
            className={cn(
              "whitespace-normal break-words hyphens-auto text-left",
              serviceTitleSizeClass(title),
            )}
          >
            {title}
          </AppText>
          {hasSubtitle ? (
            <AppText
              tag={TAG.p}
              variant="primaryMedium"
              size="small"
              className="!mt-1 !line-clamp-4 !whitespace-pre-wrap !text-left !text-white/90"
            >
              {service.subtitle!.trim()}
            </AppText>
          ) : null}
        </div>
        <img
          src={SERVICE_ICONS[service.iconToken]}
          alt=""
          className="pointer-events-none absolute right-2 bottom-0 h-[90%] w-[40%] object-contain object-right"
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
