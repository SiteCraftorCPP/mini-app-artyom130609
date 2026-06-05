import type { ServiceCardGradientToken } from "@/entities/service";

export const SERVICE_GRADIENT_CLASSES: Record<
  ServiceCardGradientToken,
  string
> = {
  primary: "tw-bg-gradient-home-action-primary",
  secondary: "tw-bg-gradient-service-card-secondary",
};
