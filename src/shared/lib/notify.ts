import type { AxiosResponse } from "axios";
import toast from "react-hot-toast";

interface ToastPromiseParams {
  success: string;
  error: string;
  process: string;
  callback: () => Promise<AxiosResponse<unknown>>;
}

export const showErrorMessage = (message: string) => {
  toast.error(message, {
    style: {
      borderRadius: "10px",
      background: "var(--toast-background)",
      color: "var(--text-primary)",
      zIndex: 9999999,
    },
  });
};

export const showSuccessMessage = (message: string) => {
  toast.success(message, {
    style: {
      borderRadius: "10px",
      background: "var(--toast-background)",
      color: "var(--text-primary)",
      zIndex: 9999999,
    },
  });
};

export const showMessage = (message: string) => {
  toast(message, {
    style: {
      borderRadius: "10px",
      background: "var(--toast-background)",
      color: "var(--text-primary)",
      zIndex: 9999999,
    },
  });
};

export const showToastWithPromise = async ({
  success,
  error,
  process,
  callback,
}: ToastPromiseParams) => {
  return await toast.promise(
    callback(),
    {
      loading: process,
      success: success,
      error: error,
    },
    {
      style: {
        borderRadius: "10px",
        background: "var(--toast-background)",
        color: "var(--text-primary)",
        zIndex: "9999999 !important",
      },
    },
  );
};
