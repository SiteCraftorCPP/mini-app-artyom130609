export type ServiceCardGradientToken = "primary" | "secondary";

export type ServiceCardIconToken = "service" | "subService";

export type Service = {
  badge?: string;
  gradientToken: ServiceCardGradientToken;
  iconToken: ServiceCardIconToken;
  id: string;
  subtitle?: string;
  title: string;
};
