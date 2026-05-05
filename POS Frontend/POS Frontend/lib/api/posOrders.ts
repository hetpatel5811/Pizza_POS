// lib/api/posOrders.ts

export type POSOrderType = "DINE_IN" | "TAKEAWAY";

export type POSOrderItemCreate = {
  menu_item_id: number;
  qty: number;
  size?: "small" | "medium" | "large";
  crust?: string | null;
  sauce?: string | null;
  extra_cheese?: boolean;
  extra_sauce?: boolean;
  special_instructions?: string | null;
  toppings?: Array<{ topping_id: number; quantity: number }>;
};

export type POSOrderCreate = {
  order_type: POSOrderType;
  table_no?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  special_instructions?: string | null;
  items: POSOrderItemCreate[];
};

export type POSOrderItemRead = {
  id: number;
  menu_item_id?: number | null;
  name_snapshot: string;
  unit_price: string;
  qty: number;
  note?: string | null;
  is_voided: boolean;
  created_at: string;
};

export type POSOrderRead = {
  id: number;
  order_type: string;
  status: string;
  table_no?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  delivery_address_text?: string | null;
  special_instructions?: string | null;
  subtotal?: string | number;
  tax?: string | number;
  total?: string | number;
  created_at: string;
  updated_at: string;
  items: POSOrderItemRead[];
};

function getApiBase() {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  return base.replace(/\/$/, "");
}

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || localStorage.getItem("access_token") || "";
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      msg = data?.detail || data?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ✅ what OrdersPanel imports
export function createPosOrder(payload: POSOrderCreate) {
  return apiFetch<POSOrderRead>(`/employee/orders`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listPosOrders(params?: { status?: string; limit?: number; offset?: number }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status_filter", params.status);
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.offset != null) qs.set("offset", String(params.offset));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<POSOrderRead[]>(`/employee/orders${suffix}`, { method: "GET" });
}
    
