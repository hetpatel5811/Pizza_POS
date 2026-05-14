export type CustomerOrderItemRead = {
  id: number;
  menu_item_id: number;
  menu_item_name: string;
  size: string;
  quantity: number;
  crust?: string | null;
  sauce?: string | null;
  extra_cheese: boolean;
  extra_sauce: boolean;
  special_instructions?: string | null;
  unit_price: number;
  total_price: number;
};

export type CustomerOrderRead = {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email?: string | null;
  customer_phone: string;
  order_type: string;
  payment_method: string;
  delivery_address?: string | null;
  delivery_instructions?: string | null;
  table_number?: string | null;
  notes?: string | null;
  delivery_zip?: string | null;
  status: string;
  payment_status: string;
  subtotal: number;
  tax: number;
  delivery_fee: number;
  discount: number;
  total: number;
  estimated_delivery_time?: string | null;
  created_at: string;
  updated_at: string;
  items: CustomerOrderItemRead[];
};

function getApiBase() {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
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

  return (await res.json()) as T;
}

export function listCustomerOrders(params?: { status?: string; limit?: number; offset?: number }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status_filter", params.status);
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.offset != null) qs.set("offset", String(params.offset));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<CustomerOrderRead[]>(`/orders/me${suffix}`, { method: "GET" });
}

export function getCustomerOrder(orderNumber: string) {
  return apiFetch<CustomerOrderRead>(`/orders/${encodeURIComponent(orderNumber)}`, {
    method: "GET",
  });
}

export function approveCustomerOrder(orderNumber: string) {
  return apiFetch<CustomerOrderRead>(`/orders/${encodeURIComponent(orderNumber)}/approve`, {
    method: "POST",
  });
}

export function declineCustomerOrder(orderNumber: string, reason?: string) {
  const qs = new URLSearchParams();
  if (reason?.trim()) qs.set("reason", reason.trim());
  const suffix = qs.toString() ? `?${qs.toString()}` : "";

  return apiFetch<CustomerOrderRead>(`/orders/${encodeURIComponent(orderNumber)}/decline${suffix}`, {
    method: "POST",
  });
}
