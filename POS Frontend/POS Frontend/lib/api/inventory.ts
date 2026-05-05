// lib/api/inventory.ts

export type InventoryItemRead = {
  id: number;
  sku?: string | null;
  name: string;
  menu_item_id?: number | null;
  current_qty: string; // Decimal comes as string
  low_stock_threshold: string; // Decimal comes as string
  is_out_of_stock: boolean;
  updated_at: string;
};

export type InventoryItemCreate = {
  sku?: string | null;
  name: string;
  menu_item_id?: number | null;
  current_qty: number; // send number; backend Decimal will parse
  low_stock_threshold: number;
  is_out_of_stock?: boolean;
};

export type InventoryItemUpdate = {
  // Your CURRENT backend only supports these 3 fields :contentReference[oaicite:7]{index=7}
  // If you upgraded backend (recommended), you can also add: sku/name/menu_item_id
  sku?: string | null;
  name?: string;
  menu_item_id?: number | null;

  current_qty?: number;
  low_stock_threshold?: number;
  is_out_of_stock?: boolean;
};

export type StockAdjust = {
  change_qty: number; // +/- number
  reason: string;
};

// --- same pattern as lib/api/employee.ts (token + base url) ---
function getApiBase() {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
  return base.replace(/\/$/, "");
}

function getToken() {
  return (
    (typeof window !== "undefined" && localStorage.getItem("token")) ||
    (typeof window !== "undefined" && localStorage.getItem("access_token")) ||
    ""
  );
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
    } catch {
      // ignore
    }
    throw new Error(msg);
  }

  // 204 no content
  if (res.status === 204) return undefined as T;

  return (await res.json()) as T;
}

// ------- endpoints (mounted at /api/inventory) :contentReference[oaicite:8]{index=8} -------
// lib/api/inventory.ts
// ✅ Keep your existing types as-is above

export function listInventory(opts?: { lowStockOnly?: boolean; q?: string; limit?: number; offset?: number }) {
  const qs = new URLSearchParams();
  if (opts?.lowStockOnly) qs.set("low_stock_only", "true");
  if (opts?.q) qs.set("q", opts.q);
  if (opts?.limit !== undefined) qs.set("limit", String(opts.limit));
  if (opts?.offset !== undefined) qs.set("offset", String(opts.offset));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<InventoryItemRead[]>(`/inventory/items${suffix}`, { method: "GET" });
}


export function createInventoryItem(payload: InventoryItemCreate) {
  return apiFetch<InventoryItemRead>("/inventory/items", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateInventoryItem(itemId: number, payload: InventoryItemUpdate) {
  return apiFetch<InventoryItemRead>(`/inventory/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function adjustInventoryStock(itemId: number, payload: StockAdjust) {
  return apiFetch<InventoryItemRead>(`/inventory/items/${itemId}/adjust`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// NOTE: Your CURRENT backend file doesn't have DELETE.
// Add it server-side, then this will work.
export function deleteInventoryItem(itemId: number) {
  return apiFetch<void>(`/inventory/items/${itemId}`, { method: "DELETE" });
}

