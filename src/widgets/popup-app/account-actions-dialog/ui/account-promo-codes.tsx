import { useState } from "react";
import { AppText } from "@/ui/app-text";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Spinner } from "@/ui/spinner";
import {
  useAddPromoCode,
  useDeletePromoCode,
  useGetPromoCodes,
} from "@/entities/promo-code";

export const AccountPromoCodes = () => {
  const { data: promoCodes = [], isLoading } = useGetPromoCodes();
  const { mutate: addPromoCode, isPending: isAdding } = useAddPromoCode();
  const { mutate: deletePromoCode } = useDeletePromoCode();

  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");
  const [activations, setActivations] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discount) return;

    addPromoCode(
      {
        code: code.trim(),
        discount: Number(discount),
        activationsLeft: activations ? Number(activations) : null,
      },
      {
        onSuccess: () => {
          setCode("");
          setDiscount("");
          setActivations("");
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6 px-4 pb-4">
      {/* List of existing promo codes */}
      <div className="flex flex-col gap-3">
        <AppText variant="primaryStrong" size="popupBody">
          Существующие промокоды
        </AppText>
        {isLoading ? (
          <Spinner />
        ) : promoCodes.length === 0 ? (
          <AppText variant="secondary" size="caption">
            Нет активных промокодов
          </AppText>
        ) : (
          <div className="flex flex-col gap-2">
            {promoCodes.map((pc) => (
              <div
                key={pc.id}
                className="bg-background-card flex items-center justify-between rounded-lg p-3 border border-white/10"
              >
                <div className="flex flex-col">
                  <AppText variant="primaryStrong" size="caption">
                    {pc.code}
                  </AppText>
                  <AppText variant="secondary" size="caption">
                    Скидка: {pc.discount}% |{" "}
                    {pc.activationsLeft === null
                      ? "Бесконечно"
                      : `Осталось: ${pc.activationsLeft}`}
                  </AppText>
                </div>
                <Button
                  type="button"
                  variant="popupCancel"
                  size="popupCancel"
                  className="px-3"
                  onClick={() => deletePromoCode(pc.id)}
                >
                  Удалить
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add new promo code */}
      <form onSubmit={handleAdd} className="flex flex-col gap-3 border-t border-white/10 pt-4">
        <AppText variant="primaryStrong" size="popupBody">
          Добавить промокод
        </AppText>
        
        <div className="flex flex-col gap-2">
          <Input
            placeholder="Промокод (напр. SUMMER24)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <Input
            type="number"
            placeholder="Скидка в % (напр. 10)"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            min="1"
            max="100"
            required
          />
          <Input
            type="number"
            placeholder="Кол-во активаций (пусто = бесконечно)"
            value={activations}
            onChange={(e) => setActivations(e.target.value)}
            min="1"
          />
        </div>

        <Button
          type="submit"
          variant="popupSubmit"
          size="popupSubmit"
          disabled={!code || !discount || isAdding}
        >
          {isAdding ? "Добавление..." : "Добавить"}
        </Button>
      </form>
    </div>
  );
};