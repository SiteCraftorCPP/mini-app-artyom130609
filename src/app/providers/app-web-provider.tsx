import {
  WebAppProvider,
  useExpand,
  useWebApp,
} from "@vkruglikov/react-telegram-web-app";
import { type FC, type PropsWithChildren, useEffect } from "react";

import { isMobileDevice } from "@/shared/lib/is-mobile-device";

export const AppWebProvider: FC<PropsWithChildren> = ({ children }) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_isExpanded, expand] = useExpand();
  const WebApp = useWebApp();
  const isMobile = isMobileDevice();

  useEffect(() => {
    expand();
    try {
      if (isMobile) {
        WebApp.requestFullscreen();
        WebApp.disableVerticalSwipes();
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      /* empty */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);
  return (
    <WebAppProvider options={{ smoothButtonsTransition: true }}>
      {children}
    </WebAppProvider>
  );
};
