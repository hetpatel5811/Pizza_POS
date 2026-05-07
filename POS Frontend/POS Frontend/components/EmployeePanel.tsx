// components/EmployeePanel.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import {
  breakEnd,
  breakStart,
  clockIn,
  clockOut,
  getClockStatus,
  type ClockStatusRead,
} from "@/lib/api/employee";

/* ----------------------------- small utilities ---------------------------- */
function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatHMS(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`;
}

function fmtTime(dtIso?: string | null) {
  if (!dtIso) return "—";
  const d = new Date(dtIso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDateNice(d = new Date()) {
  return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}


function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/* Full-width shell: NO max-width = no left/right “empty space” on big displays */
const SHELL = "mx-auto w-full px-3 sm:px-6 lg:px-10 2xl:px-14";

type ScheduleItem = NonNullable<ClockStatusRead["today_schedule"]>[number];
type ScheduleId = ScheduleItem["id"];


/* ------------------------------- icons ----------------------------------- */
function Icon({
  name,
  className = "h-5 w-5",
}: {
  name:
    | "refresh"
    | "clock"
    | "calendar"
    | "play"
    | "stop"
    | "coffee"
    | "check"
    | "spark"
    | "shield";
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
    case "clock":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10z"
          />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v3M16 2v3" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h18" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 5h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"
          />
        </svg>
      );
    case "play":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 5v14l11-7L8 5z" />
        </svg>
      );
    case "stop":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10v10H7z" />
        </svg>
      );
    case "coffee":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h13v6a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 9h2a3 3 0 0 1 0 6h-2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v2M10 3v2M13 3v2" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 6 9 17l-5-5" />
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
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 14l.8 3.2L23 18l-3.2.8L19 22l-.8-3.2L15 18l3.2-.8L19 14z"
          />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 2l8 4v6c0 5-3.5 9.4-8 10-4.5-.6-8-5-8-10V6l8-4z"
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
function StatusPill({ state }: { state: ClockStatusRead["state"] | undefined }) {
  const meta =
    state === "ON_SHIFT"
      ? { label: "On shift", cls: "bg-emerald-500/15 text-emerald-950 ring-emerald-500/25", dot: "bg-emerald-500" }
      : state === "ON_BREAK"
        ? { label: "On break", cls: "bg-amber-500/15 text-amber-950 ring-amber-500/25", dot: "bg-amber-500" }
        : { label: "Off duty", cls: "bg-slate-500/10 text-slate-900 ring-slate-400/20", dot: "bg-slate-400" };

  return (
    <div className={cx("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold ring-1", meta.cls)}>
      <span className={cx("h-2 w-2 rounded-full", meta.dot)} />
      {meta.label}
    </div>
  );
}

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

function RingProgress({
  progress,
  label,
  sublabel,
}: {
  progress: number | null;
  label: string;
  sublabel?: string;
}) {
  const p = typeof progress === "number" ? Math.max(0, Math.min(1, progress)) : null;
  const size = 112;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = p === null ? c : c * (1 - p);

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <svg width={size} height={size} className="block">
          <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" strokeWidth={stroke} className="text-slate-200" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={dash}
            className="text-indigo-600 transition-[stroke-dashoffset] duration-500"
            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
          />
        </svg>

        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-xs font-semibold text-slate-500">{label}</div>
            <div className="mt-0.5 text-lg font-extrabold tabular-nums text-slate-900">{p === null ? "—" : `${Math.round(p * 100)}%`}</div>
          </div>
        </div>
      </div>

      <div className="min-w-0">
        <div className="text-sm font-extrabold text-slate-900">Shift progress</div>
        <div className="mt-1 text-sm text-slate-600">{sublabel ?? "Based on schedule start/end."}</div>
      </div>
    </div>
  );
}

function FancyActionButton({
  title,
  subtitle,
  icon,
  tone,
  disabled,
  busy,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon: "play" | "stop" | "coffee" | "check" | "spark" | "shield" | "refresh";
  tone: "emerald" | "rose" | "amber" | "cyan" | "indigo";
  disabled?: boolean;
  busy?: boolean;
  onClick: () => void;
}) {
  const toneMap: Record<typeof tone, string> = {
    emerald: "from-emerald-500 via-teal-500 to-sky-500",
    rose: "from-rose-500 via-pink-500 to-fuchsia-500",
    amber: "from-amber-500 via-orange-500 to-rose-500",
    cyan: "from-emerald-500 via-cyan-500 to-sky-500",
    indigo: "from-indigo-600 via-fuchsia-600 to-rose-600",
  };

  return (
    <button
      type="button"
      disabled={disabled || busy}
      aria-busy={busy ? "true" : "false"}
      onClick={onClick}
      className={cx(
        "group relative w-full overflow-hidden rounded-3xl p-[1px] text-left",
        "transition active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-slate-400/40 focus:ring-offset-2",
        (disabled || busy) && "opacity-60 cursor-not-allowed active:scale-100"
      )}
    >
      <div className={cx("absolute inset-0 bg-gradient-to-r", toneMap[tone])} />
      <div className="relative rounded-3xl bg-white/85 backdrop-blur-xl px-4 py-4">
        <div className="flex items-start gap-3">
          <div className={cx("grid h-11 w-11 place-items-center rounded-2xl text-white shadow-sm", "bg-gradient-to-br", toneMap[tone])}>
            {busy ? <Spinner className="h-5 w-5" /> : <Icon name={icon} className="h-5 w-5" />}
          </div>

          <div className="min-w-0">
            <div className="text-sm font-extrabold text-slate-900">{busy ? "Working…" : title}</div>
            <div className="mt-0.5 text-xs text-slate-600">{subtitle}</div>
          </div>

          <div className="ml-auto text-[11px] font-semibold text-slate-500">
            {disabled ? "Unavailable" : busy ? "…" : "Tap"}
          </div>
        </div>

        <div className="mt-3 h-px w-full bg-gradient-to-r from-slate-200 via-slate-100 to-transparent" />

        <div className="mt-3 text-xs text-slate-600">
          {disabled ? "This action is disabled for the current state." : "Fast, one-tap action. Updates live."}
        </div>
      </div>
    </button>
  );
}

/* --------------------------------- page ---------------------------------- */
export default function EmployeePanel() {
  const router = useRouter();
  const { logout } = useAuth();

  const [status, setStatus] = useState<ClockStatusRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<null | string>(null);
  const [err, setErr] = useState<string>("");

  // live timers without hammering API
  const lastSyncMsRef = useRef<number>(Date.now());
  const baseWorkedRef = useRef<number>(0);
  const baseBreakRef = useRef<number>(0);

  const [liveWorked, setLiveWorked] = useState(0);
  const [liveBreak, setLiveBreak] = useState(0);

  const [lastUpdatedText, setLastUpdatedText] = useState<string>("");
  const [nowText, setNowText] = useState<string>("");

  /* current clock in header */
  useEffect(() => {
    const tick = () => setNowText(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 1000 * 15);
    return () => clearInterval(id);
  }, []);

  async function refresh() {
    setErr("");
    setRefreshing(true);
    try {
      const s = await getClockStatus();

      setStatus(s);

      lastSyncMsRef.current = Date.now();
      baseWorkedRef.current = s.shift_seconds_worked || 0;
      baseBreakRef.current = s.break_seconds || 0;

      setLiveWorked(s.shift_seconds_worked || 0);
      setLiveBreak(s.break_seconds || 0);

      setLastUpdatedText(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await refresh();
      } catch (e: any) {
        setErr(e?.message || "Failed to load clock status");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // background polling (every 15s)
  useEffect(() => {
    const id = setInterval(() => {
      refresh().catch(() => {});
    }, 15000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 1-second live tick based on state
  useEffect(() => {
    const id = setInterval(() => {
      if (!status) return;

      const elapsed = Math.floor((Date.now() - lastSyncMsRef.current) / 1000);

      if (status.state === "ON_SHIFT") {
        setLiveWorked(baseWorkedRef.current + elapsed);
        setLiveBreak(baseBreakRef.current);
      } else if (status.state === "ON_BREAK") {
        setLiveWorked(baseWorkedRef.current);
        setLiveBreak(baseBreakRef.current + elapsed);
      } else {
        // OFF_DUTY: keep last known totals (don’t drop to 00:00:00)
        setLiveWorked(baseWorkedRef.current);
        setLiveBreak(baseBreakRef.current);
      }
    }, 1000);

    return () => clearInterval(id);
  }, [status]);

  // Toggle-style actions:
  // - Clock button flips between Clock In and Clock Out based on state
  // - Break button flips between Break Start and Break End based on state
  const isOffDuty = status?.state === "OFF_DUTY";
  const isOnShift = status?.state === "ON_SHIFT";
  const isOnBreak = status?.state === "ON_BREAK";

  const canClockToggle = isOffDuty || isOnShift; // blocked while on break
  const canBreakToggle = isOnShift || isOnBreak;

  // ✅ Inventory enabled only after clock-in (ON_SHIFT or ON_BREAK)
  const canInventory = isOnShift || isOnBreak;

  const headline = useMemo(() => {
    if (!status) return "";
    if (status.state === "OFF_DUTY") return "Off duty";
    if (status.state === "ON_BREAK") return "On break";
    return "On shift";
  }, [status]);

  const todayNice = useMemo(() => fmtDateNice(), []);

  const schedule = status?.today_schedule ?? [];


  const scheduleInsights = useMemo(() => {
    if (!schedule.length) {
      return {
        activeId: null as ScheduleId | null,
        upcomingId: null as ScheduleId | null,
        progress: null as number | null,
      };
    }

    const now = Date.now();
    const withMs = schedule.map((s) => ({
      ...s,
      startMs: new Date(s.start_dt).getTime(),
      endMs: new Date(s.end_dt).getTime(),
    }));

    const active = withMs.find((s) => now >= s.startMs && now <= s.endMs) || null;
    const upcoming = withMs.filter((s) => s.startMs > now).sort((a, b) => a.startMs - b.startMs)[0] || null;

    let progress: number | null = null;
    if (active) {
      const total = Math.max(1, active.endMs - active.startMs);
      const done = Math.min(total, Math.max(0, now - active.startMs));
      progress = done / total;
    }

    const activeLabel = active
      ? `Active: ${fmtTime(active.start_dt)} – ${fmtTime(active.end_dt)}`
      : upcoming
        ? `Next: ${fmtTime(upcoming.start_dt)} – ${fmtTime(upcoming.end_dt)}`
        : "No more shifts today";

    return {
      activeId: (active?.id ?? null) as ScheduleId | null,
      upcomingId: (upcoming?.id ?? null) as ScheduleId | null,
      progress,
      activeLabel,
    };
  }, [schedule]);


  async function doAction(label: string, fn: () => Promise<any>) {
    try {
      setErr("");
      setActionLoading(label);
      await fn();
      await refresh();

      // after any action, also push cache so it never “drops”
    } catch (e: any) {
      setErr(e?.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-[radial-gradient(1200px_circle_at_20%_0%,rgba(99,102,241,0.20),transparent_55%),radial-gradient(900px_circle_at_80%_10%,rgba(236,72,153,0.18),transparent_50%),radial-gradient(900px_circle_at_60%_100%,rgba(16,185,129,0.16),transparent_55%)]">
        <div className={cx(SHELL, "py-10")}>
          <div className="h-10 w-72 rounded-2xl bg-white/50 ring-1 ring-white/40 animate-pulse" />
          <div className="mt-3 h-4 w-96 rounded-2xl bg-white/45 ring-1 ring-white/40 animate-pulse" />
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 h-[360px] rounded-3xl bg-white/45 ring-1 ring-white/40 animate-pulse" />
            <div className="lg:col-span-4 h-[360px] rounded-3xl bg-white/45 ring-1 ring-white/40 animate-pulse" />
            <div className="lg:col-span-12 h-[280px] rounded-3xl bg-white/45 ring-1 ring-white/40 animate-pulse" />
          </div>
          <div className="mt-6 text-sm font-semibold text-slate-700">Loading…</div>
        </div>
      </div>
    );
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
                      <Icon name="spark" className="h-5 w-5" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Employee Panel</h1>
                  </div>

                  <StatusPill state={status?.state} />

                  <div className="hidden sm:flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-white/50">
                    <Icon name="clock" className="h-4 w-4" />
                    {todayNice}
                    <span className="mx-1 text-slate-300">•</span>
                    {nowText || "—"}
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-700">
                  <span className="font-semibold">{headline}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600">Last updated:</span>
                  <span className="font-semibold text-slate-900">{lastUpdatedText || "—"}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600">{(scheduleInsights as any).activeLabel}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => refresh().catch(() => {})}
                  className={cx(
                    "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-extrabold text-white shadow-sm",
                    "bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-rose-600 hover:brightness-[1.03]",
                    "focus:outline-none focus:ring-2 focus:ring-slate-400/40 focus:ring-offset-2"
                  )}
                >
                  {refreshing ? <Spinner className="h-4 w-4" /> : <Icon name="refresh" className="h-4 w-4" />}
                  Refresh
                </button>

                <button
                  type="button"
                  onClick={logout}
                  className={cx(
                    "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-extrabold text-white shadow-sm",
                    "bg-gradient-to-r from-slate-700 to-slate-900 hover:brightness-[1.03]",
                    "focus:outline-none focus:ring-2 focus:ring-slate-400/40 focus:ring-offset-2"
                  )}
                >
                  Logout
                </button>

                <div className="hidden md:flex items-center gap-2 rounded-2xl bg-white/70 px-3 py-2 ring-1 ring-white/50">
                  <Icon name="shield" className="h-4 w-4 text-slate-600" />
                  <div className="text-xs font-semibold text-slate-700">
                    Clock out blocked on break
                    <div className="text-[11px] font-medium text-slate-500">Prevents wrong totals</div>
                  </div>
                </div>
              </div>
            </div>

            {err ? (
              <div className="mt-4 rounded-2xl border border-red-200/70 bg-red-50/80 px-4 py-3 text-sm text-red-800">
                {err}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main dashboard */}
      <main className={cx(SHELL, "py-8")}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Live shift hero + actions */}
          <div className="lg:col-span-8 space-y-6">
            <GlassPanel className="p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                    <Icon name="clock" className="h-4 w-4" />
                    Live totals (today)
                  </div>

                  <div className="mt-2 flex flex-wrap items-end gap-x-8 gap-y-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-600">Worked</div>
                      <div className="mt-1 text-5xl sm:text-6xl font-extrabold tracking-tight tabular-nums text-slate-900">
                        {formatHMS(liveWorked)}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-slate-600">Break</div>
                      <div className="mt-1 text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-slate-900">
                        {formatHMS(liveBreak)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-white/70 ring-1 ring-white/50 px-4 py-3">
                      <div className="text-xs font-semibold text-slate-500">Shift started</div>
                      <div className="mt-1 font-extrabold tabular-nums text-slate-900">{fmtTime(status?.shift_started_at)}</div>
                    </div>
                    <div className="rounded-2xl bg-white/70 ring-1 ring-white/50 px-4 py-3">
                      <div className="text-xs font-semibold text-slate-500">Break started</div>
                      <div className="mt-1 font-extrabold tabular-nums text-slate-900">{fmtTime(status?.on_break_started_at)}</div>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  <RingProgress progress={(scheduleInsights as any).progress} label="Progress" sublabel={(scheduleInsights as any).activeLabel} />
                </div>
              </div>
            </GlassPanel>

            <GlassPanel className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Quick actions</h2>
                  <p className="mt-1 text-sm text-slate-600">Big buttons, clear states, no confusion.</p>
                </div>

                <div className="hidden sm:flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-white/50">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FancyActionButton
                  title={isOffDuty ? "Clock In" : "Clock Out"}
                  subtitle={
                    isOffDuty
                      ? "Start your shift"
                      : isOnBreak
                        ? "End break first"
                        : "End shift (not on break)"
                  }
                  icon={isOffDuty ? "play" : "stop"}
                  tone={isOffDuty ? "emerald" : "rose"}
                  disabled={!canClockToggle || !!actionLoading}
                  busy={actionLoading === "clock-in" || actionLoading === "clock-out"}
                  onClick={() =>
                    isOffDuty
                      ? doAction("clock-in", () => clockIn())
                      : doAction("clock-out", () => clockOut())
                  }
                />
                <FancyActionButton
                  title={isOnBreak ? "Break End" : "Break Start"}
                  subtitle={isOnBreak ? "Resume worked timer" : "Pause worked timer"}
                  icon={isOnBreak ? "check" : "coffee"}
                  tone={isOnBreak ? "cyan" : "amber"}
                  disabled={!canBreakToggle || !!actionLoading}
                  busy={actionLoading === "break-start" || actionLoading === "break-end"}
                  onClick={() =>
                    isOnBreak
                      ? doAction("break-end", () => breakEnd())
                      : doAction("break-start", () => breakStart())
                  }
                />

                {/* ✅ Inventory button (enabled only when clocked-in) */}
                <FancyActionButton
                  title="Menu"
                  subtitle="Add / edit pizzas & deals"
                  icon="spark"
                  tone="emerald"
                  disabled={!canInventory || !!actionLoading}
                  busy={false}
                  onClick={() => router.push("/POS/menu")}
                />
                <FancyActionButton
                  title="Order"
                  subtitle="Create dine-in / takeaway order"
                  icon="shield"
                  tone="indigo"
                  disabled={!canInventory || !!actionLoading}
                  busy={false}
                  onClick={() => router.push("/POS/orders")}
                />
                <FancyActionButton
                  title="All Orders"
                  subtitle="Queue + cash approvals together"
                  icon="refresh"
                  tone="cyan"
                  disabled={!canInventory || !!actionLoading}
                  busy={false}
                  onClick={() => router.push("/POS/all-orders")}
                />
              </div>
            </GlassPanel>
          </div>

          {/* RIGHT: Schedule timeline */}
          <div className="lg:col-span-4">
            <GlassPanel className="p-6 h-full">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-rose-600 text-white shadow-sm">
                  <Icon name="calendar" className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-extrabold text-slate-900">Today???s schedule</h2>
                  <p className="mt-1 text-sm text-slate-600">Timeline view (cleaner than tables).</p>
                </div>
              </div>

              <div className="mt-6">
                {schedule.length ? (
                  <div className="space-y-3">
                    {schedule.map((s) => {
                      const isActive = (scheduleInsights as any).activeId === s.id;
                      const isUpcoming = !isActive && (scheduleInsights as any).upcomingId === s.id;

                      return (
                        <div
                          key={String(s.id)}
                          className={cx(
                            "relative overflow-hidden rounded-3xl p-[1px]",
                            isActive
                              ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500"
                              : isUpcoming
                                ? "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500"
                                : "bg-gradient-to-r from-slate-200 via-slate-100 to-transparent"
                          )}
                        >
                          <div className="rounded-3xl bg-white/80 backdrop-blur-xl px-4 py-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-slate-500">Time</div>
                                <div className="mt-1 font-extrabold tabular-nums text-slate-900">
                                  {fmtTime(s.start_dt)} ??? {fmtTime(s.end_dt)}
                                </div>

                                <div className="mt-3 grid grid-cols-1 gap-2">
                                  <div className="text-sm">
                                    <span className="text-slate-500">Role:</span>{" "}
                                    <span className="font-semibold text-slate-900">{s.role_label ?? "???"}</span>
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-slate-500">Note:</span>{" "}
                                    <span className="text-slate-700">{s.note ?? "???"}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0">
                                {isActive ? (
                                  <span className="inline-flex items-center rounded-full bg-emerald-600 px-3 py-1 text-xs font-extrabold text-white">
                                    Active
                                  </span>
                                ) : isUpcoming ? (
                                  <span className="inline-flex items-center rounded-full bg-amber-600 px-3 py-1 text-xs font-extrabold text-white">
                                    Next
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-xs font-extrabold text-slate-700">
                                    Scheduled
                                  </span>
                                )}
                              </div>
                            </div>

                            {isActive ? (
                              <div className="mt-4">
                                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 transition-[width] duration-500"
                                    style={{ width: `${Math.round(((scheduleInsights as any).progress ?? 0) * 100)}%` }}
                                  />
                                </div>
                                <div className="mt-2 text-xs font-semibold text-slate-600">
                                  {Math.round(((scheduleInsights as any).progress ?? 0) * 100)}% done
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-3xl bg-white/70 ring-1 ring-white/50 px-5 py-8">
                    <div className="text-sm font-extrabold text-slate-900">No shifts scheduled for today.</div>
                    <div className="mt-1 text-sm text-slate-600">If this looks wrong, hit refresh or check schedule source.</div>
                  </div>
                )}
              </div>
            </GlassPanel>
          </div>
        </div>

      </main>
    </div>
  );
}
