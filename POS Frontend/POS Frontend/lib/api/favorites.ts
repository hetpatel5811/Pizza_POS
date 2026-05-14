export type FavoritePizzaRead = {
  id: number;
  user_id: number;
  menu_item_id?: number | null;
  name: string;
  description?: string | null;
  image_url?: string | null;
  price: number;
  rating?: number | null;
  default_size?: string | null;
  default_crust?: string | null;
  extras: string[];
  created_at: string;
  updated_at: string;
};

export type FavoritePizzaPayload = {
  menu_item_id?: number;
  name: string;
  description?: string;
  image_url?: string;
  price: number;
  rating?: number;
  default_size?: string;
  default_crust?: string;
  extras?: string[];
};

export type FavoritePizzaUpdatePayload = Partial<FavoritePizzaPayload>;

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

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function listFavoritePizzas() {
  return apiFetch<FavoritePizzaRead[]>("/favorites/me", { method: "GET" });
}

export function addFavoritePizza(payload: FavoritePizzaPayload) {
  return apiFetch<FavoritePizzaRead>("/favorites/me", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateFavoritePizza(favoriteId: number, payload: FavoritePizzaUpdatePayload) {
  return apiFetch<FavoritePizzaRead>(`/favorites/me/${favoriteId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteFavoritePizza(favoriteId: number) {
  return apiFetch<void>(`/favorites/me/${favoriteId}`, {
    method: "DELETE",
  });
}
