import { Outlet } from "react-router-dom";

import { BgLayout } from "@/ui/bg-layout";

import { AppHeader } from "@/widgets/app-header";
import { BottomNavigation } from "@/widgets/bottom-navigation";

export const Layout = () => {
  return (
    <BgLayout>
      <>
        <header className="relative z-10 shrink-0">
          <AppHeader />
        </header>

        <main className="relative z-10 flex min-h-0 w-full flex-1 flex-col overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
          <Outlet />
        </main>

        <BottomNavigation />
      </>
    </BgLayout>
  );
};
