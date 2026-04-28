import { VIRTS_ICONS, type VirtProjectIconKey } from "@/shared/constants/virt-icons";

import type { Order } from "../model";

/** Иконка по `projectKey` (как в магазине), иначе `logo` из API/мока. */
export function resolveOrderProjectLogoUrl(order: Order): string {
  const k = order.projectKey;
  if (k && k in VIRTS_ICONS) {
    return VIRTS_ICONS[k as VirtProjectIconKey];
  }
  const logo = order.logo?.trim();
  if (logo) {
    return logo;
  }
  return VIRTS_ICONS["black-russia"];
}
