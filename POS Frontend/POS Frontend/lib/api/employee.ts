// lib/api/employee.ts
export type ClockState = "OFF_DUTY" | "ON_SHIFT" | "ON_BREAK";

export type ShiftScheduleRead = {
  id: number;
  employee_id: number;
  start_dt: string;
  end_dt: string;
  role_label?: string | null;
  note?: string | null;
};

export type ClockStatusRead = {
  state: ClockState;
  last_event_at?: string | null;
  shift_seconds_worked: number;
  break_seconds: number;
  shift_started_at?: string | null;
  on_break_started_at?: string | null;
  today_schedule: ShiftScheduleRead[];
};

export type EmployeeWorkDailyRead = {
  employee_id: number;
  employee_name: string;
  role: string;
  date: string;
  worked_seconds: number;
  break_seconds: number;
  worked_hms: string;
  break_hms: string;
};

type ClockEventRead = {
  id: number;
  employee_id: number;
  event_type: string;
  occurred_at: string;
  note?: string | null;
};

// Uses the same pattern your other API files likely follow
function getApiBase() {
  // Your backend prefixes are /api/... (mounted in main.py) :contentReference[oaicite:3]{index=3}
  const base = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
  return base.replace(/\/$/, "");
}

function getToken() {
  // Adjust these keys if your useAuth stores under a different name.
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
      // ignore json parse
    }
    throw new Error(msg);
  }

  // For safety even if backend returns empty sometimes
  const text = await res.text();
  return (text ? JSON.parse(text) : {}) as T;
}

export function getClockStatus() {
  return apiFetch<ClockStatusRead>("/employee/clock-status", { method: "GET" }); // :contentReference[oaicite:4]{index=4}
}

export function clockIn(note?: string) {
  return apiFetch<ClockEventRead>("/employee/clock-in", {
    method: "POST",
    body: JSON.stringify({ note: note || null }),
  }); // :contentReference[oaicite:5]{index=5}
}

export function breakStart(note?: string) {
  return apiFetch<ClockEventRead>("/employee/break-start", {
    method: "POST",
    body: JSON.stringify({ note: note || null }),
  }); // :contentReference[oaicite:6]{index=6}
}

export function breakEnd(note?: string) {
  return apiFetch<ClockEventRead>("/employee/break-end", {
    method: "POST",
    body: JSON.stringify({ note: note || null }),
  }); // :contentReference[oaicite:7]{index=7}
}

export function clockOut(note?: string) {
  return apiFetch<ClockEventRead>("/employee/clock-out", {
    method: "POST",
    body: JSON.stringify({ note: note || null }),
  }); // :contentReference[oaicite:8]{index=8}
}

export function getEmployeeDailyWorkReport(params?: { date?: string; employee_id?: number }) {
  const qs = new URLSearchParams();
  if (params?.date) qs.set("date", params.date);
  if (params?.employee_id != null) qs.set("employee_id", String(params.employee_id));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<EmployeeWorkDailyRead[]>(`/employee/work-time/daily${suffix}`, { method: "GET" });
}
