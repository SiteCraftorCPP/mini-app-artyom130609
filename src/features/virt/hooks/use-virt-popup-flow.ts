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
  /** После «назад» с экрана единственной игры не подставлять авто-id, пока не закроют попап. */
  const buyAccountBackFromSingleListRef = useRef(false);
  const { data, isLoading } = useVirtsPopupContent({ enabled, type });

  const activeVirtId =
    selectedVirtId ??
    (type === "buy-accounts" &&
    data &&
    data.length === 1 &&
    !buyAccountBackFromSingleListRef.current
      ? data[0]!.id
      : null);

  const selectedVirtQuery = useGetVirtById({
    enabled,
    id: activeVirtId,
    type,
  });

  useEffect(() => {
    if (!enabled) {
      setSelectedVirtId(null);
      buyAccountBackFromSingleListRef.current = false;
    }
  }, [enabled]);

  return {
    activeVirtId,
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
