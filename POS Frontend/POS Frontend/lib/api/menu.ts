// lib/api/menu.ts

export type CategoryRead = {
  id: number;
  name: string;
  description?: string | null;
  display_order?: number;
  image_url?: string | null;
  is_active: boolean;
};

export type MenuItemRead = {
  id: number;
  name: string;
  description?: string | null;
  image_url?: string | null;

  category_id: number;
  category_name?: string | null;

  price_small?: number | null;
  price_medium?: number | null;
  price_large?: number | null;

  is_popular: boolean;
  is_spicy: boolean;
  is_active: boolean;
  is_deal: boolean;

  created_at: string;
  updated_at?: string | null;
};

export type MenuItemCreate = {
  name: string;
  description?: string | null;
  image_url?: string | null;
  category_id: number;

  price_small?: number | null;
  price_medium?: number | null;
  price_large?: number | null;

  is_popular?: boolean;
  is_spicy?: boolean;
  is_active?: boolean;

  is_deal?: boolean;
};

export type MenuItemUpdate = Partial<MenuItemCreate>;

export type ToppingRead = {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  category?: string | null;
  is_vegetarian: boolean;
  is_available: boolean;
};

export type ToppingCreate = {
  name: string;
  description?: string | null;
  price: number;
  category?: string | null;
  is_vegetarian?: boolean;
  is_available?: boolean;
};

export type ToppingUpdate = Partial<ToppingCreate>;

export type CrustOptionRead = {
  id: number;
  name: string;
  description?: string | null;
  price_adjustment: number;
  sort_order: number;
  is_available: boolean;
  created_at?: string | null;
};

export type CrustOptionCreate = {
  name: string;
  description?: string | null;
  price_adjustment?: number;
  sort_order?: number;
  is_available?: boolean;
};

export type CrustOptionUpdate = Partial<CrustOptionCreate>;

function getApiBase() {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
  // If your backend already prefixes "/api", set NEXT_PUBLIC_API_URL accordingly.
  // Example: NEXT_PUBLIC_API_URL="http://127.0.0.1:8000/api"
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

/* ---------------- Categories ---------------- */

export function listCategories(onlyActive = true) {
  const qs = new URLSearchParams();
  qs.set("only_active", String(onlyActive));
  return apiFetch<CategoryRead[]>(`/menu/categories?${qs.toString()}`, { method: "GET" });
}

/* ---------------- Menu ---------------- */

export function listMenuItems(params?: {
  only_active?: boolean;
  popular_only?: boolean;
  category_id?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.only_active !== undefined) qs.set("only_active", String(params.only_active));
  if (params?.popular_only !== undefined) qs.set("popular_only", String(params.popular_only));
  if (params?.category_id !== undefined) qs.set("category_id", String(params.category_id));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<MenuItemRead[]>(`/menu/${suffix}`, { method: "GET" });
}

export function listDeals(onlyActive = true) {
  const qs = new URLSearchParams();
  qs.set("only_active", String(onlyActive));
  return apiFetch<MenuItemRead[]>(`/menu/deals?${qs.toString()}`, { method: "GET" });
}

export function listToppings(params?: { category?: string; only_available?: boolean }) {
  const qs = new URLSearchParams();
  if (params?.category) qs.set("category", params.category);
  if (params?.only_available !== undefined) qs.set("only_available", String(params.only_available));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<ToppingRead[]>(`/menu/toppings${suffix}`, { method: "GET" });
}

export function createTopping(payload: ToppingCreate) {
  return apiFetch<ToppingRead>(`/menu/toppings`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTopping(toppingId: number, payload: ToppingUpdate) {
  return apiFetch<ToppingRead>(`/menu/toppings/${toppingId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteTopping(toppingId: number) {
  return apiFetch<void>(`/menu/toppings/${toppingId}`, {
    method: "DELETE",
  });
}

export function listCrustOptions(params?: { only_available?: boolean }) {
  const qs = new URLSearchParams();
  if (params?.only_available !== undefined) qs.set("only_available", String(params.only_available));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<CrustOptionRead[]>(`/menu/crust-options${suffix}`, { method: "GET" });
}

export function createCrustOption(payload: CrustOptionCreate) {
  return apiFetch<CrustOptionRead>(`/menu/crust-options`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCrustOption(crustId: number, payload: CrustOptionUpdate) {
  return apiFetch<CrustOptionRead>(`/menu/crust-options/${crustId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteCrustOption(crustId: number) {
  return apiFetch<void>(`/menu/crust-options/${crustId}`, {
    method: "DELETE",
  });
}

export function createMenuItem(payload: MenuItemCreate) {
  return apiFetch<MenuItemRead>(`/menu/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createDeal(payload: MenuItemCreate) {
  return apiFetch<MenuItemRead>(`/menu/deals`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateMenuItem(itemId: number, payload: MenuItemUpdate) {
  return apiFetch<MenuItemRead>(`/menu/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
