const KEY = "artvirt:postPaymentNotice";
const MAX_AGE_MS = 20 * 60 * 1000;

export type StoredPostPaymentNotice = {
  orderNumber: string;
  orderKind: "virt" | "account" | "other_service";
  otherMode?: "auto" | "manual";
  at: number;
};

export function savePostPaymentNotice(
  p: Omit<StoredPostPaymentNotice, "at">,
): void {
  try {
    const data: StoredPostPaymentNotice = { ...p, at: Date.now() };
    sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* private mode / quota */
  }
}

export function readPostPaymentNotice(): StoredPostPaymentNotice | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) {
      return null;
    }
    const j = JSON.parse(raw) as Partial<StoredPostPaymentNotice>;
    if (
      typeof j.orderNumber !== "string" ||
      (j.orderKind !== "virt" &&
        j.orderKind !== "account" &&
        j.orderKind !== "other_service")
    ) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    const at = typeof j.at === "number" ? j.at : 0;
    if (Date.now() - at > MAX_AGE_MS) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return {
      orderNumber: j.orderNumber,
      orderKind: j.orderKind,
      otherMode:
        j.otherMode === "auto" || j.otherMode === "manual"
          ? j.otherMode
          : undefined,
      at,
    };
  } catch {
    return null;
  }
}

export function clearPostPaymentNotice(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* */
  }
}
