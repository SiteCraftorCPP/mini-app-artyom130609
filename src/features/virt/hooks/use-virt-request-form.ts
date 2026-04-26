import { useWebApp } from "@vkruglikov/react-telegram-web-app";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useForm } from "react-hook-form";

import { DEFAULT } from "@/shared/constants/default";
import { VIRT_FORM_TEXT } from "@/shared/constants/text";
import { formatNumberWithSpaces } from "@/shared/lib/format-numbers";
import { showErrorMessage, showSuccessMessage } from "@/shared/lib/notify";
import { notifyVirtOrderSuccessFromMiniApp } from "@/shared/lib/telegram-virt-order-notify";

import {
  type VirtRequestFormValues,
  calculateAmountRub,
  calculateAmountVirts,
  createVirtRequestSchema,
} from "../model";

import { type Virt, useSubmitVirtRequest } from "@/entities/virt";
import { useGetPromoCodes } from "@/entities/promo-code";

const getDefaultAmountRub = () => "";

const getDefaultAmountVirts = () => "";

const getDefaultValues = (virt: Virt): VirtRequestFormValues => ({
  accountNumber: virt.accountNumber,
  amountRub: getDefaultAmountRub(),
  amountVirts: getDefaultAmountVirts(),
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
  const amountRubInputRef = useRef(String(getDefaultAmountRub()));
  const amountVirtInputRef = useRef(String(getDefaultAmountVirts()));
  const lastEditedAmountFieldRef = useRef<AmountFieldName>("amountRub");
  const [displayAmountRub, setDisplayAmountRub] = useState(
    getDefaultAmountRub(),
  );
  const [lastEditedForAmount, setLastEditedForAmount] =
    useState<AmountFieldName>("amountRub");

  useEffect(() => {
    const defaultValues = getDefaultValues(virt);

    form.reset(defaultValues);
    amountRubInputRef.current = defaultValues.amountRub;
    amountVirtInputRef.current = defaultValues.amountVirts;
    setDisplayAmountRub(defaultValues.amountRub);
    setLastEditedForAmount("amountRub");
  }, [form, virt]);

  const handleAmountRubInput = useCallback((value: string) => {
    lastEditedAmountFieldRef.current = "amountRub";
    setLastEditedForAmount("amountRub");
    amountRubInputRef.current = value;
  }, []);

  const handleAmountVirtInput = useCallback((value: string) => {
    lastEditedAmountFieldRef.current = "amountVirts";
    setLastEditedForAmount("amountVirts");
    amountVirtInputRef.current = value;
  }, []);

  const {
    data: promoCodes = [],
    refetch: refetchPromoCodes,
    isFetching: isPromoListFetching,
  } = useGetPromoCodes();
  const promoCodeValue = form.watch("promoCode");
  const [promoApplyFeedback, setPromoApplyFeedback] = useState<
    "idle" | "ok" | "not_found" | "error" | "empty" | "loading"
  >("idle");

  useEffect(() => {
    setPromoApplyFeedback("idle");
  }, [promoCodeValue]);

  const applyPromoCode = useCallback(async () => {
    const code = (form.getValues("promoCode") ?? "").trim();
    if (!code) {
      setPromoApplyFeedback("empty");
      return;
    }
    setPromoApplyFeedback("loading");
    try {
      const { data, isError, error } = await refetchPromoCodes();
      if (isError) {
        console.warn("[promo] refetch", error);
        setPromoApplyFeedback("error");
        return;
      }
      const list = data ?? [];
      const found = list.find(
        (p) =>
          p.code.toLowerCase() === code.toLowerCase() &&
          (p.activationsLeft === null || p.activationsLeft > 0),
      );
      setPromoApplyFeedback(found ? "ok" : "not_found");
    } catch (e) {
      console.warn("[promo] apply", e);
      setPromoApplyFeedback("error");
    }
  }, [form, refetchPromoCodes]);

  const activePromoCode = promoCodes.find(
    (p) =>
      p.code.toLowerCase() === promoCodeValue?.trim().toLowerCase() &&
      (p.activationsLeft === null || p.activationsLeft > 0),
  );
  const discount = activePromoCode ? activePromoCode.discount : 0;
  const effectiveExchangeRate = virt.exchangeRate * (1 - discount / 100);
  /** С промо цена в ₽ снижается при том же количестве КК, а не наоборот. */
  const lockVirtsForPromo = Boolean(activePromoCode);

  useEffect(() => {
    if (!amountVirtInputRef.current && !amountRubInputRef.current) return;

    const rateOpts = getVirtExchangeRate({
      ...virt,
      exchangeRate: effectiveExchangeRate,
    });

    let amountRub: string;
    let amountVirts: string;

    if (lockVirtsForPromo) {
      amountVirts = amountVirtInputRef.current;
      amountRub = calculateAmountRub(amountVirts, rateOpts);
    } else {
      amountRub =
        lastEditedAmountFieldRef.current === "amountVirts"
          ? calculateAmountRub(amountVirtInputRef.current, rateOpts)
          : amountRubInputRef.current;

      amountVirts =
        lastEditedAmountFieldRef.current === "amountRub"
          ? calculateAmountVirts(amountRubInputRef.current, rateOpts)
          : amountVirtInputRef.current;
    }

    if (amountRub !== amountRubInputRef.current || amountVirts !== amountVirtInputRef.current) {
      amountRubInputRef.current = amountRub;
      amountVirtInputRef.current = amountVirts;
      form.setValue("amountRub", amountRub, { shouldDirty: true, shouldValidate: true });
      form.setValue("amountVirts", amountVirts, { shouldDirty: true, shouldValidate: true });
      setDisplayAmountRub(amountRub);
    }
  }, [effectiveExchangeRate, form, virt, lockVirtsForPromo]);

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
        game: virt.name,
        server: values.server,
        bankAccount: values.accountNumber,
        amountRub: Number(values.amountRub),
        virtAmountLabel: formatNumberWithSpaces(values.amountVirts),
        transferMethod: "Оплата в мини-аппе",
        promoCode: values.promoCode ?? "",
      });
    } catch {
      showErrorMessage(VIRT_FORM_TEXT.paymentError);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const rateOpts = getVirtExchangeRate({
      ...virt,
      exchangeRate: effectiveExchangeRate,
    });

    let amountRub: string;
    let amountVirts: string;

    if (lockVirtsForPromo) {
      amountVirts = amountVirtInputRef.current;
      amountRub = calculateAmountRub(amountVirts, rateOpts);
    } else {
      amountRub =
        lastEditedAmountFieldRef.current === "amountVirts"
          ? calculateAmountRub(amountVirtInputRef.current, rateOpts)
          : amountRubInputRef.current;
      amountVirts =
        lastEditedAmountFieldRef.current === "amountRub"
          ? calculateAmountVirts(amountRubInputRef.current, rateOpts)
          : amountVirtInputRef.current;
    }

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
    lastEditedForAmount,
    initialAmountRub: getDefaultAmountRub(),
    initialAmountVirts: getDefaultAmountVirts(),
    isSubmitting: submitVirtRequest.isPending,
    effectiveExchangeRate,
    activePromoCode,
    applyPromoCode,
    promoApplyFeedback,
    isPromoListFetching,
    lockVirtsForPromo,
  };
};
