"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  createDeal,
  createMenuItem,
  listCategories,
  listDeals,
  listMenuItems,
  updateMenuItem,
  type CategoryRead,
  type MenuItemCreate,
  type MenuItemRead,
} from "@/lib/api/menu";

import {
  createInventoryItem,
  listInventory,
  updateInventoryItem,
  type InventoryItemRead,
} from "@/lib/api/inventory";
import MenuCustomizationManagement from "@/components/MenuCustomizationManagement";

/* --------------------------------- utils --------------------------------- */

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatPrice(v: number | null | undefined) {
  if (v === null || v === undefined) return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(2);
}

function safeUrl(url: string) {
  const u = (url || "").trim();
  if (!u) return "";
  // basic safety (prevents weird JS: etc). You can tighten if you want.
  if (!/^https?:\/\//i.test(u)) return u;
  return u;
}

/* ----------------------------- small components ---------------------------- */

function Icon({
  name,
  className,
}: {
  name:
    | "pizza"
    | "deal"
    | "refresh"
    | "search"
    | "plus"
    | "arrow"
    | "edit"
    | "toggle"
    | "inventory"
    | "close"
    | "active"
    | "inactive";
  className?: string;
}) {
  const base = "inline-block";
  const c = cx(base, className);
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
    case "deal":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M4 12h16l-1.6-7.2A2 2 0 0 0 16.5 3H7.5A2 2 0 0 0 5.6 4.8L4 12Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M12 3v9"
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
          <path
            d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
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
    case "arrow":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M10 17l5-5-5-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "edit":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 20h9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "toggle":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6 12h12"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M12 6v12"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "inventory":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 7h16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M6 7l1-3h10l1 3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M6 7v14h12V7"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M9 11h6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M9 15h6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    
    case "active":
        return (
            <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M12 2v10"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
            <path
                d="M7 6.5a7 7 0 1 0 10 0"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
            </svg>
        );

    case "inactive":
        return (
            <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M12 2v10"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
            <path
                d="M7 6.5a7 7 0 1 0 10 0"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                opacity="0.35"
            />
            </svg>
        );

    case "close":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6 6l12 12"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M18 6L6 18"
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
  tone?: "dark" | "green" | "rose" | "slate";
  className?: string;
}) {
  const toneClasses =
    tone === "green"
      ? "bg-emerald-600 text-white hover:bg-emerald-700"
      : tone === "rose"
        ? "bg-rose-600 text-white hover:bg-rose-700"
        : tone === "slate"
          ? "bg-slate-700 text-white hover:bg-slate-800"
          : "bg-slate-900 text-white hover:bg-slate-800";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-extrabold",
        "shadow-sm ring-1 ring-black/5 transition",
        "focus:outline-none focus:ring-2 focus:ring-slate-400/40",
        disabled ? "cursor-not-allowed opacity-60" : "hover:-translate-y-[1px]",
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
        "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-extrabold",
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

function Pill({ children, tone }: { children: React.ReactNode; tone: "green" | "rose" | "slate" | "amber" }) {
  const styles =
    tone === "green"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : tone === "rose"
        ? "bg-rose-50 text-rose-700 ring-rose-200"
        : tone === "amber"
          ? "bg-amber-50 text-amber-800 ring-amber-200"
          : "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black ring-1", styles)}>
      {children}
    </span>
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
  tone: "slate" | "green" | "rose" | "amber";
}) {
  const bg =
    tone === "green"
      ? "from-emerald-50 to-white"
      : tone === "rose"
        ? "from-rose-50 to-white"
        : tone === "amber"
          ? "from-amber-50 to-white"
          : "from-slate-50 to-white";

  const ring =
    tone === "green"
      ? "ring-emerald-200/60"
      : tone === "rose"
        ? "ring-rose-200/60"
        : tone === "amber"
          ? "ring-amber-200/60"
          : "ring-slate-200/70";

  return (
    <div className={cx("rounded-3xl bg-gradient-to-b p-4 shadow-sm ring-1", bg, ring)}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-wide text-slate-600">{title}</div>
          <div className="mt-2 text-2xl font-black text-slate-900">{value}</div>
        </div>
        <div className="rounded-2xl bg-white p-2.5 ring-1 ring-slate-200 text-slate-800">{icon}</div>
      </div>
    </div>
  );
}

function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-[2px]">
      <div className="flex min-h-full items-start justify-center p-4 sm:items-center">
        <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
            <div>
              <div className="text-xl font-black text-slate-900">{title}</div>
              {subtitle ? <div className="mt-1 text-sm font-semibold text-slate-600">{subtitle}</div> : null}
            </div>
            <button
              onClick={onClose}
              className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100"
              aria-label="Close"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-y-auto px-6 py-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- types --------------------------------- */

type Mode = "create_pizza" | "create_deal" | "edit";
type ViewFilter = "all" | "pizzas" | "deals" | "active" | "inactive";

/* -------------------------------- component -------------------------------- */

export default function MenuManagementPanel() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [categories, setCategories] = useState<CategoryRead[]>([]);
  const [items, setItems] = useState<MenuItemRead[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ViewFilter>("all");

  const [mode, setMode] = useState<Mode | null>(null);
  const [active, setActive] = useState<MenuItemRead | null>(null);

  // form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");

  const [priceS, setPriceS] = useState<string>("");
  const [priceM, setPriceM] = useState<string>("");
  const [priceL, setPriceL] = useState<string>("");

  const [popular, setPopular] = useState(false);
  const [spicy, setSpicy] = useState(false);
  const [activeFlag, setActiveFlag] = useState(true);

  // inventory fields (optional)
  const [sku, setSku] = useState("");
  const [qty, setQty] = useState<string>("0");
  const [threshold, setThreshold] = useState<string>("0");

  async function refreshAll() {
    setErr(null);
    setLoading(true);
    try {
      const [cats, menu, deals] = await Promise.all([
        listCategories(true),
        listMenuItems({ only_active: false }),
        listDeals(false),
      ]);

      const byId = new Map<number, MenuItemRead>();
      [...menu, ...deals].forEach((x) => byId.set(x.id, x));

      setCategories(cats);
      setItems(Array.from(byId.values()).sort((a, b) => a.id - b.id));
    } catch (e: any) {
      setErr(e?.message || "Failed to load menu");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll();
  }, []);

  const stats = useMemo(() => {
    const total = items.length;
    const activeCount = items.filter((i) => i.is_active).length;
    const dealsCount = items.filter((i) => i.is_deal).length;
    const inactiveCount = total - activeCount;
    return { total, activeCount, dealsCount, inactiveCount };
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    let list = items;

    // filter chips
    if (filter === "pizzas") list = list.filter((i) => !i.is_deal);
    if (filter === "deals") list = list.filter((i) => i.is_deal);
    if (filter === "active") list = list.filter((i) => i.is_active);
    if (filter === "inactive") list = list.filter((i) => !i.is_active);

    // search
    if (!q) return list;
    return list.filter((i) => {
      const a = (i.name || "").toLowerCase();
      const b = (i.category_name || "").toLowerCase();
      const c = (i.description || "").toLowerCase();
      return a.includes(q) || b.includes(q) || c.includes(q);
    });
  }, [items, search, filter]);

  function resetFormDefaults() {
    setName("");
    setDescription("");
    setImageUrl("");
    setCategoryId(categories[0]?.id ? String(categories[0].id) : "");
    setPriceS("");
    setPriceM("");
    setPriceL("");
    setPopular(false);
    setSpicy(false);
    setActiveFlag(true);
    setSku("");
    setQty("0");
    setThreshold("0");
  }

  function openCreatePizza() {
    setMode("create_pizza");
    setActive(null);
    setErr(null);
    resetFormDefaults();
  }

  function openCreateDeal() {
    setMode("create_deal");
    setActive(null);
    setErr(null);
    resetFormDefaults();
  }

  function openEdit(item: MenuItemRead) {
    setMode("edit");
    setActive(item);
    setErr(null);

    setName(item.name || "");
    setDescription(item.description || "");
    setImageUrl(item.image_url || "");
    setCategoryId(String(item.category_id || ""));

    setPriceS(item.price_small != null ? String(item.price_small) : "");
    setPriceM(item.price_medium != null ? String(item.price_medium) : "");
    setPriceL(item.price_large != null ? String(item.price_large) : "");

    setPopular(!!item.is_popular);
    setSpicy(!!item.is_spicy);
    setActiveFlag(!!item.is_active);

    setSku("");
    setQty("0");
    setThreshold("0");
  }

  function closeModal() {
    setMode(null);
    setActive(null);
  }

  async function ensureInventoryRow(
    menuItem: MenuItemRead,
    opts?: { sku?: string | null; qty?: number; threshold?: number }
  ) {
    const inv = await listInventory({ limit: 500 });
    const existing = inv.find((x: InventoryItemRead) => x.menu_item_id === menuItem.id);

    if (!existing) {
      await createInventoryItem({
        sku: opts?.sku ?? (opts?.sku === "" ? null : null),
        name: menuItem.name,
        menu_item_id: menuItem.id,
        current_qty: opts?.qty ?? 0,
        low_stock_threshold: opts?.threshold ?? 0,
        is_out_of_stock: (opts?.qty ?? 0) <= 0,
      });
      return;
    }

    const patch: any = { name: menuItem.name };
    if (opts?.sku !== undefined) patch.sku = opts.sku;
    if (opts?.qty !== undefined) patch.current_qty = opts.qty;
    if (opts?.threshold !== undefined) patch.low_stock_threshold = opts.threshold;
    await updateInventoryItem(existing.id, patch);
  }

  async function onSubmit() {
    setErr(null);

    const cleanName = name.trim();
    if (!cleanName) return setErr("Name is required");

    const catId = Number(categoryId);
    if (!Number.isFinite(catId) || catId <= 0) return setErr("Category is required");

    const parsePrice = (v: string) => {
      const t = v.trim();
      if (!t) return null;
      const n = Number(t);
      if (!Number.isFinite(n) || n < 0) return NaN;
      return n;
    };

    const pS = parsePrice(priceS);
    const pM = parsePrice(priceM);
    const pL = parsePrice(priceL);

    if (Number.isNaN(pS)) return setErr("Small price must be a number >= 0");
    if (Number.isNaN(pM)) return setErr("Medium price must be a number >= 0");
    if (Number.isNaN(pL)) return setErr("Large price must be a number >= 0");

    const invQty = Number(qty);
    const invThr = Number(threshold);
    if (!Number.isFinite(invQty) || invQty < 0) return setErr("Qty must be >= 0");
    if (!Number.isFinite(invThr) || invThr < 0) return setErr("Low stock threshold must be >= 0");

    const payload: MenuItemCreate = {
      name: cleanName,
      description: description.trim() ? description.trim() : null,
      image_url: imageUrl.trim() ? safeUrl(imageUrl.trim()) : null,
      category_id: catId,
      price_small: pS,
      price_medium: pM,
      price_large: pL,
      is_popular: popular,
      is_spicy: spicy,
      is_active: activeFlag,
    };

    setLoading(true);
    try {
      if (mode === "create_pizza") {
        const created = await createMenuItem({ ...payload, is_deal: false });
        await ensureInventoryRow(created, {
          sku: sku.trim() ? sku.trim() : null,
          qty: invQty,
          threshold: invThr,
        });
      } else if (mode === "create_deal") {
        const created = await createDeal({ ...payload, is_deal: true });
        await ensureInventoryRow(created, {
          sku: sku.trim() ? sku.trim() : null,
          qty: invQty,
          threshold: invThr,
        });
      } else if (mode === "edit" && active) {
        const updated = await updateMenuItem(active.id, payload);
        await ensureInventoryRow(updated, {
          sku: sku.trim() ? sku.trim() : undefined,
          qty: qty !== "0" ? invQty : undefined,
          threshold: threshold !== "0" ? invThr : undefined,
        });
      }

      closeModal();
      await refreshAll();
    } catch (e: any) {
      setErr(e?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(item: MenuItemRead) {
    setErr(null);
    setLoading(true);
    try {
      const updated = await updateMenuItem(item.id, { is_active: !item.is_active });
      await ensureInventoryRow(updated);
      await refreshAll();
    } catch (e: any) {
      setErr(e?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  }

  const modalTitle =
    mode === "create_pizza" ? "Add New Pizza" : mode === "create_deal" ? "Add New Deal" : "Edit Item";

  const modalSubtitle =
    mode === "create_deal"
      ? "Deals show up in the Deals page for customers."
      : "Pizzas show up in the Menu page for customers.";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 ring-1 ring-slate-200">POS</span>
              <Icon name="arrow" className="h-4 w-4 text-slate-400" />
              <span className="rounded-full bg-slate-100 px-2.5 py-1 ring-1 ring-slate-200">
                Menu Management
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-3xl bg-white p-3 ring-1 ring-slate-200 shadow-sm">
                <Icon name="pizza" className="h-7 w-7 text-slate-900" />
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900">Menu Management</div>
                <div className="mt-1 text-sm font-semibold text-slate-600">
                  Manage pizzas & deals. Inventory stays synced automatically.
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <GhostButton onClick={() => router.push("/POS/inventory")} disabled={loading}>
              <Icon name="inventory" className="h-5 w-5" />
              Inventory
            </GhostButton>

            <GhostButton onClick={refreshAll} disabled={loading}>
              <Icon name="refresh" className={cx("h-5 w-5", loading && "animate-spin")} />
              Refresh
            </GhostButton>

            <PrimaryButton onClick={openCreatePizza} disabled={loading} tone="green">
              <Icon name="plus" className="h-5 w-5" />
              Add Pizza
            </PrimaryButton>

            <PrimaryButton onClick={openCreateDeal} disabled={loading} tone="rose">
              <Icon name="plus" className="h-5 w-5" />
              Add Deal
            </PrimaryButton>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Items"
            value={String(stats.total)}
            tone="slate"
            icon={<Icon name="pizza" className="h-6 w-6" />}
          />
          <StatCard
            title="Deals"
            value={String(stats.dealsCount)}
            tone="amber"
            icon={<Icon name="deal" className="h-6 w-6" />}
          />
          <StatCard
            title="Active"
            value={String(stats.activeCount)}
            tone="green"
            icon={<Icon name="active" className="h-6 w-6 text-emerald-700" />}
            />

            <StatCard
            title="Inactive"
            value={String(stats.inactiveCount)}
            tone="rose"
            icon={<Icon name="inactive" className="h-6 w-6 text-rose-700" />}
            />

        </div>

        {/* Controls */}
        <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <div className="relative">
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Icon name="search" className="h-5 w-5" />
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, category, or description..."
                className={cx(
                  "w-full rounded-2xl border bg-white py-3 pl-12 pr-4 text-sm font-semibold text-slate-900",
                  "border-slate-200 outline-none focus:ring-2 focus:ring-slate-300"
                )}
              />
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-wrap items-center gap-2 lg:justify-end">
            <button
              onClick={() => setFilter("all")}
              className={cx(
                "rounded-full px-3 py-1.5 text-xs font-black ring-1 transition",
                filter === "all"
                  ? "bg-slate-900 text-white ring-slate-900"
                  : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilter("pizzas")}
              className={cx(
                "rounded-full px-3 py-1.5 text-xs font-black ring-1 transition",
                filter === "pizzas"
                  ? "bg-slate-900 text-white ring-slate-900"
                  : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
              )}
            >
              Pizzas
            </button>
            <button
              onClick={() => setFilter("deals")}
              className={cx(
                "rounded-full px-3 py-1.5 text-xs font-black ring-1 transition",
                filter === "deals"
                  ? "bg-slate-900 text-white ring-slate-900"
                  : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
              )}
            >
              Deals
            </button>
            <button
              onClick={() => setFilter("active")}
              className={cx(
                "rounded-full px-3 py-1.5 text-xs font-black ring-1 transition",
                filter === "active"
                  ? "bg-emerald-600 text-white ring-emerald-600"
                  : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
              )}
            >
              Active
            </button>
            <button
              onClick={() => setFilter("inactive")}
              className={cx(
                "rounded-full px-3 py-1.5 text-xs font-black ring-1 transition",
                filter === "inactive"
                  ? "bg-rose-600 text-white ring-rose-600"
                  : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
              )}
            >
              Inactive
            </button>
          </div>
        </div>

        {/* Error */}
        {err ? (
          <div className="mt-4 rounded-3xl bg-rose-50 p-4 ring-1 ring-rose-200">
            <div className="text-sm font-black text-rose-800">Error</div>
            <div className="mt-1 text-sm font-semibold text-rose-700">{err}</div>
          </div>
        ) : null}

        {/* Table */}
        <div className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-black text-slate-900">Items</div>
                <div className="mt-1 text-xs font-semibold text-slate-600">
                  Click “Edit” to update details. Disable hides item from customer menu/deals.
                </div>
              </div>
              <div className="text-xs font-black text-slate-600">
                Showing <span className="text-slate-900">{filtered.length}</span>
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 ring-1 ring-slate-200">
                <Icon name="pizza" className="h-7 w-7 text-slate-700" />
              </div>
              <div className="mt-4 text-lg font-black text-slate-900">No items found</div>
              <div className="mt-2 text-sm font-semibold text-slate-600">
                Try adjusting filters or add a new pizza/deal.
              </div>
              <div className="mt-6 flex justify-center gap-2">
                <PrimaryButton onClick={openCreatePizza} disabled={loading} tone="green">
                  <Icon name="plus" className="h-5 w-5" />
                  Add Pizza
                </PrimaryButton>
                <PrimaryButton onClick={openCreateDeal} disabled={loading} tone="rose">
                  <Icon name="plus" className="h-5 w-5" />
                  Add Deal
                </PrimaryButton>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-xs font-black uppercase tracking-wide text-slate-600">
                    <th className="px-5 py-3">Item</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Prices</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filtered.map((i) => {
                    const img = safeUrl(i.image_url || "");
                    return (
                      <tr key={String(i.id)} className="hover:bg-slate-50/60">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
                              {img ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={img} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-slate-500">
                                  <Icon name={i.is_deal ? "deal" : "pizza"} className="h-6 w-6" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-black text-slate-900">{i.name}</div>
                              <div className="mt-1 line-clamp-1 text-xs font-semibold text-slate-600">
                                {i.description || "—"}
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {i.is_popular ? <Pill tone="amber">Popular</Pill> : null}
                                {i.is_spicy ? <Pill tone="rose">Spicy</Pill> : null}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="text-sm font-bold text-slate-800">
                            {i.category_name || `#${i.category_id}`}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200">
                              S: {formatPrice(i.price_small)}
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200">
                              M: {formatPrice(i.price_medium)}
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200">
                              L: {formatPrice(i.price_large)}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          {i.is_deal ? <Pill tone="amber">Deal</Pill> : <Pill tone="slate">Pizza</Pill>}
                        </td>

                        <td className="px-5 py-4">
                          {i.is_active ? <Pill tone="green">Active</Pill> : <Pill tone="rose">Inactive</Pill>}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => openEdit(i)}
                              disabled={loading}
                              className={cx(
                                "inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-black",
                                "bg-white ring-1 ring-slate-200 hover:bg-slate-50",
                                "focus:outline-none focus:ring-2 focus:ring-slate-300",
                                loading && "opacity-60 cursor-not-allowed"
                              )}
                            >
                              <Icon name="edit" className="h-4 w-4" />
                              Edit
                            </button>

                            <button
                              onClick={() => toggleActive(i)}
                              disabled={loading}
                              className={cx(
                                "inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-black",
                                i.is_active
                                  ? "bg-rose-600 text-white hover:bg-rose-700"
                                  : "bg-emerald-600 text-white hover:bg-emerald-700",
                                "shadow-sm ring-1 ring-black/5",
                                "focus:outline-none focus:ring-2 focus:ring-slate-300",
                                loading && "opacity-60 cursor-not-allowed"
                              )}
                            >
                              <Icon name="toggle" className="h-4 w-4" />
                              {i.is_active ? "Disable" : "Enable"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <MenuCustomizationManagement />
      </div>

      {/* Modal */}
      <Modal
        open={!!mode}
        title={modalTitle}
        subtitle={mode ? modalSubtitle : undefined}
        onClose={closeModal}
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: form */}
          <div className="lg:col-span-8 space-y-6">
            {/* Basic */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-black text-slate-900">Basic Info</div>
                  <div className="mt-1 text-xs font-semibold text-slate-600">
                    Name, category, description and image.
                  </div>
                </div>
                <Pill tone="slate">{mode === "create_deal" ? "Deal" : "Pizza"}</Pill>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block md:col-span-2">
                  <div className="text-xs font-black text-slate-700">Name *</div>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="e.g. Margherita Pizza"
                  />
                </label>

                <label className="block">
                  <div className="text-xs font-black text-slate-700">Category *</div>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    <option value="">Select…</option>
                    {categories.map((c) => (
                      <option key={String(c.id)} value={String(c.id)}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <div className="text-xs font-black text-slate-700">Image URL</div>
                  <input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="https://..."
                  />
                </label>

                <label className="block md:col-span-2">
                  <div className="text-xs font-black text-slate-700">Description</div>
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="Short description for customers"
                  />
                </label>

                <div className="md:col-span-2 flex flex-wrap gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={popular}
                      onChange={(e) => setPopular(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Popular
                  </label>

                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={spicy}
                      onChange={(e) => setSpicy(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Spicy
                  </label>

                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={activeFlag}
                      onChange={(e) => setActiveFlag(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Active (visible to customers)
                  </label>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-black text-slate-900">Pricing</div>
              <div className="mt-1 text-xs font-semibold text-slate-600">
                Leave a field empty if you don’t want that size.
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <label className="block">
                  <div className="text-xs font-black text-slate-700">Small</div>
                  <input
                    value={priceS}
                    onChange={(e) => setPriceS(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="e.g. 8.99"
                  />
                </label>

                <label className="block">
                  <div className="text-xs font-black text-slate-700">Medium</div>
                  <input
                    value={priceM}
                    onChange={(e) => setPriceM(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="e.g. 11.99"
                  />
                </label>

                <label className="block">
                  <div className="text-xs font-black text-slate-700">Large</div>
                  <input
                    value={priceL}
                    onChange={(e) => setPriceL(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="e.g. 14.99"
                  />
                </label>
              </div>
            </div>

            {/* Inventory Link */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-black text-slate-900">Inventory Link</div>
              <div className="mt-1 text-xs font-semibold text-slate-600">
                Optional. If filled, we create/update the linked inventory item.
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <label className="block">
                  <div className="text-xs font-black text-slate-700">SKU</div>
                  <input
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="e.g. PIZ-001"
                  />
                </label>

                <label className="block">
                  <div className="text-xs font-black text-slate-700">Initial Qty</div>
                  <input
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="0"
                  />
                </label>

                <label className="block">
                  <div className="text-xs font-black text-slate-700">Low Stock Threshold</div>
                  <input
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="0"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Right: preview + actions */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="text-sm font-black text-slate-900">Preview</div>
              <div className="mt-1 text-xs font-semibold text-slate-600">How it will look to staff/customers.</div>

              <div className="mt-4 overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
                <div className="h-36 w-full bg-slate-100">
                  {imageUrl.trim() ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={safeUrl(imageUrl.trim())}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-500">
                      <Icon name={mode === "create_deal" ? "deal" : "pizza"} className="h-10 w-10" />
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="text-base font-black text-slate-900">{name.trim() || "Item name…"}</div>
                  <div className="mt-1 text-xs font-semibold text-slate-600 line-clamp-2">
                    {description.trim() || "Description…"}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {mode === "create_deal" ? <Pill tone="amber">Deal</Pill> : <Pill tone="slate">Pizza</Pill>}
                    {activeFlag ? <Pill tone="green">Active</Pill> : <Pill tone="rose">Inactive</Pill>}
                    {popular ? <Pill tone="amber">Popular</Pill> : null}
                    {spicy ? <Pill tone="rose">Spicy</Pill> : null}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-2xl bg-slate-50 p-2 text-center ring-1 ring-slate-200">
                      <div className="text-[10px] font-black uppercase text-slate-600">S</div>
                      <div className="text-sm font-black text-slate-900">{priceS.trim() || "—"}</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-2 text-center ring-1 ring-slate-200">
                      <div className="text-[10px] font-black uppercase text-slate-600">M</div>
                      <div className="text-sm font-black text-slate-900">{priceM.trim() || "—"}</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-2 text-center ring-1 ring-slate-200">
                      <div className="text-[10px] font-black uppercase text-slate-600">L</div>
                      <div className="text-sm font-black text-slate-900">{priceL.trim() || "—"}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {err ? (
              <div className="rounded-3xl bg-rose-50 p-4 ring-1 ring-rose-200">
                <div className="text-sm font-black text-rose-800">Fix this before saving</div>
                <div className="mt-1 text-sm font-semibold text-rose-700">{err}</div>
              </div>
            ) : null}

            <div className="flex flex-col gap-2">
              <PrimaryButton
                onClick={onSubmit}
                disabled={loading}
                tone={mode === "create_deal" ? "rose" : "green"}
                className="w-full justify-center"
              >
                {loading ? (
                  <>
                    <Icon name="refresh" className="h-5 w-5 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Icon name="plus" className="h-5 w-5" />
                    Save
                  </>
                )}
              </PrimaryButton>

              <GhostButton onClick={closeModal} disabled={loading} className="w-full justify-center">
                Cancel
              </GhostButton>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
