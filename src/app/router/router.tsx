import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";

import { ROUTERS } from "@/shared/constants/routers";
import { Spinner } from "@/ui/spinner";

import { Layout } from "../ui/layout";

const HomePage = lazy(() =>
  import("@/pages/home").then((module) => ({ default: module.HomePage })),
);
const InfoPage = lazy(() =>
  import("@/pages/info").then((module) => ({ default: module.InfoPage })),
);
const AccountPage = lazy(() =>
  import("@/pages/account").then((module) => ({
    default: module.AccountPage,
  })),
);
const UserAgreementPage = lazy(() =>
  import("@/pages/user-agreement").then((module) => ({
    default: module.UserAgreementPage,
  })),
);

const withSuspense = (component: React.ReactNode) => {
  return (
    <Suspense fallback={<Spinner />}>
      {component}
    </Suspense>
  );
};

const routes = [
  {
    path: ROUTERS.MAIN,
    element: <Layout />,
    children: [
      { path: ROUTERS.MAIN, element: withSuspense(<HomePage />) },
      { path: ROUTERS.INFO, element: withSuspense(<InfoPage />) },
      { path: ROUTERS.PROFILE, element: withSuspense(<AccountPage />) },
      {
        path: ROUTERS.USER_AGREEMENT,
        element: withSuspense(<UserAgreementPage />),
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
