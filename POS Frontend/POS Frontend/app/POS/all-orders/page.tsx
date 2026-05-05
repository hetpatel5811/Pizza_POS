"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Clock3,
  MapPin,
  RefreshCw,
  Search,
  ShoppingBag,
  Store,
  UtensilsCrossed,
  XCircle,
} from "lucide-react";
import useAuth from "@/hooks/useAuth";
import {
  approveCustomerOrder,
  declineCustomerOrder,
  listCustomerOrders,
  type CustomerOrderRead,
} from "@/lib/api/customerOrders";
import { listPosOrders, type POSOrderRead } from "@/lib/api/posOrders";

type UnifiedOrder = {
  id: string;
  source: "customer" | "employee";
  sourceLabel: string;
  displayId: string;
  orderNumber?: string | null;
  customerName: string;
  customerPhone: string;
  orderType: string;
  status: string;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  total: number;
  createdAt: string;
  updatedAt: string;
  tableNo?: string | null;
  address?: string | null;
  notes?: string | null;
  itemCount: number;
  items: Array<{
    id: string;
    name: string;
    qty: number;
    note?: string | null;
    total: number | null;
  }>;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function money(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeCustomerOrder(order: CustomerOrderRead): UnifiedOrder {
  return {
    id: `customer-${order.id}`,
    source: "customer",
    sourceLabel: "Customer Panel",
    displayId: order.order_number || `C-${order.id}`,
    orderNumber: order.order_number,
    customerName: order.customer_name || "Walk-in customer",
    customerPhone: order.customer_phone || "No phone",
    orderType: order.order_type,
    status: order.status,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    total: order.total || 0,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    tableNo: order.table_number,
    address: order.delivery_address,
    notes: order.notes || order.delivery_instructions,
    itemCount: order.items.reduce((sum, item) => sum + (item.quantity || 0), 0),
    items: order.items.map((item) => ({
      id: `customer-item-${item.id}`,
      name: item.menu_item_name,
      qty: item.quantity,
      note: item.special_instructions,
      total: item.total_price ?? null,
    })),
  };
}

function normalizePosOrder(order: POSOrderRead): UnifiedOrder {
  const grandTotal =
    order.total != null
      ? Number(order.total)
      : order.items.reduce((sum, item) => {
          const unitPrice = Number(item.unit_price || 0);
          return sum + unitPrice * (item.qty || 0);
        }, 0);

  return {
    id: `employee-${order.id}`,
    source: "employee",
    sourceLabel: "Employee Panel",
    displayId: `POS-${order.id}`,
    orderNumber: null,
    customerName: order.customer_name || "Walk-in customer",
    customerPhone: order.customer_phone || "No phone",
    orderType: order.order_type,
    status: order.status,
    paymentMethod: null,
    paymentStatus: null,
    total: grandTotal,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    tableNo: order.table_no,
    address: order.delivery_address_text,
    notes: order.special_instructions,
    itemCount: order.items.reduce((sum, item) => sum + (item.qty || 0), 0),
    items: order.items.map((item) => ({
      id: `pos-item-${item.id}`,
      name: item.name_snapshot,
      qty: item.qty,
      note: item.note,
      total: Number(item.unit_price || 0) * (item.qty || 0),
    })),
  };
}

function statusTone(status: string) {
  const key = status.toLowerCase();
  if (["ready", "completed", "delivered"].includes(key)) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (["new", "confirmed", "pending"].includes(key)) return "bg-sky-50 text-sky-700 ring-sky-200";
  if (["preparing", "baking", "out_for_delivery"].includes(key)) return "bg-amber-50 text-amber-800 ring-amber-200";
  if (["cancelled", "canceled", "voided"].includes(key)) return "bg-rose-50 text-rose-700 ring-rose-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function sourceTone(source: UnifiedOrder["source"]) {
  return source === "customer"
    ? "bg-violet-50 text-violet-700 ring-violet-200"
    : "bg-teal-50 text-teal-700 ring-teal-200";
}

function isCashApprovalRequest(order: UnifiedOrder) {
  return (
    order.source === "customer" &&
    (order.paymentMethod || "").toLowerCase() === "cash" &&
    order.status.toLowerCase() === "pending"
  );
}

function isDeclinedCashOrder(order: UnifiedOrder) {
  return (
    order.source === "customer" &&
    (order.paymentMethod || "").toLowerCase() === "cash" &&
    ["cancelled", "canceled"].includes(order.status.toLowerCase())
  );
}

export default function AllOrdersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [customerOrders, setCustomerOrders] = useState<CustomerOrderRead[]>([]);
  const [employeeOrders, setEmployeeOrders] = useState<POSOrderRead[]>([]);
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | "customer" | "employee">("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [approvalAction, setApprovalAction] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [error, setError] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const inFlightRef = useRef(false);

  const loadOrders = useCallback(async (mode: "initial" | "refresh" | "silent" = "initial") => {
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    if (mode === "initial") setPageLoading(true);
    if (mode === "refresh") setRefreshing(true);
    if (mode !== "silent") setError("");

    try {
      const [customerData, employeeData] = await Promise.all([
        listCustomerOrders({ limit: 200 }),
        listPosOrders({ limit: 200 }),
      ]);
      setCustomerOrders(customerData);
      setEmployeeOrders(employeeData);
      setLastSyncedAt(new Date());
    } catch (err) {
      if (mode !== "silent") {
        setError(err instanceof Error ? err.message : "Unable to load orders");
      }
    } finally {
      inFlightRef.current = false;
      setPageLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!(user.role === "admin" || user.role === "employee")) {
      router.replace("/menu");
      return;
    }
    void loadOrders();
  }, [loading, loadOrders, router, user]);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (!(user.role === "admin" || user.role === "employee")) return;

    const id = window.setInterval(() => {
      if (document.hidden) return;
      void loadOrders("silent");
    }, 4000);

    return () => {
      window.clearInterval(id);
    };
  }, [loading, loadOrders, user?.id, user?.role]);

  const orders = useMemo(() => {
    const merged = [
      ...customerOrders.map(normalizeCustomerOrder),
      ...employeeOrders.map(normalizePosOrder),
    ];

    return merged.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [customerOrders, employeeOrders]);

  const approvalRequests = useMemo(
    () => orders.filter((order) => isCashApprovalRequest(order)),
    [orders]
  );

  const queueOrders = useMemo(
    () => orders.filter((order) => !isCashApprovalRequest(order) && !isDeclinedCashOrder(order)),
    [orders]
  );

  const availableStatuses = useMemo(() => {
    return Array.from(new Set(queueOrders.map((order) => order.status.toLowerCase()))).sort();
  }, [queueOrders]);

  const filteredOrders = useMemo(() => {
    const search = query.trim().toLowerCase();

    return queueOrders.filter((order) => {
      if (sourceFilter !== "all" && order.source !== sourceFilter) return false;
      if (statusFilter !== "all" && order.status.toLowerCase() !== statusFilter) return false;
      if (!search) return true;

      return [
        order.displayId,
        order.customerName,
        order.customerPhone,
        order.orderType,
        order.status,
        order.tableNo || "",
        order.address || "",
        ...order.items.map((item) => item.name),
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });
  }, [queueOrders, query, sourceFilter, statusFilter]);

  const stats = useMemo(() => {
    const activeStatuses = new Set(["new", "confirmed", "pending", "preparing", "baking", "ready", "out_for_delivery"]);
    return {
      totalOrders: filteredOrders.length,
      pendingApprovals: approvalRequests.length,
      customerOrders: filteredOrders.filter((order) => order.source === "customer").length,
      employeeOrders: filteredOrders.filter((order) => order.source === "employee").length,
      activeOrders: filteredOrders.filter((order) => activeStatuses.has(order.status.toLowerCase())).length,
      totalSales: filteredOrders.reduce((sum, order) => sum + order.total, 0),
    };
  }, [approvalRequests.length, filteredOrders]);

  async function handleApprovalAction(order: UnifiedOrder, action: "approve" | "decline") {
    if (!order.orderNumber) return;

    const actionKey = `${action}:${order.id}`;
    setApprovalAction(actionKey);
    setError("");
    setActionMessage("");

    try {
      if (action === "approve") {
        await approveCustomerOrder(order.orderNumber);
        setActionMessage(`${order.displayId} approved and moved to the live queue.`);
      } else {
        await declineCustomerOrder(order.orderNumber);
        setActionMessage(`${order.displayId} declined and removed from the live queue.`);
      }
      await loadOrders("refresh");
    } catch (err) {
      setError(err instanceof Error ? err.message : `Unable to ${action} order`);
    } finally {
      setApprovalAction(null);
    }
  }

  if (loading || pageLoading || !user || !(user.role === "admin" || user.role === "employee")) {
    return <div className="min-h-screen flex items-center justify-center text-slate-600">Loading orders...</div>;
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.16),_transparent_28%),linear-gradient(180deg,_#f8fafc,_#eef6ff)]">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => router.push("/POS")}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white transition hover:bg-slate-800"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white">
                  <ClipboardList className="h-3.5 w-3.5" />
                  All Orders
                </div>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">One place to watch every order</h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-600">
                  Cash orders now wait for employee approval first, then move into this live queue after approval.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <button
                type="button"
                onClick={() => void loadOrders("refresh")}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={cx("h-4 w-4", refreshing && "animate-spin")} />
                {refreshing ? "Refreshing..." : "Refresh Orders"}
              </button>
              <div className="text-xs font-semibold text-slate-500">
                Live sync every 4s
                {lastSyncedAt
                  ? ` • Last sync ${lastSyncedAt.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}`
                  : ""}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Visible Queue</div>
              <div className="mt-3 text-3xl font-black text-slate-900">{stats.totalOrders}</div>
            </div>
            <div className="rounded-3xl border border-indigo-200 bg-indigo-50 p-4">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">Pending Approval</div>
              <div className="mt-3 text-3xl font-black text-indigo-900">{stats.pendingApprovals}</div>
            </div>
            <div className="rounded-3xl border border-violet-200 bg-violet-50 p-4">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">Customer Panel</div>
              <div className="mt-3 text-3xl font-black text-violet-900">{stats.customerOrders}</div>
            </div>
            <div className="rounded-3xl border border-teal-200 bg-teal-50 p-4">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-teal-600">Employee Panel</div>
              <div className="mt-3 text-3xl font-black text-teal-900">{stats.employeeOrders}</div>
            </div>
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Active Queue</div>
              <div className="mt-3 text-3xl font-black text-amber-900">{stats.activeOrders}</div>
            </div>
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Visible Sales</div>
              <div className="mt-3 text-3xl font-black text-emerald-900">{money(stats.totalSales)}</div>
            </div>
          </div>

          {actionMessage ? (
            <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              {actionMessage}
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {error}
            </div>
          ) : null}

          <section id="approval-requests" className="mt-6 rounded-[2rem] border border-indigo-200 bg-indigo-50/45 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-900">Cash Approval Requests</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Approve to move order into queue. Decline to remove it from live operations.
                </p>
              </div>
              <div className="inline-flex items-center rounded-full bg-indigo-600 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-white">
                {approvalRequests.length} waiting
              </div>
            </div>

            {approvalRequests.length === 0 ? (
              <div className="mt-4 rounded-3xl border border-dashed border-indigo-300 bg-white/70 px-6 py-8 text-center text-sm font-semibold text-slate-600">
                No cash approval requests right now.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {approvalRequests.map((order) => {
                  const approving = approvalAction === `approve:${order.id}`;
                  const declining = approvalAction === `decline:${order.id}`;
                  const busy = approving || declining;

                  return (
                    <article key={order.id} className="rounded-3xl border border-indigo-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-xs font-black text-violet-700 ring-1 ring-violet-200">
                              {order.sourceLabel}
                            </span>
                            <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700 ring-1 ring-amber-200">
                              Pending approval
                            </span>
                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200">
                              Cash
                            </span>
                          </div>
                          <div className="mt-2 text-lg font-black text-slate-900">{order.displayId}</div>
                          <div className="mt-1 text-sm font-semibold text-slate-700">
                            {order.customerName} • {order.customerPhone}
                          </div>
                          <div className="mt-1 text-sm text-slate-600">
                            {order.orderType.replace(/_/g, " ")} • {order.itemCount} item(s) • {formatDateTime(order.createdAt)}
                          </div>
                          <div className="mt-1 text-sm text-slate-600">
                            {order.tableNo ? `Table ${order.tableNo}` : order.address || "No location"}
                          </div>
                        </div>

                        <div className="flex flex-col items-start gap-3 lg:items-end">
                          <div className="text-2xl font-black text-slate-900">{money(order.total)}</div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void handleApprovalAction(order, "approve")}
                              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              {approving ? "Approving..." : "Approve"}
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void handleApprovalAction(order, "decline")}
                              className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <XCircle className="h-4 w-4" />
                              {declining ? "Declining..." : "Decline"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-black text-slate-900">Live Queue (Approved Orders)</h2>
              <p className="text-sm font-semibold text-slate-600">Only approved cash orders appear here.</p>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[1.3fr_220px_220px]">
              <label className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by order id, customer, phone, item, table..."
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </label>

              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as "all" | "customer" | "employee")}
                className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
              >
                <option value="all">All Sources</option>
                <option value="customer">Customer Panel</option>
                <option value="employee">Employee Panel</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
              >
                <option value="all">All Statuses</option>
                {availableStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                  <ShoppingBag className="mx-auto h-10 w-10 text-slate-400" />
                  <h2 className="mt-4 text-xl font-black text-slate-900">No queue orders match this view</h2>
                  <p className="mt-2 text-sm text-slate-500">Try clearing search or changing the source and status filters.</p>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <article
                    key={order.id}
                    className="overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_24px_70px_-50px_rgba(15,23,42,0.45)]"
                  >
                    <div className="border-b border-slate-100 bg-gradient-to-r from-white via-slate-50 to-sky-50/60 px-5 py-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={cx("inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1", sourceTone(order.source))}>
                              {order.sourceLabel}
                            </span>
                            <span className={cx("inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1", statusTone(order.status))}>
                              {order.status.replace(/_/g, " ")}
                            </span>
                            {order.paymentMethod ? (
                              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600 ring-1 ring-slate-200">
                                Method {order.paymentMethod.replace(/_/g, " ")}
                              </span>
                            ) : null}
                            {order.paymentStatus ? (
                              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600 ring-1 ring-slate-200">
                                Payment {order.paymentStatus.replace(/_/g, " ")}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                            <h2 className="text-xl font-black text-slate-900">{order.displayId}</h2>
                            <div className="text-sm font-semibold text-slate-600">{order.customerName}</div>
                            <div className="text-sm text-slate-500">{order.customerPhone}</div>
                          </div>
                        </div>

                        <div className="text-left lg:text-right">
                          <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Total</div>
                          <div className="mt-1 text-2xl font-black text-slate-900">{money(order.total)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-5 px-5 py-5 lg:grid-cols-[1.2fr_0.8fr]">
                      <div>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-3xl bg-slate-50 p-4">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                              <Store className="h-4 w-4" />
                              Order Type
                            </div>
                            <div className="mt-2 text-sm font-black text-slate-900">{order.orderType.replace(/_/g, " ")}</div>
                          </div>
                          <div className="rounded-3xl bg-slate-50 p-4">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                              <Clock3 className="h-4 w-4" />
                              Created
                            </div>
                            <div className="mt-2 text-sm font-black text-slate-900">{formatDateTime(order.createdAt)}</div>
                          </div>
                          <div className="rounded-3xl bg-slate-50 p-4">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                              <UtensilsCrossed className="h-4 w-4" />
                              Items
                            </div>
                            <div className="mt-2 text-sm font-black text-slate-900">{order.itemCount} item(s)</div>
                          </div>
                          <div className="rounded-3xl bg-slate-50 p-4">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                              <MapPin className="h-4 w-4" />
                              Table / Address
                            </div>
                            <div className="mt-2 text-sm font-black text-slate-900">
                              {order.tableNo ? `Table ${order.tableNo}` : order.address || "No location"}
                            </div>
                          </div>
                        </div>

                        {order.notes ? (
                          <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3">
                            <div className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Instructions</div>
                            <div className="mt-2 text-sm font-medium text-amber-900">{order.notes}</div>
                          </div>
                        ) : null}
                      </div>

                      <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-black text-slate-900">Order items</div>
                          <div className="text-xs font-semibold text-slate-500">{order.items.length} line(s)</div>
                        </div>

                        <div className="mt-3 space-y-2">
                          {order.items.map((item) => (
                            <div key={item.id} className="rounded-2xl bg-white px-3 py-3 ring-1 ring-slate-100">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-sm font-bold text-slate-900">
                                    {item.qty}x {item.name}
                                  </div>
                                  {item.note ? <div className="mt-1 text-xs text-slate-500">{item.note}</div> : null}
                                </div>
                                <div className="text-sm font-black text-slate-700">
                                  {item.total != null ? money(item.total) : "-"}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
