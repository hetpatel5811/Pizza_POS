"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  ChefHat,
  Clock,
  Flame,
  MapPin,
  Package,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { getCustomerOrder, type CustomerOrderRead } from "@/lib/api/customerOrders";

const PIZZA_MAKING_TOTAL_SECONDS = 15 * 60;

const PIZZA_STEPS = [
  {
    key: "placed",
    label: "Order received",
    description: "Order reached our kitchen.",
    startMinute: 0,
    icon: "store",
  },
  {
    key: "preparing",
    label: "Preparing pizza",
    description: "Dough, sauce, and toppings are being set.",
    startMinute: 3,
    icon: "chef",
  },
  {
    key: "baking",
    label: "Baking in oven",
    description: "Pizza is in the oven (burning/baking stage).",
    startMinute: 6,
    icon: "flame",
  },
  {
    key: "finishing",
    label: "Final quality check",
    description: "Slicing, boxing, and handoff prep.",
    startMinute: 9,
    icon: "check",
  },
  {
    key: "ready",
    label: "Ready",
    description: "Ready for pickup or dispatch.",
    startMinute: 12,
    icon: "package",
  },
] as const;

const POLL_INTERVAL_MS = 4000;

type StepIcon = (typeof PIZZA_STEPS)[number]["icon"];

function normalizeStatus(status?: string | null) {
  return String(status || "").trim().toLowerCase();
}

function titleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatCountdown(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(safe / 60)).padStart(2, "0");
  const ss = String(safe % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function formatTime(value: string | number | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function backendProgressFloor(status: string) {
  switch (status) {
    case "pending":
      return 0;
    case "confirmed":
    case "preparing":
      return 1;
    case "baking":
      return 2;
    case "ready":
    case "out_for_delivery":
    case "delivered":
      return PIZZA_STEPS.length - 1;
    default:
      return 0;
  }
}

function renderStatusBadge(status: string) {
  const key = normalizeStatus(status);
  const base = "px-3 py-1 rounded-full text-sm font-semibold";

  if (key === "pending") {
    return <span className={`${base} bg-indigo-100 text-indigo-700`}>Waiting For Approval</span>;
  }
  if (["confirmed", "preparing", "baking"].includes(key)) {
    return <span className={`${base} bg-amber-100 text-amber-800`}>{titleCase(key)}</span>;
  }
  if (["ready", "out_for_delivery", "delivered"].includes(key)) {
    return <span className={`${base} bg-emerald-100 text-emerald-700`}>{titleCase(key)}</span>;
  }
  if (["cancelled", "canceled"].includes(key)) {
    return <span className={`${base} bg-rose-100 text-rose-700`}>Cancelled</span>;
  }
  return <span className={`${base} bg-muted text-foreground`}>{titleCase(key || "processing")}</span>;
}

function renderStepIcon(iconType: StepIcon, complete: boolean) {
  const iconClass = complete ? "text-white" : "text-muted-foreground";
  switch (iconType) {
    case "store":
      return <Store className={`w-5 h-5 ${iconClass}`} />;
    case "chef":
      return <ChefHat className={`w-5 h-5 ${iconClass}`} />;
    case "flame":
      return <Flame className={`w-5 h-5 ${iconClass}`} />;
    case "check":
      return <CheckCircle2 className={`w-5 h-5 ${iconClass}`} />;
    default:
      return <Package className={`w-5 h-5 ${iconClass}`} />;
  }
}

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const queryOrderId = searchParams.get("orderId") || "";

  const [orderId, setOrderId] = useState(queryOrderId);
  const [hasSearched, setHasSearched] = useState(Boolean(queryOrderId));
  const [loading, setLoading] = useState(Boolean(queryOrderId));
  const [lookupError, setLookupError] = useState("");
  const [orderData, setOrderData] = useState<CustomerOrderRead | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [timerStartMs, setTimerStartMs] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);

  const pollInFlightRef = useRef(false);
  const lastOrderNumberRef = useRef("");

  useEffect(() => {
    const intervalId = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const trackOrderById = useCallback(async (rawOrderId: string) => {
    const normalized = rawOrderId.trim().toUpperCase();
    if (!normalized) return;

    setOrderId(normalized);
    setHasSearched(true);
    setLoading(true);
    setLookupError("");

    try {
      const data = await getCustomerOrder(normalized);
      setOrderData(data);
      setLastSyncAt(new Date());
    } catch (error) {
      const msg = error instanceof Error && error.message ? error.message : "Unable to find this order right now.";
      setLookupError(msg);
      setOrderData(null);
      setTimerStartMs(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!queryOrderId) return;
    void trackOrderById(queryOrderId);
  }, [queryOrderId, trackOrderById]);

  useEffect(() => {
    if (!orderData?.order_number) return;

    const status = normalizeStatus(orderData.status);
    const orderChanged = lastOrderNumberRef.current !== orderData.order_number;

    if (orderChanged) {
      lastOrderNumberRef.current = orderData.order_number;
      setTimerStartMs(null);
    }

    const isPending = status === "pending";
    const isCancelled = status === "cancelled" || status === "canceled";
    const isTerminal = ["ready", "out_for_delivery", "delivered"].includes(status);
    const now = Date.now();

    if (isPending || isCancelled) {
      setTimerStartMs(null);
      return;
    }

    if (isTerminal) {
      setTimerStartMs((prev) => (orderChanged || prev === null ? now - PIZZA_MAKING_TOTAL_SECONDS * 1000 : prev));
      return;
    }

    setTimerStartMs((prev) => (orderChanged || prev === null ? now : prev));
  }, [orderData?.order_number, orderData?.status]);

  useEffect(() => {
    if (!orderData?.order_number) return;

    const intervalId = window.setInterval(async () => {
      if (pollInFlightRef.current) return;
      pollInFlightRef.current = true;
      setIsSyncing(true);

      try {
        const fresh = await getCustomerOrder(orderData.order_number);
        setOrderData(fresh);
        setLastSyncAt(new Date());
      } catch {
        // Keep current state on transient poll failures
      } finally {
        pollInFlightRef.current = false;
        setIsSyncing(false);
      }
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [orderData?.order_number]);

  const tracking = useMemo(() => {
    if (!orderData) return null;

    const status = normalizeStatus(orderData.status);
    const pending = status === "pending";
    const cancelled = status === "cancelled" || status === "canceled";
    const terminalReady = ["ready", "out_for_delivery", "delivered"].includes(status);

    const elapsedSecondsRaw =
      timerStartMs == null ? 0 : Math.max(0, Math.floor((nowMs - timerStartMs) / 1000));
    const elapsedSeconds = pending ? 0 : cancelled ? 0 : terminalReady ? PIZZA_MAKING_TOTAL_SECONDS : elapsedSecondsRaw;
    const remainingSeconds = pending
      ? PIZZA_MAKING_TOTAL_SECONDS
      : cancelled
        ? 0
        : Math.max(0, PIZZA_MAKING_TOTAL_SECONDS - elapsedSeconds);
    const elapsedMinutes = elapsedSeconds / 60;

    let timelineProgressIndex = 0;
    PIZZA_STEPS.forEach((step, index) => {
      if (elapsedMinutes >= step.startMinute) timelineProgressIndex = index;
    });

    const progressFloor = backendProgressFloor(status);
    const progressIndex = pending ? 0 : cancelled ? 0 : Math.max(timelineProgressIndex, progressFloor);
    const progressPercent = Math.max(
      0,
      Math.min(100, pending ? 0 : ((PIZZA_MAKING_TOTAL_SECONDS - remainingSeconds) / PIZZA_MAKING_TOTAL_SECONDS) * 100)
    );

    const steps = PIZZA_STEPS.map((step, index) => {
      const complete = pending ? index === 0 : cancelled ? index === 0 : index <= progressIndex;
      return {
        ...step,
        complete,
      };
    });

    return {
      status,
      pending,
      cancelled,
      remainingSeconds,
      progressPercent,
      steps,
    };
  }, [orderData, nowMs, timerStartMs]);

  const handleTrack = () => {
    if (!orderId.trim()) return;
    void trackOrderById(orderId);
  };

  const orderTypeLabel = orderData ? titleCase(orderData.order_type) : "";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12 bg-muted/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="font-heading font-bold text-3xl md:text-4xl mb-8 text-center">Track Your Order</h1>

          {!hasSearched ? (
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Enter Order Number</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orderId">Order Number</Label>
                  <Input
                    id="orderId"
                    placeholder="e.g., ORD2605051545018F3A"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                  />
                </div>
                <Button
                  size="lg"
                  className="w-full bg-primary hover:bg-primary-hover"
                  onClick={handleTrack}
                  disabled={!orderId.trim() || loading}
                >
                  {loading ? "Tracking..." : "Track Order"}
                </Button>
              </CardContent>
            </Card>
          ) : loading ? (
            <Card className="max-w-md mx-auto">
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
                <p className="text-sm text-muted-foreground mt-3">Loading order status...</p>
              </CardContent>
            </Card>
          ) : orderData && tracking ? (
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Order Number</p>
                      <p className="font-heading font-bold text-2xl">{orderData.order_number}</p>
                      <div className="mt-2">{renderStatusBadge(orderData.status)}</div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {tracking.pending
                          ? "Waiting for employee approval. Timer starts automatically after approval."
                          : "Your order is in progress. Live updates every 4 seconds."}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 bg-accent/10 px-4 py-2 rounded-lg">
                      <Clock className="w-5 h-5 text-accent" />
                      <div>
                        <p className="text-xs text-muted-foreground">15-Min Pizza Timer</p>
                        <p className="font-semibold tabular-nums">
                          {tracking.cancelled ? "Stopped" : formatCountdown(tracking.remainingSeconds)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {isSyncing ? "Syncing..." : "Auto-sync on"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {lastSyncAt
                            ? `Updated ${lastSyncAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                            : "Waiting for first sync"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span>Pizza progress</span>
                      <span>{Math.round(tracking.progressPercent)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-accent transition-[width] duration-700"
                        style={{ width: `${tracking.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-primary" />
                      Pizza Making Process
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {tracking.steps.map((step, index) => (
                      <div key={step.key} className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            step.complete ? "bg-accent" : "bg-muted"
                          }`}
                        >
                          {renderStepIcon(step.icon, step.complete)}
                        </div>
                        <div className="flex-1">
                          <p className={`font-semibold ${step.complete ? "text-foreground" : "text-muted-foreground"}`}>
                            {index + 1}. {step.label}
                          </p>
                          <p className="text-xs text-muted-foreground">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {orderData.order_type === "delivery" ? (
                        <MapPin className="w-5 h-5 text-primary" />
                      ) : orderData.order_type === "pickup" ? (
                        <Store className="w-5 h-5 text-primary" />
                      ) : (
                        <UtensilsCrossed className="w-5 h-5 text-primary" />
                      )}
                      {orderTypeLabel} Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between gap-4">
                      <span className="text-sm text-muted-foreground">Created</span>
                      <span className="text-sm font-medium">{formatTime(orderData.created_at)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-sm text-muted-foreground">Payment</span>
                      <span className="text-sm font-medium">{titleCase(orderData.payment_method)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-sm text-muted-foreground">Payment Status</span>
                      <span className="text-sm font-medium">{titleCase(orderData.payment_status)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-sm text-muted-foreground">Total</span>
                      <span className="text-sm font-bold">${Number(orderData.total || 0).toFixed(2)}</span>
                    </div>

                    {orderData.order_type === "delivery" && (
                      <div className="rounded-lg bg-muted/40 p-3">
                        <p className="text-xs text-muted-foreground mb-1">Delivery Address</p>
                        <p className="text-sm font-medium">{orderData.delivery_address || "No address provided"}</p>
                        {orderData.delivery_instructions ? (
                          <p className="text-xs text-muted-foreground mt-2">
                            Note: {orderData.delivery_instructions}
                          </p>
                        ) : null}
                      </div>
                    )}

                    {orderData.order_type === "pickup" && (
                      <div className="rounded-lg bg-muted/40 p-3 text-sm">
                        Pickup will be ready once pizza process reaches <span className="font-semibold">Ready</span>.
                      </div>
                    )}

                    {orderData.order_type === "dine_in" && (
                      <div className="rounded-lg bg-muted/40 p-3 text-sm">
                        {orderData.table_number ? (
                          <>
                            Table: <span className="font-semibold">{orderData.table_number}</span>
                          </>
                        ) : (
                          "Table number not assigned"
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {orderData.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start gap-4 border-b pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-semibold">{item.menu_item_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {titleCase(item.size)} - Qty: {item.quantity}
                        </p>
                        {item.special_instructions ? (
                          <p className="text-xs text-muted-foreground mt-1">Note: {item.special_instructions}</p>
                        ) : null}
                      </div>
                      <p className="font-semibold">${Number(item.total_price || 0).toFixed(2)}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => {
                  setHasSearched(false);
                  setOrderData(null);
                  setLookupError("");
                  setOrderId("");
                  setTimerStartMs(null);
                  setIsSyncing(false);
                  setLastSyncAt(null);
                }}
              >
                Track Another Order
              </Button>
            </div>
          ) : (
            <Card className="max-w-md mx-auto">
              <CardContent className="p-6 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-heading font-bold text-xl mb-2">Order Not Found</h3>
                <p className="text-muted-foreground mb-2">
                  We couldn't find an order with ID: <strong>{orderId}</strong>
                </p>
                {lookupError ? <p className="text-xs text-rose-600 mb-4">{lookupError}</p> : null}
                <Button
                  variant="outline"
                  onClick={() => {
                    setHasSearched(false);
                    setLookupError("");
                    setOrderId("");
                    setTimerStartMs(null);
                    setIsSyncing(false);
                    setLastSyncAt(null);
                  }}
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}
