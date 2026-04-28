import type { Order } from "@/entities/order/model";

function resolveApiBase(): string {
  const notifyUrl = import.meta.env.VITE_VIRT_ORDER_NOTIFY_URL?.trim();
  if (notifyUrl) {
    return notifyUrl.replace(/\/$/, "");
  }
  let apiUrl =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "";
  const env = import.meta.env.VITE_API_URL as string | undefined;
  if (env) {
    apiUrl = env;
  }
  return apiUrl.replace(/\/$/, "");
}

export type MiniappOrdersBundle = {
  active: Order[];
  closed: Order[];
};

export async function fetchMiniappOrdersBundle(
  initData: string,
): Promise<MiniappOrdersBundle> {
  const apiUrl = resolveApiBase();
  const res = await fetch(`${apiUrl}/notify/sell-virt-webapp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData, action: "get_my_orders" }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`get_my_orders ${res.status}: ${t || res.statusText}`);
  }
  const j = (await res.json()) as {
    ok?: boolean;
    active?: Order[];
    closed?: Order[];
  };
  if (!j.ok) {
    throw new Error("get_my_orders: bad response");
  }
  return {
    active: Array.isArray(j.active) ? j.active : [],
    closed: Array.isArray(j.closed) ? j.closed : [],
  };
}

export async function fetchMiniappOrderById(
  initData: string,
  orderId: string,
): Promise<Order | null> {
  const apiUrl = resolveApiBase();
  const res = await fetch(`${apiUrl}/notify/sell-virt-webapp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      initData,
      action: "get_my_order",
      orderId,
    }),
  });
  if (res.status === 404 || res.status === 403) {
    return null;
  }
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`get_my_order ${res.status}: ${t || res.statusText}`);
  }
  const j = (await res.json()) as { ok?: boolean; order?: Order };
  if (!j.ok || !j.order) {
    return null;
  }
  return j.order;
}
