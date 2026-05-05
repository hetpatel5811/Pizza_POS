"use client";

import React, { useEffect, useMemo, useState } from "react";
import { listMenuItems, listToppings, type MenuItemRead, type ToppingRead } from "@/lib/api/menu";
import {
  createPosOrder,
  type POSOrderCreate,
  type POSOrderType,
} from "@/lib/api/posOrders";

/* --------------------------------- utils --------------------------------- */

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function money(n?: number | null) {
  if (n == null) return "—";
  return `$${n.toFixed(2)}`;
}

function safeUrl(url: string) {
  const u = (url || "").trim();
  if (!u) return "";
  if (!/^https?:\/\//i.test(u)) return u;
  return u;
}

/* --------------------------------- icons --------------------------------- */

function Icon({
  name,
  className,
}: {
  name:
    | "pizza"
    | "cart"
    | "receipt"
    | "refresh"
    | "search"
    | "plus"
    | "minus"
    | "trash"
    | "check"
    | "table"
    | "takeaway";
  className?: string;
}) {
  const c = cx("inline-block", className);

  switch (name) {
    case "pizza":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 2c5.5 0 10 1.4 10 1.4s-1.4 4.5-4.1 8.7C15.2 16.3 12 21.5 12 21.5S8.8 16.3 6.1 12.1C3.4 7.9 2 3.4 2 3.4S6.5 2 12 2Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M7.5 10.2c2.8-1 6.2-1 9 0"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="9" cy="8" r="1.1" fill="currentColor" />
          <circle cx="15.5" cy="7.5" r="1.1" fill="currentColor" />
          <circle cx="12.2" cy="12.5" r="1.1" fill="currentColor" />
        </svg>
      );

    case "cart":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6 6h15l-1.4 8.5a2 2 0 0 1-2 1.7H9.2a2 2 0 0 1-2-1.6L5.2 3.8H3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 21a1.2 1.2 0 1 0 0-2.4A1.2 1.2 0 0 0 9 21Z"
            fill="currentColor"
          />
          <path
            d="M18 21a1.2 1.2 0 1 0 0-2.4A1.2 1.2 0 0 0 18 21Z"
            fill="currentColor"
          />
        </svg>
      );

    case "receipt":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7 3h10v18l-2-1-2 1-2-1-2 1-2-1-2 1V3Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M9 8h6M9 12h6M9 16h4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );

    case "refresh":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20 6v6h-6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M20 12a8 8 0 1 1-2.3-5.7"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );

    case "search":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M21 21l-4.2-4.2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );

    case "plus":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 5v14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    case "minus":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    case "trash":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 7h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path
            d="M10 11v7M14 11v7"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M6 7l1 14h10l1-14"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M9 7V4h6v3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "check":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20 6 9 17l-5-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "table":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 10h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M6 10V6h12v4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M7 10v8M17 10v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    case "takeaway":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 8h10l-1 13H8L7 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path
            d="M9 8V6a3 3 0 0 1 6 0v2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );

    default:
      return null;
  }
}

/* ----------------------------- small components ---------------------------- */

function Pill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "green" | "rose" | "amber" | "slate" | "indigo";
}) {
  const styles =
    tone === "green"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : tone === "rose"
      ? "bg-rose-50 text-rose-700 ring-rose-200"
      : tone === "amber"
      ? "bg-amber-50 text-amber-800 ring-amber-200"
      : tone === "indigo"
      ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
      : "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black ring-1", styles)}>
      {children}
    </span>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  tone = "dark",
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "dark" | "green" | "rose" | "amber" | "indigo";
  className?: string;
}) {
  const toneClasses =
    tone === "green"
      ? "bg-emerald-600 text-white hover:bg-emerald-700"
      : tone === "rose"
      ? "bg-rose-600 text-white hover:bg-rose-700"
      : tone === "amber"
      ? "bg-amber-600 text-white hover:bg-amber-700"
      : tone === "indigo"
      ? "bg-indigo-600 text-white hover:bg-indigo-700"
      : "bg-slate-900 text-white hover:bg-slate-800";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-extrabold",
        "shadow-sm ring-1 ring-black/5 transition",
        "focus:outline-none focus:ring-2 focus:ring-slate-400/40",
        disabled ? "cursor-not-allowed opacity-60" : "hover:-translate-y-[1px] active:translate-y-0",
        toneClasses,
        className
      )}
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
  disabled,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-extrabold",
        "bg-white/70 text-slate-900 ring-1 ring-slate-200 hover:bg-white",
        "focus:outline-none focus:ring-2 focus:ring-slate-300",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
    >
      {children}
    </button>
  );
}

function StatCard({
  title,
  value,
  icon,
  tone,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  tone: "slate" | "green" | "rose" | "amber" | "indigo";
}) {
  const bg =
    tone === "green"
      ? "from-emerald-50 to-white"
      : tone === "rose"
      ? "from-rose-50 to-white"
      : tone === "amber"
      ? "from-amber-50 to-white"
      : tone === "indigo"
      ? "from-indigo-50 to-white"
      : "from-slate-50 to-white";

  const ring =
    tone === "green"
      ? "ring-emerald-200/60"
      : tone === "rose"
      ? "ring-rose-200/60"
      : tone === "amber"
      ? "ring-amber-200/60"
      : tone === "indigo"
      ? "ring-indigo-200/60"
      : "ring-slate-200/70";

  return (
    <div className={cx("rounded-3xl bg-gradient-to-b p-4 shadow-sm ring-1", bg, ring)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-wide text-slate-600">{title}</div>
          <div className="mt-2 text-2xl font-black text-slate-900">{value}</div>
        </div>
        <div className="rounded-2xl bg-white p-2.5 ring-1 ring-slate-200 text-slate-800">{icon}</div>
      </div>
    </div>
  );
}

function MenuRowsSkeleton() {
  return (
    <div className="divide-y divide-slate-100 rounded-3xl ring-1 ring-slate-200 overflow-hidden">
      <div className="hidden md:grid grid-cols-[minmax(0,2fr)_1fr_1.1fr_0.8fr_auto] gap-4 bg-slate-50 px-5 py-3">
        {["ITEM", "CATEGORY", "PRICES", "TYPE", "ACTION"].map((t) => (
          <div key={t} className="text-xs font-black uppercase tracking-wide text-slate-600">
            {t}
          </div>
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="px-5 py-4">
          <div className="animate-pulse">
            <div className="h-4 w-1/3 rounded bg-slate-100" />
            <div className="mt-2 h-3 w-2/3 rounded bg-slate-100" />
            <div className="mt-3 h-9 w-40 rounded-2xl bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* --------------------------------- types --------------------------------- */

type CartItem = {
  menu: MenuItemRead;
  qty: number;
  size?: "small" | "medium" | "large";
  extra_cheese: boolean;
  extra_sauce: boolean;
  note: string;
  toppings: Array<{
    topping_id: number;
    name: string;
    price: number;
    quantity: number;
  }>;
};

function hasAnySize(menu: MenuItemRead) {
  return menu.price_small != null || menu.price_medium != null || menu.price_large != null;
}

function itemPrice(menu: MenuItemRead, size?: "small" | "medium" | "large") {
  const ps = menu.price_small ?? null;
  const pm = menu.price_medium ?? null;
  const pl = menu.price_large ?? null;

  if (size === "small" && ps != null) return ps;
  if (size === "medium" && pm != null) return pm;
  if (size === "large" && pl != null) return pl;

  if (pm != null) return pm;
  if (pl != null) return pl;
  if (ps != null) return ps;
  return 0;
}

function fromPrice(menu: MenuItemRead) {
  const vals = [menu.price_small, menu.price_medium, menu.price_large].filter(
    (x): x is number => typeof x === "number" && Number.isFinite(x)
  );
  if (vals.length === 0) return null;
  return Math.min(...vals);
}

function extrasPrice(item: CartItem) {
  return (item.extra_cheese ? 1 : 0) + (item.extra_sauce ? 0.5 : 0);
}

function toppingsPrice(item: CartItem) {
  return item.toppings.reduce((sum, topping) => sum + Number(topping.price || 0) * (topping.quantity || 1), 0);
}

function unitPrice(item: CartItem) {
  return itemPrice(item.menu, item.size) + extrasPrice(item) + toppingsPrice(item);
}

/* -------------------------------- component -------------------------------- */

export default function OrdersPanel() {
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [menu, setMenu] = useState<MenuItemRead[]>([]);
  const [availableToppings, setAvailableToppings] = useState<ToppingRead[]>([]);
  const [loadingToppings, setLoadingToppings] = useState(true);
  const [toppingsError, setToppingsError] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<number | null>(null);

  // order header fields
  const [orderType, setOrderType] = useState<POSOrderType>("DINE_IN");
  const [tableNo, setTableNo] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");

  // menu search + cart
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingMenu(true);
        setLoadingToppings(true);
        setErr(null);
        setToppingsError(null);
        const [itemsResult, toppingsResult] = await Promise.allSettled([
          listMenuItems({ only_active: true }),
          listToppings({ only_available: true }),
        ]);
        if (mounted) {
          if (itemsResult.status === "fulfilled") {
            setMenu(itemsResult.value);
          } else {
            setErr((itemsResult.reason as Error)?.message || "Failed to load menu");
          }

          if (toppingsResult.status === "fulfilled") {
            setAvailableToppings(toppingsResult.value);
          } else {
            setToppingsError((toppingsResult.reason as Error)?.message || "Failed to load toppings");
          }
        }
      } catch (e: any) {
        if (mounted) {
          setErr(e?.message || "Failed to load menu");
        }
      } finally {
        if (mounted) {
          setLoadingMenu(false);
          setLoadingToppings(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return menu;
    return menu.filter(
      (m) =>
        (m.name || "").toLowerCase().includes(s) ||
        (m.description || "").toLowerCase().includes(s) ||
        ((m as any).category_name || "").toLowerCase().includes(s)
    );
  }, [menu, q]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, ci) => sum + unitPrice(ci) * ci.qty, 0);
  }, [cart]);

  const totalItems = useMemo(() => cart.reduce((n, ci) => n + ci.qty, 0), [cart]);

  const tableRequired = orderType === "DINE_IN";
  const isTableValid = !tableRequired || !!tableNo.trim();

  function clearAll() {
    setErr(null);
    setSuccessId(null);
    setCart([]);
    setTableNo("");
    setCustomerName("");
    setCustomerPhone("");
    setSpecialInstructions("");
  }

  function addToCart(m: MenuItemRead) {
    setErr(null);
    setSuccessId(null);

    // POS-fast behavior: if same item auto, bump qty
    const idx = cart.findIndex((c) => c.menu.id === m.id && c.size == null);
    if (idx >= 0) {
      setCart((prev) => prev.map((c, i) => (i === idx ? { ...c, qty: c.qty + 1 } : c)));
      return;
    }

    let defaultSize: CartItem["size"] = undefined;
    if (m.price_medium != null) defaultSize = "medium";
    else if (m.price_large != null) defaultSize = "large";
    else if (m.price_small != null) defaultSize = "small";

    setCart((prev) => [
      ...prev,
      {
        menu: m,
        qty: 1,
        size: defaultSize,
        extra_cheese: false,
        extra_sauce: false,
        note: "",
        toppings: [],
      },
    ]);
  }

  function updateCart(idx: number, patch: Partial<CartItem>) {
    setCart((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  }

  function removeCart(idx: number) {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  }

  function toggleCartTopping(itemIdx: number, topping: ToppingRead) {
    setCart((prev) =>
      prev.map((item, idx) => {
        if (idx !== itemIdx) return item;
        const existing = item.toppings.find((t) => t.topping_id === topping.id);
        if (existing) {
          return {
            ...item,
            toppings: item.toppings.filter((t) => t.topping_id !== topping.id),
          };
        }
        return {
          ...item,
          toppings: [
            ...item.toppings,
            {
              topping_id: topping.id,
              name: topping.name,
              price: Number(topping.price || 0),
              quantity: 1,
            },
          ],
        };
      })
    );
  }

  function updateCartToppingQty(itemIdx: number, toppingId: number, quantity: number) {
    const nextQty = Math.max(1, Math.floor(quantity));
    setCart((prev) =>
      prev.map((item, idx) => {
        if (idx !== itemIdx) return item;
        return {
          ...item,
          toppings: item.toppings.map((t) =>
            t.topping_id === toppingId ? { ...t, quantity: nextQty } : t
          ),
        };
      })
    );
  }

  async function submitOrder() {
    setErr(null);
    setSuccessId(null);

    if (!isTableValid) {
      setErr("Table number is required for dine-in orders.");
      return;
    }
    if (cart.length === 0) {
      setErr("Add at least 1 item to place an order.");
      return;
    }

    const payload: POSOrderCreate = {
      order_type: orderType,
      table_no: orderType === "DINE_IN" ? tableNo.trim() : null,
      customer_name: customerName.trim() || null,
      customer_phone: customerPhone.trim() || null,
      special_instructions: specialInstructions.trim() || null,
      items: cart.map((ci) => ({
        menu_item_id: ci.menu.id,
        qty: ci.qty,
        size: ci.size,
        extra_cheese: ci.extra_cheese,
        extra_sauce: ci.extra_sauce,
        special_instructions: ci.note.trim() || null,
        toppings: ci.toppings.map((topping) => ({
          topping_id: topping.topping_id,
          quantity: topping.quantity,
        })),
      })),
    };

    try {
      setSubmitting(true);
      const created = await createPosOrder(payload);
      setSuccessId(created.id);
      clearAll();
    } catch (e: any) {
      setErr(e?.message || "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 ring-1 ring-slate-200">POS</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 ring-1 ring-slate-200">Orders</span>
              <Pill tone="indigo">Employee Panel</Pill>
              <Pill tone="amber">Dine-in / Takeaway</Pill>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-3xl bg-white p-3 ring-1 ring-slate-200 shadow-sm">
                <Icon name="receipt" className="h-7 w-7 text-slate-900" />
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900">Create Order</div>
                <div className="mt-1 text-sm font-semibold text-slate-600">
                  Select type → add items → review → place.
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <GhostButton onClick={() => window.location.reload()} disabled={loadingMenu}>
              <Icon name="refresh" className={cx("h-5 w-5", loadingMenu && "animate-spin")} />
              Refresh
            </GhostButton>

            <GhostButton onClick={clearAll} disabled={submitting}>
              <Icon name="trash" className="h-5 w-5" />
              Clear
            </GhostButton>

            <PrimaryButton
              onClick={submitOrder}
              disabled={submitting || cart.length === 0 || !isTableValid}
              tone="indigo"
            >
              <Icon name="check" className={cx("h-5 w-5", submitting && "opacity-80")} />
              {submitting ? "Placing..." : "Place Order"}
            </PrimaryButton>
          </div>
        </div>

        {/* Alerts */}
        {(err || successId) && (
          <div className="mt-5 space-y-2">
            {err ? (
              <div className="rounded-3xl bg-rose-50 p-4 ring-1 ring-rose-200">
                <div className="text-sm font-black text-rose-800">Fix this</div>
                <div className="mt-1 text-sm font-semibold text-rose-700">{err}</div>
              </div>
            ) : null}

            {successId ? (
              <div className="rounded-3xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
                <div className="flex items-center gap-2 text-sm font-black text-emerald-800">
                  <Icon name="check" className="h-5 w-5" />
                  Order placed successfully
                </div>
                <div className="mt-1 text-sm font-semibold text-emerald-700">
                  Order ID: <span className="font-black">#{successId}</span>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Order Type"
            value={orderType === "DINE_IN" ? "Dine-in" : "Takeaway"}
            tone={orderType === "DINE_IN" ? "green" : "amber"}
            icon={
              orderType === "DINE_IN" ? (
                <Icon name="table" className="h-6 w-6 text-emerald-700" />
              ) : (
                <Icon name="takeaway" className="h-6 w-6 text-amber-700" />
              )
            }
          />
          <StatCard title="Items" value={String(totalItems)} tone="indigo" icon={<Icon name="cart" className="h-6 w-6 text-indigo-700" />} />
          <StatCard title="Subtotal" value={money(subtotal)} tone="slate" icon={<Icon name="receipt" className="h-6 w-6" />} />
          <StatCard title="Menu Found" value={loadingMenu ? "…" : String(filtered.length)} tone="amber" icon={<Icon name="pizza" className="h-6 w-6 text-amber-700" />} />
        </div>

        {/* Layout: row 1 (Order Details + Cart), row 2 (Menu full width) */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Order Details */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-black text-slate-900">Order Details</div>
                    <div className="mt-1 text-xs font-semibold text-slate-600">Choose type + add customer info (optional).</div>
                  </div>

                  <div className="flex items-center gap-2 rounded-2xl bg-white p-1 ring-1 ring-slate-200">
                    <button
                      onClick={() => setOrderType("DINE_IN")}
                      className={cx(
                        "rounded-xl px-3 py-2 text-sm font-extrabold transition",
                        orderType === "DINE_IN" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      Dine-in
                    </button>
                    <button
                      onClick={() => setOrderType("TAKEAWAY")}
                      className={cx(
                        "rounded-xl px-3 py-2 text-sm font-extrabold transition",
                        orderType === "TAKEAWAY" ? "bg-amber-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      Takeaway
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-5 py-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="block">
                    <div className="text-xs font-black text-slate-700">
                      Table No {tableRequired ? <span className="text-rose-600">*</span> : null}
                    </div>
                    <input
                      value={tableNo}
                      onChange={(e) => setTableNo(e.target.value)}
                      disabled={!tableRequired}
                      placeholder={tableRequired ? "e.g. T12" : "Not required for takeaway"}
                      className={cx(
                        "mt-1 w-full rounded-2xl border bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none",
                        "focus:ring-2 focus:ring-slate-300",
                        tableRequired && !isTableValid ? " ring-rose-100" : "border-slate-200",
                        !tableRequired && "bg-slate-50 text-slate-500"
                      )}
                    />
                    {tableRequired && !isTableValid ? (
                      <div className="mt-1 text-xs font-semibold text-rose-700">Table number is required for dine-in.</div>
                    ) : null}
                  </label>

                  <label className="block">
                    <div className="text-xs font-black text-slate-700">Customer Phone (optional)</div>
                    <input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 555-123-4567"
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-300"
                    />
                  </label>

                  <label className="block">
                    <div className="text-xs font-black text-slate-700">Customer Name (optional)</div>
                    <input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Optional"
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-300"
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <div className="text-xs font-black text-slate-700">Order Notes (optional)</div>
                    <textarea
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      rows={2}
                      placeholder="Allergy note, cut in slices, extra napkins…"
                      className="mt-1 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-300"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Cart */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-6 space-y-4">
              <div className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-black text-slate-900">Cart</div>
                      <div className="mt-1 text-xs font-semibold text-slate-600">Review items, adjust qty, then place order.</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-slate-600">Subtotal</div>
                      <div className="text-2xl font-black text-slate-900">{money(subtotal)}</div>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-5">
                  {cart.length === 0 ? (
                    <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
                      <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                        <Icon name="cart" className="h-5 w-5" />
                        Cart is empty
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-600">Use search and tap “Add” to start.</div>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[54vh] overflow-auto pr-1">
                      {cart.map((ci, idx) => {
                        const price = unitPrice(ci);
                        const line = price * ci.qty;
                        const img = safeUrl((ci.menu as any).image_url || "");

                        return (
                          <div key={`${ci.menu.id}-${idx}`} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start gap-3">
                              <div className="h-12 w-12 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
                                {img ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={img} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-slate-500">
                                    <Icon name="pizza" className="h-6 w-6" />
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="truncate text-sm font-black text-slate-900">{ci.menu.name}</div>
                                    <div className="mt-1 text-xs font-semibold text-slate-600">
                                      Unit: <span className="font-black text-slate-900">{money(price)}</span> • Line:{" "}
                                      <span className="font-black text-slate-900">{money(line)}</span>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => removeCart(idx)}
                                    className="rounded-2xl bg-rose-600 px-3 py-2 text-xs font-black text-white shadow-sm ring-1 ring-black/5 hover:bg-rose-700 active:scale-[0.98]"
                                    aria-label="Remove item"
                                  >
                                    <Icon name="trash" className="h-4 w-4" />
                                  </button>
                                </div>

                                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                  <div>
                                    <div className="text-xs font-black text-slate-700">Qty</div>
                                    <div className="mt-1 flex items-center overflow-hidden rounded-2xl border border-slate-200">
                                      <button
                                        onClick={() => updateCart(idx, { qty: Math.max(1, ci.qty - 1) })}
                                        className="px-3 py-2 text-slate-700 hover:bg-slate-50"
                                      >
                                        <Icon name="minus" className="h-5 w-5" />
                                      </button>
                                      <div className="flex-1 border-x border-slate-200 px-3 py-2 text-center text-sm font-black text-slate-900">
                                        {ci.qty}
                                      </div>
                                      <button
                                        onClick={() => updateCart(idx, { qty: ci.qty + 1 })}
                                        className="px-3 py-2 text-slate-700 hover:bg-slate-50"
                                      >
                                        <Icon name="plus" className="h-5 w-5" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className={cx(!hasAnySize(ci.menu) && "opacity-60")}>
                                    <div className="text-xs font-black text-slate-700">Size</div>
                                    <select
                                      value={ci.size || ""}
                                      onChange={(e) => updateCart(idx, { size: (e.target.value || undefined) as any })}
                                      disabled={!hasAnySize(ci.menu)}
                                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-300 disabled:bg-slate-50"
                                    >
                                      <option value="">Auto</option>
                                      <option value="small">Small</option>
                                      <option value="medium">Medium</option>
                                      <option value="large">Large</option>
                                    </select>
                                  </div>

                                  <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                                    <span className="font-bold text-slate-800">Extra cheese</span>
                                    <input
                                      type="checkbox"
                                      checked={ci.extra_cheese}
                                      onChange={(e) => updateCart(idx, { extra_cheese: e.target.checked })}
                                      className="h-4 w-4 rounded border-slate-300"
                                    />
                                  </label>

                                  <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                                    <span className="font-bold text-slate-800">Extra sauce</span>
                                    <input
                                      type="checkbox"
                                      checked={ci.extra_sauce}
                                      onChange={(e) => updateCart(idx, { extra_sauce: e.target.checked })}
                                      className="h-4 w-4 rounded border-slate-300"
                                    />
                                  </label>

                                  <div className="md:col-span-2">
                                    <div className="text-xs font-black text-slate-700">Toppings</div>
                                    {loadingToppings ? (
                                      <div className="mt-1 text-xs font-semibold text-slate-500">Loading toppings...</div>
                                    ) : toppingsError ? (
                                      <div className="mt-1 text-xs font-semibold text-rose-600">{toppingsError}</div>
                                    ) : availableToppings.length === 0 ? (
                                      <div className="mt-1 text-xs font-semibold text-slate-500">No toppings available.</div>
                                    ) : (
                                      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        {availableToppings.map((topping) => {
                                          const selected = ci.toppings.find((t) => t.topping_id === topping.id);
                                          return (
                                            <div key={topping.id} className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                                              <label className="flex items-center justify-between gap-2">
                                                <span className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                                                  <input
                                                    type="checkbox"
                                                    checked={!!selected}
                                                    onChange={() => toggleCartTopping(idx, topping)}
                                                    className="h-4 w-4 rounded border-slate-300"
                                                  />
                                                  <span>{topping.name}</span>
                                                </span>
                                                <span className="text-xs font-black text-slate-700">
                                                  +{money(Number(topping.price || 0))}
                                                </span>
                                              </label>

                                              {selected ? (
                                                <div className="mt-2 flex items-center gap-2">
                                                  <button
                                                    onClick={() =>
                                                      updateCartToppingQty(idx, topping.id, Math.max(1, selected.quantity - 1))
                                                    }
                                                    className="rounded-md border border-slate-300 px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
                                                    type="button"
                                                  >
                                                    -
                                                  </button>
                                                  <span className="min-w-5 text-center text-xs font-black text-slate-900">
                                                    {selected.quantity}
                                                  </span>
                                                  <button
                                                    onClick={() => updateCartToppingQty(idx, topping.id, selected.quantity + 1)}
                                                    className="rounded-md border border-slate-300 px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
                                                    type="button"
                                                  >
                                                    +
                                                  </button>
                                                </div>
                                              ) : null}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>

                                  <div className="md:col-span-2">
                                    <div className="text-xs font-black text-slate-700">Item Note</div>
                                    <input
                                      value={ci.note}
                                      onChange={(e) => updateCart(idx, { note: e.target.value })}
                                      placeholder="Optional (no onions, cut in 8 slices...)"
                                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-300"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-3xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                      <div className="flex items-center gap-2">
                        <Pill tone={orderType === "DINE_IN" ? "green" : "amber"}>
                          {orderType === "DINE_IN" ? "Dine-in" : "Takeaway"}
                        </Pill>
                        {orderType === "DINE_IN" ? (
                          <Pill tone={isTableValid ? "indigo" : "rose"}>
                            Table: {isTableValid ? tableNo.trim() : "Required"}
                          </Pill>
                        ) : (
                          <Pill tone="slate">No table</Pill>
                        )}
                      </div>

                      <div className="text-sm font-black text-slate-900">
                        Items: <span className="text-indigo-700">{totalItems}</span> • Subtotal:{" "}
                        <span className="text-slate-900">{money(subtotal)}</span>
                      </div>
                    </div>

                    <PrimaryButton
                      onClick={submitOrder}
                      disabled={submitting || cart.length === 0 || !isTableValid}
                      tone={orderType === "DINE_IN" ? "green" : "amber"}
                      className="w-full"
                    >
                      <Icon name="check" className={cx("h-5 w-5", submitting && "opacity-80")} />
                      {submitting ? "Placing order…" : "Place Order"}
                    </PrimaryButton>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Menu full width (uses the empty space under cart) */}
          <div className="lg:col-span-12">
            <div className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-black text-slate-900">Menu</div>
                    <div className="mt-1 text-xs font-semibold text-slate-600">
                      Clear pricing view. Tap “Add” to push into cart.
                    </div>
                  </div>

                  <div className="w-full sm:max-w-lg">
                    <div className="relative">
                      <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Icon name="search" className="h-5 w-5" />
                      </div>
                      <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search by name, category, or description…"
                        className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-300"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 py-5">
                {loadingMenu ? (
                  <MenuRowsSkeleton />
                ) : filtered.length === 0 ? (
                  <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="text-sm font-black text-slate-900">No items found</div>
                    <div className="mt-1 text-sm font-semibold text-slate-600">Try changing search keywords.</div>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-3xl ring-1 ring-slate-200">
                    {/* Desktop header */}
                    <div className="hidden md:grid grid-cols-[minmax(0,2fr)_1fr_1.1fr_0.8fr_auto] gap-4 bg-slate-50 px-5 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-600">
                      <div>Item</div>
                      <div>Category</div>
                      <div>Prices</div>
                      <div>Type</div>
                      <div className="text-right">Action</div>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {filtered.map((m) => {
                        const img = safeUrl((m as any).image_url || "");
                        const cat = (m as any).category_name || (m as any).category || m.category_id || "—";
                        const hasSizes = hasAnySize(m);
                        const from = fromPrice(m);
                        const typeLabel = (m as any).is_deal ? "Deal" : "Pizza";

                        return (
                          <div key={m.id} className="px-5 py-4 hover:bg-slate-50/60">
                            {/* Desktop row */}
                            <div className="hidden md:grid grid-cols-[minmax(0,2fr)_1fr_1.1fr_0.8fr_auto] gap-4 items-center">
                              {/* Item */}
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-12 w-12 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200 shrink-0">
                                  {img ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={img} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-slate-500">
                                      <Icon name="pizza" className="h-6 w-6" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-black text-slate-900">{m.name}</div>
                                  <div className="mt-1 line-clamp-1 text-xs font-semibold text-slate-600">
                                    {m.description || "—"}
                                  </div>
                                </div>
                              </div>

                              {/* Category */}
                              <div className="text-sm font-bold text-slate-800">{String(cat)}</div>

                              {/* Prices */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200">
                                  S: {money(m.price_small)}
                                </span>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200">
                                  M: {money(m.price_medium)}
                                </span>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200">
                                  L: {money(m.price_large)}
                                </span>
                              </div>

                              {/* Type */}
                              <div className="flex flex-col gap-2">
                                <Pill tone="slate">{hasSizes ? "Size options" : "Single price"}</Pill>
                                <Pill tone="amber">From {from != null ? money(from) : "—"}</Pill>
                              </div>

                              {/* Action */}
                              <div className="flex justify-end">
                                <PrimaryButton onClick={() => addToCart(m)} tone="indigo" className="px-4 py-2 text-xs">
                                  <Icon name="plus" className="h-4 w-4" />
                                  Add
                                </PrimaryButton>
                              </div>
                            </div>

                            {/* Mobile row (no horizontal scroll) */}
                            <div className="md:hidden">
                              <div className="flex items-start gap-3">
                                <div className="h-12 w-12 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200 shrink-0">
                                  {img ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={img} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-slate-500">
                                      <Icon name="pizza" className="h-6 w-6" />
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-black text-slate-900 truncate">{m.name}</div>
                                  <div className="mt-1 text-xs font-semibold text-slate-600 line-clamp-2">
                                    {m.description || "—"}
                                  </div>

                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <Pill tone="indigo">{String(cat)}</Pill>
                                    <Pill tone="slate">{typeLabel}</Pill>
                                    <Pill tone="slate">{hasSizes ? "Size options" : "Single price"}</Pill>
                                    <Pill tone="amber">From {from != null ? money(from) : "—"}</Pill>
                                  </div>

                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200">
                                      S: {money(m.price_small)}
                                    </span>
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200">
                                      M: {money(m.price_medium)}
                                    </span>
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200">
                                      L: {money(m.price_large)}
                                    </span>
                                  </div>

                                  <div className="mt-3">
                                    <PrimaryButton onClick={() => addToCart(m)} tone="indigo" className="w-full">
                                      <Icon name="plus" className="h-5 w-5" />
                                      Add to cart
                                    </PrimaryButton>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
