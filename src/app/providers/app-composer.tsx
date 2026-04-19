import { type FC, type PropsWithChildren, StrictMode } from "react";
import { Toaster } from "react-hot-toast";

import { ComposeChildren } from "@/shared/lib/compose-children";
import { isMobileDevice } from "@/shared/lib/is-mobile-device";

import { AppQueryProvider } from "./app-query-provider";
import { AppRouterProvider } from "./app-router-provider";
import { AppWebProvider } from "./app-web-provider";

export const AppComposer: FC<PropsWithChildren> = ({ children }) => {
  const isMobile = isMobileDevice();

  return (
    <div className="flex min-h-0 min-h-dvh w-full flex-1 flex-col overflow-hidden">
      <ComposeChildren>
        <AppQueryProvider>
          <AppWebProvider>
            <StrictMode>
              <AppRouterProvider />
              {children}
              <Toaster
                position="top-center"
                containerClassName="toaster-container"
                containerStyle={{
                  top: isMobile ? "10vh" : "1vh",
                }}
                toastOptions={{
                  style: {
                    zIndex: "3 !important",
                    backgroundColor: "var(--toast-background)",
                    color: "var(--text-primary)",
                  },
                  duration: 5000,
                }}
                reverseOrder={false}
              />
            </StrictMode>
          </AppWebProvider>
        </AppQueryProvider>
      </ComposeChildren>
    </div>
  );
};
