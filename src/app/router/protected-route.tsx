// import { useInitData } from "@vkruglikov/react-telegram-web-app";
import type { PropsWithChildren } from "react";

// import { Spinner } from "@/ui/spinner";

// import { useLoginByInitData } from "@/entities/user";

export function ProtectedRoute({ children }: PropsWithChildren) {
   
  // const [_initDataUnsafe, initData] = useInitData();

  // const { isLoading } = useLoginByInitData(initData);

  // if (isLoading) {
  //   return <Spinner />;
  // }

  return children;
}
