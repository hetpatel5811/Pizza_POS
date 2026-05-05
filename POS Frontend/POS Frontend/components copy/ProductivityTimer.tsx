"use client";

import { useEffect, useMemo, useState } from "react";
import { startSession, heartbeat } from "@/lib/api/productivity";

function formatHHMMSS(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function ProductivityTimer({ token }: { token: string }) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState("");

  // start session once (idempotent)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const data = await startSession(token);
        const ms = new Date(data.started_at).getTime();
        if (alive) setStartedAt(ms);
      } catch (e: any) {
        if (alive) setError(e?.message || "Failed to start session");
      }
    })();

    return () => {
      alive = false;
    };
  }, [token]);

  // UI tick
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // heartbeat every 60 seconds
  useEffect(() => {
    const t = setInterval(() => {
      heartbeat(token).catch(() => {});
    }, 60000);
    return () => clearInterval(t);
  }, [token]);

  const elapsed = useMemo(() => {
    if (!startedAt) return 0;
    return Math.max(0, Math.floor((now - startedAt) / 1000));
  }, [now, startedAt]);

  return (
    <div className="border rounded p-3">
      <div className="text-sm opacity-70">Productivity</div>
      <div className="text-2xl font-semibold">{formatHHMMSS(elapsed)}</div>
      {error && <div className="text-xs text-red-600 mt-2">{error}</div>}
    </div>
  );
}
