import { Outlet } from "react-router-dom";

import { BgLayout } from "@/ui/bg-layout";

import { AppHeader } from "@/widgets/app-header";
import { BottomNavigation } from "@/widgets/bottom-navigation";

export const Layout = () => {
  return (
    <BgLayout>
      <>
        <div className="relative z-10">
          <AppHeader />
        </div>

        <main className="relative z-10 pb-24">
          <Outlet />
        </main>

        <div className="relative max-w-[var(--maxWidth)]">
          <BottomNavigation />
        </div>
      </>
    </BgLayout>
  );
};
