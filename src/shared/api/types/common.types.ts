import { type AxiosRequestConfig } from "axios";
import { Currency } from "lucide-react";

export type ApiRequestConfig = AxiosRequestConfig & {
  signal?: AbortSignal;
};

export type RequestConfig<Params = undefined> = Params extends undefined
  ? { config?: ApiRequestConfig }
  : { params: Params; config?: ApiRequestConfig };

export type CommonResponse = {
  success: boolean;
  message: string;
};

export type CurrencyValue = "RUB";

export type Currency = {
  name: CurrencyValue;
  icon: string;
};
