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
  const { data, isLoading } = useVirtsPopupContent({ enabled, type });
  const selectedVirtQuery = useGetVirtById({
    enabled,
    id: selectedVirtId,
    type,
  });

  useEffect(() => {
    if (!enabled) {
      setSelectedVirtId(null);
    }
  }, [enabled]);

  return {
    data,
    isLoading,
    isVirtLoading: selectedVirtQuery.isLoading,
    onBack: () => {
      const wasHandledByNestedStep = nestedBackHandlerRef.current?.() ?? false;

      if (!wasHandledByNestedStep) {
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
