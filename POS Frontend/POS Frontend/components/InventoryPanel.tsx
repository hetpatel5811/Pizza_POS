// components/InventoryPanel.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  adjustInventoryStock,
  createInventoryItem,
  deleteInventoryItem,
  listInventory,
  updateInventoryItem,
  type InventoryItemRead,
} from "@/lib/api/inventory";

/* ----------------------------- small utilities ---------------------------- */
function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function toNum(s: string | number | null | undefined) {
  if (s === null || s === undefined) return 0;
  if (typeof s === "number") return s;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function fmtUpdatedAt(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

/* Full-width shell (same as EmployeePanel) */
const SHELL = "mx-auto w-full px-3 sm:px-6 lg:px-10 2xl:px-14";

type Mode = "create" | "edit" | "adjust" | null;

/* -------------------------------- icons ---------------------------------- */
function Icon({
  name,
  className = "h-5 w-5",
}: {
  name:
    | "refresh"
    | "search"
    | "plus"
    | "edit"
    | "trash"
    | "adjust"
    | "x"
    | "box"
    | "spark";
  className?: string;
}) {
  const common = {
    className,
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 2,
    stroke: "currentColor" as const,
  };

  switch (name) {
    case "refresh":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12a8 8 0 1 1-2.343-5.657" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 4v6h-6" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 18.5a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 16.5 21 21" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
        </svg>
      );
    case "edit":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 20h4l10.5-10.5a2 2 0 0 0 0-3L16.5 4a2 2 0 0 0-3 0L3 14.5V20Z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5 17.5 10.5" />
        </svg>
      );
    case "trash":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v7" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 11v7" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 7l1 14h10l1-14" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 7V4h6v3" />
        </svg>
      );
    case "adjust":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h10" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 17h10" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 4v16" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 12h8" />
        </svg>
      );
    case "x":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18" />
        </svg>
      );
    case "box":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8l8-4 8 4-8 4-8-4Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8v8l8 4 8-4V8" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v8" />
        </svg>
      );
    case "spark":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 2l1.2 5.2L18 8.5l-4.8 1.3L12 15l-1.2-5.2L6 8.5l4.8-1.3L12 2z"
          />
        </svg>
      );
  }
}

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={cx("animate-spin", className)} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-75"
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ------------------------------ UI blocks -------------------------------- */
function GlassPanel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cx(
        "rounded-3xl bg-white/65 backdrop-blur-xl ring-1 ring-white/40",
        "shadow-[0_22px_70px_-45px_rgba(0,0,0,0.35)]",
        className
      )}
    >
      {children}
    </div>
  );
}

function StatusPill({ tone, label }: { tone: "ok" | "low" | "out"; label: string }) {
  const meta =
    tone === "ok"
      ? { cls: "bg-emerald-500/15 text-emerald-950 ring-emerald-500/25", dot: "bg-emerald-500" }
      : tone === "low"
      ? { cls: "bg-amber-500/15 text-amber-950 ring-amber-500/25", dot: "bg-amber-500" }
      : { cls: "bg-rose-500/15 text-rose-950 ring-rose-500/25", dot: "bg-rose-500" };

  return (
    <div className={cx("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold ring-1", meta.cls)}>
      <span className={cx("h-2 w-2 rounded-full", meta.dot)} />
      {label}
    </div>
  );
}

function Input({ className, ...props }: any) {
  return (
    <input
      {...props}
      className={cx(
        "w-full rounded-2xl bg-white/70 ring-1 ring-white/50 px-4 py-3 text-sm font-semibold text-slate-900",
        "placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-400/35",
        className
      )}
    />
  );
}

function GradientButton({
  children,
  onClick,
  disabled,
  loading,
  icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cx(
        "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-extrabold text-white shadow-sm",
        "bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-rose-600 hover:brightness-[1.03]",
        "focus:outline-none focus:ring-2 focus:ring-slate-400/40 focus:ring-offset-2",
        (disabled || loading) && "opacity-60 cursor-not-allowed"
      )}
    >
      {loading ? <Spinner className="h-4 w-4" /> : icon}
      {children}
    </button>
  );
}

function SoftButton({
  children,
  onClick,
  disabled,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "inline-flex items-center gap-2 rounded-2xl bg-white/70 px-4 py-2.5 text-sm font-extrabold text-slate-900",
        "ring-1 ring-white/55 hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-slate-400/35",
        disabled && "opacity-60 cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-3">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl p-[1px] bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-rose-600 shadow-2xl">
        <div className="rounded-3xl bg-white/80 backdrop-blur-xl ring-1 ring-white/40">
          <div className="flex items-center justify-between border-b border-white/40 px-5 py-4">
            <div className="text-base font-extrabold text-slate-900">{title}</div>
            <button onClick={onClose} className="rounded-2xl p-2 hover:bg-white/70">
              <Icon name="x" className="h-5 w-5 text-slate-700" />
            </button>
          </div>
          <div className="px-5 py-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- page ---------------------------------- */
export default function InventoryPanel() {
  const [items, setItems] = useState<InventoryItemRead[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [search, setSearch] = useState("");

  const [mode, setMode] = useState<Mode>(null);
  const [active, setActive] = useState<InventoryItemRead | null>(null);

  // Create/Edit form state
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [menuItemId, setMenuItemId] = useState("");
  const [qty, setQty] = useState("0");
  const [threshold, setThreshold] = useState("0");
  const [outOfStock, setOutOfStock] = useState(false);

  // Adjust form state
  const [changeQty, setChangeQty] = useState("0");
  const [reason, setReason] = useState("");

  async function refresh() {
    setErr(null);
    setLoading(true);
    try {
      const data = await listInventory({ lowStockOnly });
      setItems(data);
    } catch (e: any) {
      setErr(e?.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lowStockOnly]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => {
      const a = (i.name || "").toLowerCase();
      const b = (i.sku || "").toLowerCase();
      return a.includes(q) || b.includes(q);
    });
  }, [items, search]);

  const stats = useMemo(() => {
    let low = 0;
    let out = 0;
    let qtySum = 0;

    for (const i of items) {
      const q = toNum(i.current_qty);
      const t = toNum(i.low_stock_threshold);
      qtySum += q;
      if (i.is_out_of_stock) out++;
      else if (q <= t) low++;
    }
    return { total: items.length, low, out, qtySum };
  }, [items]);

  function openCreate() {
    setMode("create");
    setActive(null);
    setSku("");
    setName("");
    setMenuItemId("");
    setQty("0");
    setThreshold("0");
    setOutOfStock(false);
    setErr(null);
  }

  function openEdit(item: InventoryItemRead) {
    setMode("edit");
    setActive(item);
    setSku(item.sku || "");
    setName(item.name || "");
    setMenuItemId(item.menu_item_id ? String(item.menu_item_id) : "");
    setQty(String(toNum(item.current_qty)));
    setThreshold(String(toNum(item.low_stock_threshold)));
    setOutOfStock(!!item.is_out_of_stock);
    setErr(null);
  }

  function openAdjust(item: InventoryItemRead) {
    setMode("adjust");
    setActive(item);
    setChangeQty("0");
    setReason("");
    setErr(null);
  }

  function closeModal() {
    setMode(null);
    setActive(null);
    setErr(null);
  }

  async function onSubmitCreate() {
    setErr(null);

    const cleanName = name.trim();
    if (!cleanName) return setErr("Name is required");

    const payload = {
      sku: sku.trim() ? sku.trim() : null,
      name: cleanName,
      menu_item_id: menuItemId.trim() ? Number(menuItemId) : null,
      current_qty: Number(qty),
      low_stock_threshold: Number(threshold),
      is_out_of_stock: outOfStock,
    };

    if (!Number.isFinite(payload.current_qty) || payload.current_qty < 0) return setErr("Qty must be >= 0");
    if (!Number.isFinite(payload.low_stock_threshold) || payload.low_stock_threshold < 0)
      return setErr("Low stock threshold must be >= 0");

    setLoading(true);
    try {
      await createInventoryItem(payload);
      closeModal();
      await refresh();
    } catch (e: any) {
      setErr(e?.message || "Create failed");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmitEdit() {
    if (!active) return;

    setErr(null);

    const payload: any = {
      sku: sku.trim() ? sku.trim() : null,
      name: name.trim() ? name.trim() : undefined,
      menu_item_id: menuItemId.trim() ? Number(menuItemId) : undefined,
      current_qty: Number(qty),
      low_stock_threshold: Number(threshold),
      is_out_of_stock: outOfStock,
    };

    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    if (payload.current_qty !== undefined && (!Number.isFinite(payload.current_qty) || payload.current_qty < 0))
      return setErr("Qty must be >= 0");
    if (
      payload.low_stock_threshold !== undefined &&
      (!Number.isFinite(payload.low_stock_threshold) || payload.low_stock_threshold < 0)
    )
      return setErr("Low stock threshold must be >= 0");

    setLoading(true);
    try {
      await updateInventoryItem(active.id, payload);
      closeModal();
      await refresh();
    } catch (e: any) {
      setErr(e?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmitAdjust() {
    if (!active) return;
    setErr(null);

    const delta = Number(changeQty);
    if (!Number.isFinite(delta) || delta === 0) return setErr("Change qty must be a non-zero number");
    const cleanReason = reason.trim();
    if (!cleanReason) return setErr("Reason is required");

    setLoading(true);
    try {
      await adjustInventoryStock(active.id, { change_qty: delta, reason: cleanReason });
      closeModal();
      await refresh();
    } catch (e: any) {
      setErr(e?.message || "Adjust failed");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(item: InventoryItemRead) {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;

    setLoading(true);
    setErr(null);
    try {
      await deleteInventoryItem(item.id);
      await refresh();
    } catch (e: any) {
      setErr(e?.message || "Delete failed (ensure backend DELETE exists)");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[radial-gradient(1200px_circle_at_20%_0%,rgba(99,102,241,0.20),transparent_55%),radial-gradient(900px_circle_at_80%_10%,rgba(236,72,153,0.18),transparent_50%),radial-gradient(900px_circle_at_60%_100%,rgba(16,185,129,0.16),transparent_55%)]">
      {/* subtle pattern overlay */}
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.22] [background-image:linear-gradient(to_right,rgba(15,23,42,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.08)_1px,transparent_1px)] [background-size:40px_40px]" />

      {/* Top bar */}
      <header className="sticky top-0 z-50">
        <div className="border-b border-white/40 bg-white/55 backdrop-blur-xl">
          <div className={cx(SHELL, "py-4")}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-rose-600 text-white shadow-sm">
                      <Icon name="box" className="h-5 w-5" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Inventory</h1>
                  </div>

                  <div className="hidden sm:flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-white/50">
                    Total: <span className="font-extrabold text-slate-900">{stats.total}</span>
                    <span className="text-slate-300">•</span>
                    Low: <span className="font-extrabold text-slate-900">{stats.low}</span>
                    <span className="text-slate-300">•</span>
                    Out: <span className="font-extrabold text-slate-900">{stats.out}</span>
                  </div>
                </div>

                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative w-full sm:w-[420px]">
                      <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        <Icon name="search" className="h-4 w-4" />
                      </div>
                      <Input
                        value={search}
                        onChange={(e: any) => setSearch(e.target.value)}
                        placeholder="Search by name or SKU…"
                        className="pl-11"
                      />
                    </div>

                    <label className="inline-flex items-center gap-2 rounded-2xl bg-white/70 px-4 py-3 text-sm font-bold text-slate-800 ring-1 ring-white/50">
                      <input
                        type="checkbox"
                        checked={lowStockOnly}
                        onChange={(e) => setLowStockOnly(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      Low stock only
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <GradientButton
                      onClick={() => refresh().catch(() => {})}
                      loading={loading}
                      icon={<Icon name="refresh" className="h-4 w-4" />}
                    >
                      Refresh
                    </GradientButton>

                    <SoftButton onClick={openCreate} className="font-extrabold">
                      <Icon name="plus" className="h-4 w-4" />
                      Add Item
                    </SoftButton>
                  </div>
                </div>
              </div>
            </div>

            {err ? (
              <div className="mt-4 rounded-2xl border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-sm font-semibold text-rose-900">
                {err}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className={cx(SHELL, "py-8")}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Stats cards */}
          <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <GlassPanel className="p-5">
              <div className="text-xs font-semibold text-slate-500">Total items</div>
              <div className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">{stats.total}</div>
              <div className="mt-2 text-sm text-slate-600">All items tracked in inventory.</div>
            </GlassPanel>

            <GlassPanel className="p-5">
              <div className="text-xs font-semibold text-slate-500">Low stock</div>
              <div className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">{stats.low}</div>
              <div className="mt-2 text-sm text-slate-600">Qty is at/below threshold.</div>
            </GlassPanel>

            <GlassPanel className="p-5">
              <div className="text-xs font-semibold text-slate-500">Out of stock</div>
              <div className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">{stats.out}</div>
              <div className="mt-2 text-sm text-slate-600">Marked unavailable for sale.</div>
            </GlassPanel>

            <GlassPanel className="p-5">
              <div className="text-xs font-semibold text-slate-500">Total quantity</div>
              <div className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">{stats.qtySum}</div>
              <div className="mt-2 text-sm text-slate-600">Sum of current stock qty.</div>
            </GlassPanel>
          </div>

          {/* Table */}
          <div className="lg:col-span-12">
            <GlassPanel className="p-0 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/40">
                <div className="text-sm font-extrabold text-slate-900">
                  {loading ? "Loading…" : `${filtered.length} item(s)`}
                </div>
                <div className="text-xs font-semibold text-slate-600">
                  Tip: Use “Low stock only” to focus restock items.
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full text-left text-sm">
                  <thead className="bg-white/55 text-slate-700">
                    <tr className="[&>th]:px-6 [&>th]:py-4 [&>th]:font-extrabold">
                      <th>Name</th>
                      <th>SKU</th>
                      <th>Qty</th>
                      <th>Low Stock</th>
                      <th>Status</th>
                      <th>Updated</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/35">
                    {filtered.map((i) => {
                      const qtyN = toNum(i.current_qty);
                      const thrN = toNum(i.low_stock_threshold);
                      const low = !i.is_out_of_stock && qtyN <= thrN;

                      const tone = i.is_out_of_stock ? "out" : low ? "low" : "ok";

                      return (
                        <tr key={i.id} className="hover:bg-white/45 transition">
                          <td className="px-6 py-4">
                            <div className="font-extrabold text-slate-900">{i.name}</div>
                            <div className="mt-1 text-xs font-semibold text-slate-600">
                              menu_item_id: <span className="text-slate-900">{i.menu_item_id ?? "—"}</span>
                            </div>
                          </td>

                          <td className="px-6 py-4 font-semibold text-slate-800">{i.sku || "—"}</td>

                          <td className="px-6 py-4">
                            <div className={cx("font-extrabold", low ? "text-amber-950" : "text-slate-900")}>
                              {i.current_qty}
                            </div>
                            <div className="text-xs font-semibold text-slate-500">threshold: {i.low_stock_threshold}</div>
                          </td>

                          <td className="px-6 py-4 font-semibold text-slate-800">{i.low_stock_threshold}</td>

                          <td className="px-6 py-4">
                            <StatusPill
                              tone={tone as any}
                              label={i.is_out_of_stock ? "Out of stock" : low ? "Low stock" : "OK"}
                            />
                          </td>

                          <td className="px-6 py-4 text-slate-700 font-semibold">{fmtUpdatedAt(i.updated_at)}</td>

                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <SoftButton onClick={() => openAdjust(i)} className="px-3 py-2 text-xs rounded-2xl">
                                <Icon name="adjust" className="h-4 w-4" />
                                Adjust
                              </SoftButton>
                              <SoftButton onClick={() => openEdit(i)} className="px-3 py-2 text-xs rounded-2xl">
                                <Icon name="edit" className="h-4 w-4" />
                                Edit
                              </SoftButton>
                              <SoftButton
                                onClick={() => onDelete(i)}
                                className="px-3 py-2 text-xs rounded-2xl text-rose-700"
                              >
                                <Icon name="trash" className="h-4 w-4" />
                                Delete
                              </SoftButton>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {!loading && filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-16 text-center">
                          <div className="text-lg font-extrabold text-slate-900">No inventory items found</div>
                          <div className="mt-2 text-sm text-slate-600">Try clearing search or add your first item.</div>
                          <div className="mt-4 flex justify-center">
                            <GradientButton onClick={openCreate} icon={<Icon name="plus" className="h-4 w-4" />}>
                              Add Item
                            </GradientButton>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </GlassPanel>
          </div>
        </div>
      </main>

      {/* Modal */}
      {mode ? (
        <Modal
          title={mode === "create" ? "Add Item" : mode === "edit" ? "Edit Item" : "Adjust Stock"}
          onClose={closeModal}
        >
          {err ? (
            <div className="mb-4 rounded-2xl border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-sm font-semibold text-rose-900">
              {err}
            </div>
          ) : null}

          {mode === "adjust" ? (
            <div className="space-y-4">
              <GlassPanel className="p-4">
                <div className="text-sm font-semibold text-slate-700">
                  Item: <span className="font-extrabold text-slate-900">{active?.name}</span>
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-600">
                  Current qty: <span className="text-slate-900">{active?.current_qty}</span>
                </div>
              </GlassPanel>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-extrabold text-slate-900 mb-2">Change Qty (+/-)</div>
                  <Input
                    value={changeQty}
                    onChange={(e: any) => setChangeQty(e.target.value)}
                    type="number"
                    step="0.01"
                    placeholder="e.g., 5 or -2"
                  />
                </div>

                <div>
                  <div className="text-sm font-extrabold text-slate-900 mb-2">Reason</div>
                  <Input
                    value={reason}
                    onChange={(e: any) => setReason(e.target.value)}
                    placeholder="Received shipment, Waste, Correction…"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <SoftButton onClick={closeModal}>Cancel</SoftButton>
                <GradientButton onClick={onSubmitAdjust} loading={loading} icon={<Icon name="spark" className="h-4 w-4" />}>
                  Apply
                </GradientButton>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-extrabold text-slate-900 mb-2">Name *</div>
                  <Input value={name} onChange={(e: any) => setName(e.target.value)} placeholder="Mozzarella Cheese" />
                </div>

                <div>
                  <div className="text-sm font-extrabold text-slate-900 mb-2">SKU</div>
                  <Input value={sku} onChange={(e: any) => setSku(e.target.value)} placeholder="Optional" />
                </div>

                <div>
                  <div className="text-sm font-extrabold text-slate-900 mb-2">menu_item_id</div>
                  <Input value={menuItemId} onChange={(e: any) => setMenuItemId(e.target.value)} type="number" />
                </div>

                <div>
                  <div className="text-sm font-extrabold text-slate-900 mb-2">Qty</div>
                  <Input value={qty} onChange={(e: any) => setQty(e.target.value)} type="number" step="0.01" />
                </div>

                <div>
                  <div className="text-sm font-extrabold text-slate-900 mb-2">Low Stock Threshold</div>
                  <Input value={threshold} onChange={(e: any) => setThreshold(e.target.value)} type="number" step="0.01" />
                </div>

                <label className="inline-flex items-center gap-2 rounded-2xl bg-white/70 px-4 py-3 text-sm font-bold text-slate-800 ring-1 ring-white/50">
                  <input
                    type="checkbox"
                    checked={outOfStock}
                    onChange={(e) => setOutOfStock(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Mark as out of stock
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <SoftButton onClick={closeModal}>Cancel</SoftButton>
                <GradientButton
                  onClick={mode === "create" ? onSubmitCreate : onSubmitEdit}
                  loading={loading}
                  icon={<Icon name="spark" className="h-4 w-4" />}
                >
                  {mode === "create" ? "Create" : "Save Changes"}
                </GradientButton>
              </div>

              <div className="pt-2 text-xs font-semibold text-slate-600">
                If “Edit” fails with validation, update your backend InventoryItemUpdate schema to allow
                sku/name/menu_item_id (if your schema only supports qty/threshold/out_of_stock).
              </div>
            </div>
          )}
        </Modal>
      ) : null}
    </div>
  );
}
