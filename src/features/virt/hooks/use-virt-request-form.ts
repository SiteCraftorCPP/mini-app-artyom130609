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
import { showErrorMessage } from "@/shared/lib/notify";
import { type PaymentDialogContext } from "@/features/payment/payment-method-dialog";

import {
  type VirtRequestFormValues,
  calculateAmountRub,
  calculateAmountVirts,
  createVirtRequestSchema,
} from "../model";

import { type Virt } from "@/entities/virt";
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
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentContext, setPaymentContext] = useState<PaymentDialogContext | null>(null);
  const [paymentAmountRub, setPaymentAmountRub] = useState(0);
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

  const { data: promoCodes = [] } = useGetPromoCodes();
  const promoCodeValue = form.watch("promoCode");

  const activePromoCode = promoCodes.find(
    (p) =>
      p.code === (promoCodeValue ?? "").trim() &&
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

  const openPaymentAfterValidation = (values: VirtRequestFormValues) => {
    const ar = Number(values.amountRub);
    if (!Number.isFinite(ar) || ar <= 0) {
      showErrorMessage(VIRT_FORM_TEXT.amountRubRequired);
      return;
    }
    setPaymentAmountRub(ar);
    setPaymentContext({
      orderKind: "virt",
      game: virt.name,
      server: values.server,
      bankAccount: values.accountNumber,
      virtAmountLabel: formatNumberWithSpaces(String(values.amountVirts)),
      transferMethod: "Покупка виртов, мини-апп",
      promoCode: values.promoCode?.trim() ?? "",
    });
    setPaymentOpen(true);
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

    await form.handleSubmit(openPaymentAfterValidation)(event);
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
    isSubmitting: false,
    effectiveExchangeRate,
    activePromoCode,
    lockVirtsForPromo,
    paymentOpen,
    setPaymentOpen,
    paymentContext,
    paymentAmountRub,
    initData: webApp?.initData?.trim() ?? "",
  };
};
