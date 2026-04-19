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
      className="fixed inset-x-0 bottom-4 z-30 m-auto flex w-full max-w-[var(--maxWidth)] justify-center px-4"
    >
      <Card
        className="tw-bg-gradient-bottom-nav w-full max-w-[calc(var(--maxWidth)-32px)] rounded-[16px] px-5 py-4"
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
