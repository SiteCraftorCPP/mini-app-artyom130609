import { z } from "zod";

import { CURRENCY } from "@/shared/constants/common";
import { VIRT_FORM_TEXT } from "@/shared/constants/text";

export const createVirtRequestSchema = (minAmountRub: number) =>
  z.object({
    accountNumber: z.string().trim().min(1, VIRT_FORM_TEXT.accountNumberRequired),
    amountRub: z
      .string()
      .trim()
      .min(1, VIRT_FORM_TEXT.amountRubRequired)
      .refine((value) => Number(value) >= minAmountRub, {
        message: VIRT_FORM_TEXT.minimumAmountTemplate(
          minAmountRub,
          CURRENCY.RUB,
        ),
      }),
    amountVirts: z.string().trim().min(1, VIRT_FORM_TEXT.amountVirtsRequired),
    promoCode: z.string().trim().optional(),
    server: z.string().trim().min(1, VIRT_FORM_TEXT.serverRequired),
  });

export type VirtRequestFormValues = z.infer<
  ReturnType<typeof createVirtRequestSchema>
>;
