import { useEffect, useState } from "react";
import { useRef } from "react";

import type { VirtPopupType } from "../model";

import { useVirtsPopupContent } from "./use-virts-popup-content";
import { useGetVirtById } from "@/entities/virt";

type UseVirtPopupFlowParams = {
  enabled: boolean;
  type: VirtPopupType;
};

export const useVirtPopupFlow = ({ enabled, type }: UseVirtPopupFlowParams) => {
  const [selectedVirtId, setSelectedVirtId] = useState<string | null>(null);
  const nestedBackHandlerRef = useRef<(() => boolean) | null>(null);
  /** После «назад» с экрана единственной игры не автовыбирать снова, пока не закроют попап. */
  const buyAccountBackFromSingleListRef = useRef(false);
  const { data, isLoading } = useVirtsPopupContent({ enabled, type });
  const selectedVirtQuery = useGetVirtById({
    enabled,
    id: selectedVirtId,
    type,
  });

  useEffect(() => {
    if (!enabled) {
      setSelectedVirtId(null);
      buyAccountBackFromSingleListRef.current = false;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || type !== "buy-accounts" || !data || data.length !== 1) {
      return;
    }
    if (selectedVirtId !== null || buyAccountBackFromSingleListRef.current) {
      return;
    }
    setSelectedVirtId(data[0]!.id);
  }, [data, enabled, selectedVirtId, type]);

  return {
    data,
    isLoading,
    isVirtLoading: selectedVirtQuery.isLoading,
    onBack: () => {
      const wasHandledByNestedStep = nestedBackHandlerRef.current?.() ?? false;

      if (!wasHandledByNestedStep) {
        if (type === "buy-accounts" && data && data.length === 1) {
          buyAccountBackFromSingleListRef.current = true;
        }
        setSelectedVirtId(null);
      }
    },
    onSelectVirt: (id: string) => setSelectedVirtId(id),
    registerNestedBackHandler: (handler: (() => boolean) | null) => {
      nestedBackHandlerRef.current = handler;
    },
    selectedVirt: selectedVirtQuery.data,
    selectedVirtId,
  };
};
