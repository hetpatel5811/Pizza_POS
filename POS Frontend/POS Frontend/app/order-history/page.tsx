"use client"

import { useEffect, useMemo, useState } from "react"
import { Clock, MapPin, Package, Phone, Search, Store, UtensilsCrossed, CheckCircle2, Loader2 } from "lucide-react"

import { BackButton } from "@/components/back-button"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { OrderReceiptModal } from "@/components/order-receipt-modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import useAuth from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { listCustomerOrders, type CustomerOrderRead } from "@/lib/api/customerOrders"
import { useCart } from "@/lib/cart-context"
import { getPizzaImageByName } from "@/lib/customer-images"

type ReceiptOrder = {
  id: string
  date: string
  time: string
  items: {
    name: string
    size?: string
    qty: number
    price: number
  }[]
  total: number
  status: string
  deliveryAddress: string
  phone: string
  paymentMethod?: string
  subtotal?: number
  tax?: number
  deliveryFee?: number
}

function formatOrderDateTime(timestamp: string) {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) {
    return { date: "Unknown date", time: "Unknown time" }
  }

  return {
    date: date.toLocaleDateString("en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    time: date.toLocaleTimeString("en-CA", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }
}

function getStatusColor(status: string) {
  const normalized = status.toLowerCase()

  if (["delivered", "completed"].includes(normalized)) {
    return "bg-green-100 text-green-700 border-green-300"
  }

  if (["pending", "placed"].includes(normalized)) {
    return "bg-amber-100 text-amber-700 border-amber-300"
  }

  if (["declined", "cancelled"].includes(normalized)) {
    return "bg-rose-100 text-rose-700 border-rose-300"
  }

  return "bg-blue-100 text-blue-700 border-blue-300"
}

function toTitleCase(input: string) {
  return input
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function OrderHistoryPage() {
  const { user } = useAuth()
  const { addItem } = useCart()
  const { toast } = useToast()

  const [searchQuery, setSearchQuery] = useState("")
  const [orders, setOrders] = useState<CustomerOrderRead[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [selectedOrder, setSelectedOrder] = useState<ReceiptOrder | null>(null)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)

  useEffect(() => {
    let active = true

    const loadOrders = async () => {
      if (!user) {
        setOrders([])
        setLoadError("Please sign in to view your order history.")
        setLoadingOrders(false)
        return
      }

      try {
        setLoadingOrders(true)
        setLoadError(null)
        const data = await listCustomerOrders({ limit: 200 })
        if (!active) return

        const sorted = [...(Array.isArray(data) ? data : [])].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        setOrders(sorted)
      } catch (error) {
        if (!active) return
        const message = error instanceof Error ? error.message : "Unable to load orders right now."
        setLoadError(message)
        setOrders([])
      } finally {
        if (active) setLoadingOrders(false)
      }
    }

    loadOrders()

    return () => {
      active = false
    }
  }, [user])

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return orders

    return orders.filter(
      (order) =>
        order.order_number.toLowerCase().includes(query) ||
        order.items.some((item) => item.menu_item_name.toLowerCase().includes(query))
    )
  }, [orders, searchQuery])

  const handleReorder = (order: CustomerOrderRead) => {
    order.items.forEach((item) => {
      const unitPrice = Number(item.unit_price || 0)
      addItem({
        id: `${item.menu_item_id}-${item.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        menuItemId: item.menu_item_id,
        name: item.menu_item_name,
        price: unitPrice,
        size: (item.size || "medium").toLowerCase(),
        quantity: Math.max(1, Number(item.quantity || 1)),
        image: getPizzaImageByName(item.menu_item_name),
        customizations: {
          crust: item.crust || undefined,
          sauce: item.sauce || undefined,
          extraCheese: Boolean(item.extra_cheese),
          extraSauce: Boolean(item.extra_sauce),
          specialInstructions: item.special_instructions || undefined,
        },
      })
    })

    toast({
      title: "Reorder ready",
      description: `${order.items.length} items from ${order.order_number} were added to your cart.`,
    })
  }

  const handleViewReceipt = (order: CustomerOrderRead) => {
    const dateTime = formatOrderDateTime(order.created_at)

    const receiptPayload: ReceiptOrder = {
      id: order.order_number,
      date: dateTime.date,
      time: dateTime.time,
      items: order.items.map((item) => ({
        name: item.menu_item_name,
        size: item.size,
        qty: item.quantity,
        price: item.total_price,
      })),
      total: Number(order.total || 0),
      status: order.status,
      deliveryAddress:
        order.order_type === "delivery"
          ? order.delivery_address || "No delivery address available"
          : "Fresh & Hot Pizza, 123 Pizza Street, Sturlings, Canada",
      phone: order.customer_phone,
      paymentMethod: toTitleCase(order.payment_method || "cash"),
      subtotal: Number(order.subtotal || 0),
      tax: Number(order.tax || 0),
      deliveryFee: Number(order.delivery_fee || 0),
    }

    setSelectedOrder(receiptPayload)
    setIsReceiptOpen(true)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <BackButton />

          <div className="mb-8">
            <h1 className="mb-3 font-heading text-4xl font-bold md:text-5xl">Your Orders</h1>
            <p className="text-lg text-muted-foreground">Live history from your real customer orders.</p>
          </div>

          <div className="mb-8 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search orders by number or pizza name..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-12 pl-10"
              />
            </div>
          </div>

          {loadingOrders ? (
            <div className="flex items-center justify-center gap-2 py-14 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading your orders...
            </div>
          ) : loadError ? (
            <div className="rounded-2xl border border-dashed bg-background p-10 text-center">
              <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <p className="mb-2 text-xl font-semibold">Unable to show orders</p>
              <p className="text-muted-foreground">{loadError}</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-background p-10 text-center">
              <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <p className="mb-2 text-xl font-semibold">No matching orders found</p>
              <p className="text-muted-foreground">Try a different search term.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order) => {
                const dateTime = formatOrderDateTime(order.created_at)
                const statusClass = getStatusColor(order.status)

                return (
                  <article
                    key={order.order_number}
                    className="overflow-hidden rounded-2xl border bg-background shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="border-b bg-gradient-to-r from-primary/5 to-secondary/5 p-4 md:p-6">
                      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div>
                          <div className="mb-2 flex flex-wrap items-center gap-3">
                            <h3 className="font-heading text-xl font-bold">{order.order_number}</h3>
                            <Badge variant="outline" className={statusClass}>
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="capitalize">{order.status}</span>
                              </span>
                            </Badge>
                            <Badge variant="secondary">{toTitleCase(order.order_type)}</Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {dateTime.date} at {dateTime.time}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="mb-1 text-sm text-muted-foreground">Total</p>
                          <p className="font-heading text-2xl font-bold text-primary">${Number(order.total || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 md:p-6">
                      <h4 className="mb-3 font-semibold">Order Items</h4>
                      <div className="mb-4 space-y-2">
                        {order.items.map((item, index) => (
                          <div key={`${order.order_number}-${item.id}-${index}`} className="flex items-center justify-between border-b py-2 last:border-0">
                            <div>
                              <p className="font-medium">
                                {item.menu_item_name} {item.size ? `(${item.size})` : ""}
                              </p>
                              <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                            </div>
                            <p className="font-semibold">${Number(item.total_price || 0).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2 rounded-lg bg-muted/50 p-4">
                        {order.order_type === "delivery" ? (
                          <>
                            <div className="flex items-start gap-2">
                              <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">Delivery Address</p>
                                <p className="text-sm text-muted-foreground">
                                  {order.delivery_address || "Address not available"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">Contact Number</p>
                                <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                              </div>
                            </div>
                          </>
                        ) : order.order_type === "pickup" ? (
                          <div className="flex items-start gap-2">
                            <Store className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Pickup Order</p>
                              <p className="text-sm text-muted-foreground">Fresh & Hot Pizza, Sturlings, Canada</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <UtensilsCrossed className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Dine In</p>
                              <p className="text-sm text-muted-foreground">Table: {order.table_number || "Not available"}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex gap-3">
                        <Button variant="outline" className="flex-1 bg-transparent" onClick={() => handleReorder(order)}>
                          Reorder
                        </Button>
                        <Button variant="outline" className="flex-1 bg-transparent" onClick={() => handleViewReceipt(order)}>
                          View Receipt
                        </Button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />

      <OrderReceiptModal isOpen={isReceiptOpen} onClose={() => setIsReceiptOpen(false)} order={selectedOrder} />
    </div>
  )
}
