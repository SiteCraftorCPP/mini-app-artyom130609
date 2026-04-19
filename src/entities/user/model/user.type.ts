import type { CommonResponse, Currency } from "@/api/types/common.types";

export type User = {
  id: string;
  telegramId: string;
  name: string;
  photoUrl: string | null;
  level: number;
  balance: number;
  status: string;
  currency: Currency;
};

export type LoginByInitDataResponse = CommonResponse & {
  user: User;
  token: string;
};
