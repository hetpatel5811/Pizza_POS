"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { listCustomerOrders, type CustomerOrderRead } from "@/lib/api/customerOrders";
import { listPosOrders, type POSOrderRead } from "@/lib/api/posOrders";
import { adminCreateUser } from "@/lib/api/admin";
import { getEmployeeDailyWorkReport, type EmployeeWorkDailyRead } from "@/lib/api/employee";

type Role = "customer" | "employee" | "admin";
type UnifiedOrder = {
  id: string;
  source: "Customer" | "Employee";
  customer: string;
  orderType: string;
  status: string;
  total: number;
  createdAt: string;
};

function title(value?: string | null) {
  if (!value) return "Unknown";
  return value.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function money(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v || 0);
}

function toLocalDateInputValue(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toUnifiedCustomer(o: CustomerOrderRead): UnifiedOrder {
  return {
    id: o.order_number || `C-${o.id}`,
    source: "Customer",
    customer: o.customer_name || "Walk-in customer",
    orderType: title(o.order_type),
    status: title(o.status),
    total: Number(o.total || 0),
    createdAt: o.created_at,
  };
}

function toUnifiedEmployee(o: POSOrderRead): UnifiedOrder {
  const total =
    o.total != null
      ? Number(o.total)
      : o.items.reduce((sum, i) => sum + Number(i.unit_price || 0) * (i.qty || 0), 0);
  return {
    id: `POS-${o.id}`,
    source: "Employee",
    customer: o.customer_name || "Walk-in customer",
    orderType: title(o.order_type),
    status: title(o.status),
    total,
    createdAt: o.created_at,
  };
}

export default function AdminPage() {
  const router = useRouter();
  const { user, token, loading, logout } = useAuth();

  const [orders, setOrders] = useState<UnifiedOrder[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("employee");
  const [creating, setCreating] = useState(false);
  const [staffMsg, setStaffMsg] = useState("");
  const [staffErr, setStaffErr] = useState("");
  const [showWorkReport, setShowWorkReport] = useState(false);
  const [workReportDate, setWorkReportDate] = useState(() => toLocalDateInputValue());
  const [workReportRows, setWorkReportRows] = useState<EmployeeWorkDailyRead[]>([]);
  const [workReportLoading, setWorkReportLoading] = useState(false);
  const [workReportError, setWorkReportError] = useState("");

  const loadData = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (!token) return;
      if (mode === "initial") setDataLoading(true);
      if (mode === "refresh") setRefreshing(true);
      setError("");
      try {
        const [customer, employee] = await Promise.all([
          listCustomerOrders({ limit: 200 }),
          listPosOrders({ limit: 200 }),
        ]);
        const merged = [...customer.map(toUnifiedCustomer), ...employee.map(toUnifiedEmployee)];
        merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(merged);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load admin data.");
      } finally {
        setDataLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  const loadWorkReport = useCallback(async () => {
    setWorkReportError("");
    setWorkReportLoading(true);
    try {
      const rows = await getEmployeeDailyWorkReport({ date: workReportDate });
      rows.sort((a, b) => b.worked_seconds - a.worked_seconds);
      setWorkReportRows(rows);
    } catch (e) {
      setWorkReportError(e instanceof Error ? e.message : "Failed to load work-time report.");
    } finally {
      setWorkReportLoading(false);
    }
  }, [workReportDate]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "admin") {
      router.replace("/");
      return;
    }
    if (token) void loadData("initial");
  }, [loading, user, token, router, loadData]);

  useEffect(() => {
    if (!showWorkReport) return;
    if (!token) return;
    void loadWorkReport();
  }, [showWorkReport, token, loadWorkReport]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) =>
      [o.id, o.source, o.customer, o.orderType, o.status].join(" ").toLowerCase().includes(q)
    );
  }, [orders, query]);

  const stats = useMemo(() => {
    const customer = filtered.filter((o) => o.source === "Customer").length;
    const employee = filtered.filter((o) => o.source === "Employee").length;
    const totalSales = filtered.filter((o) => !o.status.toLowerCase().includes("cancel")).reduce((s, o) => s + o.total, 0);
    return { all: filtered.length, customer, employee, totalSales };
  }, [filtered]);

  async function onCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setStaffErr("");
    setStaffMsg("");
    if (!token) {
      setStaffErr("Admin token missing. Please login again.");
      return;
    }
    if (!name || !email || !phone || !password) {
      setStaffErr("Please fill all fields.");
      return;
    }
    try {
      setCreating(true);
      await adminCreateUser(token, { name, email, phone, password, role });
      setStaffMsg(`Created ${title(role)} account successfully.`);
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setRole("employee");
    } catch (e) {
      setStaffErr(e instanceof Error ? e.message : "Could not create user.");
    } finally {
      setCreating(false);
    }
  }

  if (loading || !user || user.role !== "admin") {
    return <div className="min-h-screen flex items-center justify-center">Checking admin access...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-2xl border bg-white p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
              <p className="text-sm text-slate-600">Live customer + employee operations</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => void loadData("refresh")} className="rounded-lg border px-3 py-2 text-sm font-semibold" disabled={refreshing || dataLoading}>
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
              <button
                onClick={() => setShowWorkReport((prev) => !prev)}
                className="rounded-lg border px-3 py-2 text-sm font-semibold"
              >
                {showWorkReport ? "Hide Time Report" : "Employee Time Report"}
              </button>
              <button onClick={() => router.push("/POS/all-orders")} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
                Unified Queue
              </button>
              <button onClick={() => router.push("/POS")} className="rounded-lg border px-3 py-2 text-sm font-semibold">
                Employee Panel
              </button>
              <button onClick={logout} className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700">
                Logout
              </button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl border bg-slate-50 p-3"><p className="text-xs text-slate-500">Visible Orders</p><p className="text-xl font-bold">{stats.all}</p></div>
            <div className="rounded-xl border bg-blue-50 p-3"><p className="text-xs text-slate-500">Customer Orders</p><p className="text-xl font-bold">{stats.customer}</p></div>
            <div className="rounded-xl border bg-emerald-50 p-3"><p className="text-xs text-slate-500">Employee Orders</p><p className="text-xl font-bold">{stats.employee}</p></div>
            <div className="rounded-xl border bg-amber-50 p-3"><p className="text-xs text-slate-500">Sales</p><p className="text-xl font-bold">{money(stats.totalSales)}</p></div>
          </div>
          {error ? <p className="mt-3 text-sm font-semibold text-rose-700">{error}</p> : null}
        </section>

        {showWorkReport ? (
          <section className="rounded-2xl border bg-white p-4 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Employee Work-Time Report</h2>
                <p className="text-sm text-slate-600">Pick any date to view employee worked and break time.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={workReportDate}
                  onChange={(e) => setWorkReportDate(e.target.value)}
                  className="rounded-lg border px-3 py-2 text-sm"
                />
                <button
                  onClick={() => void loadWorkReport()}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                  disabled={workReportLoading}
                >
                  {workReportLoading ? "Loading..." : "Load Report"}
                </button>
              </div>
            </div>

            {workReportError ? <p className="mt-3 text-sm font-semibold text-rose-700">{workReportError}</p> : null}

            {workReportLoading ? (
              <p className="mt-4 text-sm text-slate-500">Loading work-time report...</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-3 py-2 text-left">Employee</th>
                      <th className="px-3 py-2 text-left">Role</th>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Hours</th>
                      <th className="px-3 py-2 text-left">Worked</th>
                      <th className="px-3 py-2 text-left">Break</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workReportRows.map((row) => (
                      <tr key={`${row.employee_id}-${row.date}`} className="border-t">
                        <td className="px-3 py-2 font-semibold">{row.employee_name}</td>
                        <td className="px-3 py-2">{title(row.role)}</td>
                        <td className="px-3 py-2">{row.date}</td>
                        <td className="px-3 py-2 font-semibold">{(row.worked_seconds / 3600).toFixed(2)}</td>
                        <td className="px-3 py-2 font-semibold">{row.worked_hms}</td>
                        <td className="px-3 py-2">{row.break_hms}</td>
                      </tr>
                    ))}
                    {workReportRows.length === 0 ? (
                      <tr>
                        <td className="px-3 py-6 text-center text-slate-500" colSpan={6}>
                          No employee time data found for this date.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : null}

        <section className="rounded-2xl border bg-white p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">Combined Orders</h2>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by id, source, customer, status..."
              className="w-full max-w-md rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          {dataLoading ? (
            <p className="mt-4 text-sm text-slate-500">Loading orders...</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Order</th>
                    <th className="px-3 py-2 text-left">Source</th>
                    <th className="px-3 py-2 text-left">Customer</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => (
                    <tr key={`${o.source}-${o.id}`} className="border-t">
                      <td className="px-3 py-2 font-semibold">{o.id}</td>
                      <td className="px-3 py-2">{o.source}</td>
                      <td className="px-3 py-2">{o.customer}</td>
                      <td className="px-3 py-2">{o.orderType}</td>
                      <td className="px-3 py-2">{o.status}</td>
                      <td className="px-3 py-2 font-semibold">{money(o.total)}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 ? (
                    <tr><td className="px-3 py-6 text-center text-slate-500" colSpan={6}>No matching orders</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border bg-white p-4 md:p-5">
            <h2 className="text-lg font-bold text-slate-900">Create Account</h2>
            <p className="text-sm text-slate-600">Create employee/customer accounts that immediately work in their panel.</p>
            <form onSubmit={onCreateUser} className="mt-4 space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full rounded-lg border px-3 py-2 text-sm" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-lg border px-3 py-2 text-sm" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="w-full rounded-lg border px-3 py-2 text-sm" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-lg border px-3 py-2 text-sm" />
              <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="w-full rounded-lg border px-3 py-2 text-sm">
                <option value="employee">Employee</option>
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
              <button disabled={creating || !token} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                {creating ? "Creating..." : "Create User"}
              </button>
            </form>
            {staffErr ? <p className="mt-2 text-sm font-semibold text-rose-700">{staffErr}</p> : null}
            {staffMsg ? <p className="mt-2 text-sm font-semibold text-emerald-700">{staffMsg}</p> : null}
          </div>
          <div className="rounded-2xl border bg-white p-4 md:p-5">
            <h2 className="text-lg font-bold text-slate-900">What To Add Next</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
              <li>Admin status change that updates customer tracking and employee queue together.</li>
              <li>Assign each new order to a clocked-in employee from admin panel.</li>
              <li>Auto-hide low-stock items in both customer and employee ordering screens.</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
