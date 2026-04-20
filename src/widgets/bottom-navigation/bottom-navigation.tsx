import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/ui/button";
import { Card } from "@/ui/card";

import { NAVIGATION_MENU } from "@/shared/constants/bottom-menu";

export const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      aria-label="Основная навигация"
      className="relative z-50 mt-auto flex w-full shrink-0 justify-center pb-[max(0.75rem,var(--tg-safe-bottom,0px),env(safe-area-inset-bottom,0px))]"
    >
      <Card
        className="tw-bg-gradient-bottom-nav w-full rounded-[16px] px-5 py-4"
        glow="strong"
        bordered={true}
      >
        <ul className="grid w-full grid-cols-3 gap-3">
          {NAVIGATION_MENU.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <li key={item.id} className="flex justify-center">
                <Button
                  variant="menu"
                  size="menu"
                  menuState={isActive ? "active" : "default"}
                  aria-label={item.label}
                  onClick={() => navigate(item.href)}
                >
                  {Icon}
                </Button>
              </li>
            );
          })}
        </ul>
      </Card>
    </nav>
  );
};
