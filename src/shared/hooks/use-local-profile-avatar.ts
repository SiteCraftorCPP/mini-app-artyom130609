import { useCallback, useState } from "react";

import { readImageAsResizedJpeg } from "@/shared/lib/resize-image";

const STORAGE_KEY = "artshop_local_profile_avatar_v1";
const MAX_BYTES = 450_000;

type UseLocalProfileAvatar = {
  dataUrl: string | null;
  setFromFile: (file: File) => Promise<void>;
  clear: () => void;
};

function loadStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function useLocalProfileAvatar(): UseLocalProfileAvatar {
  const [dataUrl, setDataUrl] = useState<string | null>(loadStored);

  const persist = useCallback((value: string | null) => {
    setDataUrl(value);
    try {
      if (value) {
        localStorage.setItem(STORAGE_KEY, value);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      setDataUrl(null);
    }
  }, []);

  const setFromFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        return;
      }
      let out = await readImageAsResizedJpeg(file, 480, 0.82);
      let q = 0.82;
      while (out.length > MAX_BYTES * 1.35 && q > 0.45) {
        q -= 0.07;
        out = await readImageAsResizedJpeg(file, 400, q);
      }
      if (out.length > MAX_BYTES * 1.1) {
        out = await readImageAsResizedJpeg(file, 320, 0.7);
      }
      persist(out);
    },
    [persist],
  );

  const clear = useCallback(() => persist(null), [persist]);

  return { dataUrl, setFromFile, clear };
}
