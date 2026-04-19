import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import type { FC, PropsWithChildren } from "react";

import { showErrorMessage } from "@/shared/lib/notify";

// eslint-disable-next-line react-refresh/only-export-components
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            return;
          }
          showErrorMessage(error.message);
        }
      },
    },
  },
});

export const AppQueryProvider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
