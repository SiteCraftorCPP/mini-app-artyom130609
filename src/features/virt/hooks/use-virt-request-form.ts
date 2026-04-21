import { useWebApp } from "@vkruglikov/react-telegram-web-app";
import { zodResolver } from "@hookform/resolvers/zod";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { DEFAULT } from "@/shared/constants/default";
import { VIRT_FORM_TEXT } from "@/shared/constants/text";
import { showErrorMessage, showSuccessMessage } from "@/shared/lib/notify";
import { notifyVirtOrderSuccessFromMiniApp } from "@/shared/lib/telegram-virt-order-notify";

import {
  type VirtRequestFormValues,
  calculateAmountRub,
  calculateAmountVirts,
  createVirtRequestSchema,
} from "../model";

import { type Virt, useSubmitVirtRequest } from "@/entities/virt";

const getDefaultAmountRub = (virt: Virt) => String(virt.minAmountRub || 100);

const getDefaultAmountVirts = (virt: Virt) => {
  if (virt.amountVirts) {
    return String(virt.amountVirts);
  }

  return calculateAmountVirts(getDefaultAmountRub(virt), {
    amountRub: virt.exchangeRate,
    amountVirts: DEFAULT.MIN_AMOUNT_VIRT,
  });
};

const getDefaultValues = (virt: Virt): VirtRequestFormValues => ({
  accountNumber: virt.accountNumber,
  amountRub: getDefaultAmountRub(virt),
  amountVirts: getDefaultAmountVirts(virt),
  promoCode: virt.promoCode,
  server: virt.serverOptions[0] ?? "",
});

const getVirtExchangeRate = (virt: Virt) => ({
  amountRub: virt.exchangeRate,
  amountVirts: DEFAULT.MIN_AMOUNT_VIRT,
});

type UseVirtRequestFormParams = {
  virt: Virt;
};

type AmountFieldName = "amountRub" | "amountVirts";

export const useVirtRequestForm = ({ virt }: UseVirtRequestFormParams) => {
  const webApp = useWebApp();
  const form = useForm<VirtRequestFormValues>({
    resolver: zodResolver(createVirtRequestSchema(virt.minAmountRub)),
    defaultValues: getDefaultValues(virt),
  });
  const submitVirtRequest = useSubmitVirtRequest();
  const amountRubInputRef = useRef(String(getDefaultAmountRub(virt)));
  const amountVirtInputRef = useRef(String(getDefaultAmountVirts(virt)));
  const lastEditedAmountFieldRef = useRef<AmountFieldName>("amountRub");
  const [displayAmountRub, setDisplayAmountRub] = useState(
    getDefaultAmountRub(virt),
  );

  useEffect(() => {
    const defaultValues = getDefaultValues(virt);

    form.reset(defaultValues);
    amountRubInputRef.current = defaultValues.amountRub;
    amountVirtInputRef.current = defaultValues.amountVirts;
    setDisplayAmountRub(defaultValues.amountRub);
  }, [form, virt]);

  const handleAmountRubInput = useCallback((value: string) => {
    lastEditedAmountFieldRef.current = "amountRub";
    amountRubInputRef.current = value;
  }, []);

  const handleAmountVirtInput = useCallback((value: string) => {
    lastEditedAmountFieldRef.current = "amountVirts";
    amountVirtInputRef.current = value;
  }, []);

  const handleAmountsCommit = useCallback(
    (amountRub: string, amountVirts: string) => {
      amountRubInputRef.current = amountRub;
      amountVirtInputRef.current = amountVirts;

      form.setValue("amountRub", amountRub, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue("amountVirts", amountVirts, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setDisplayAmountRub(amountRub);
    },
    [form],
  );

  const submitVirtRequestForm = async (values: VirtRequestFormValues) => {
    try {
      const result = await submitVirtRequest.mutateAsync({
        accountNumber: values.accountNumber,
        amountRub: Number(values.amountRub),
        amountVirts: Number(values.amountVirts),
        id: virt.id,
        promoCode: values.promoCode ?? "",
        server: values.server,
      });

      showSuccessMessage(VIRT_FORM_TEXT.paymentSuccess);
      void notifyVirtOrderSuccessFromMiniApp(webApp, {
        orderKind: "virt",
        orderId: result.orderId,
        orderNumber: result.orderNumber,
      });
    } catch {
      showErrorMessage(VIRT_FORM_TEXT.paymentError);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const amountRub =
      lastEditedAmountFieldRef.current === "amountVirts"
        ? calculateAmountRub(
            amountVirtInputRef.current,
            getVirtExchangeRate(virt),
          )
        : amountRubInputRef.current;
    const amountVirts =
      lastEditedAmountFieldRef.current === "amountRub"
        ? calculateAmountVirts(
            amountRubInputRef.current,
            getVirtExchangeRate(virt),
          )
        : amountVirtInputRef.current;

    amountRubInputRef.current = amountRub;
    amountVirtInputRef.current = amountVirts;
    setDisplayAmountRub(amountRub);

    form.setValue("amountRub", amountRub, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("amountVirts", amountVirts, {
      shouldDirty: true,
      shouldValidate: true,
    });

    await form.handleSubmit(submitVirtRequestForm)(event);
  };

  return {
    displayAmountRub,
    form,
    handleAmountRubInput,
    handleAmountVirtInput,
    handleAmountsCommit,
    handleSubmit,
    initialAmountRub: getDefaultAmountRub(virt),
    initialAmountVirts: getDefaultAmountVirts(virt),
    isSubmitting: submitVirtRequest.isPending,
  };
};
