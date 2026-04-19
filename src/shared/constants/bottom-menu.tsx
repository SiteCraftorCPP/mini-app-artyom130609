import Catalog from "@/assets/icon/bottom-menu/Vector-1.svg";
import Shop from "@/assets/icon/bottom-menu/Vector-2.svg";
import Profile from "@/assets/icon/bottom-menu/Vector-3.svg";

import { ROUTERS } from "./routers";

export const NAVIGATION_TEXT = {
  catalog: "Каталог",
  shop: "Магазин",
  profile: "Профиль",
};

export const NAVIGATION_ICON = {
  catalog: <Catalog />,
  shop: <Shop />,
  profile: <Profile />,
};

export const NAVIGATION_MENU = [
  {
    id: "info",
    label: NAVIGATION_TEXT.catalog,
    icon: NAVIGATION_ICON.catalog,
    href: ROUTERS.INFO,
  },
  {
    id: "shop",
    label: NAVIGATION_TEXT.shop,
    icon: NAVIGATION_ICON.shop,
    href: ROUTERS.MAIN,
  },
  {
    id: "profile",
    label: NAVIGATION_TEXT.profile,
    icon: NAVIGATION_ICON.profile,
    href: ROUTERS.PROFILE,
  },
];
