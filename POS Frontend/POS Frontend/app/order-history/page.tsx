"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Clock, Search, MapPin, Phone, Package, CheckCircle2 } from "lucide-react"
import { BackButton } from "@/components/back-button"
import { useCart } from "@/lib/cart-context"
import { OrderReceiptModal } from "@/components/order-receipt-modal"
import { useToast } from "@/hooks/use-toast"

export default function OrderHistoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const { addItem } = useCart()
  const { toast } = useToast()

  const orders = [
    {
      id: "ORD-2024-1234",
      date: "December 15, 2024",
      time: "7:45 PM",
      items: [
        { name: "Pepperoni Pizza", size: "Large", qty: 1, price: 18.99 },
        { name: "BBQ Chicken Pizza", size: "Medium", qty: 1, price: 16.99 },
        { name: "Buffalo Wings", qty: 1, price: 10.0 },
      ],
      total: 45.98,
      status: "delivered",
      deliveryAddress: "123 Main St, Toronto, ON M5V 3A8",
      phone: "+1 (555) 123-4567",
    },
    {
      id: "ORD-2024-1233",
      date: "December 10, 2024",
      time: "6:30 PM",
      items: [
        { name: "Margherita Pizza", size: "Large", qty: 1, price: 16.99 },
        { name: "Garlic Bread", qty: 1, price: 5.99 },
        { name: "Caesar Salad", qty: 1, price: 6.99 },
      ],
      total: 29.97,
      status: "delivered",
      deliveryAddress: "123 Main St, Toronto, ON M5V 3A8",
      phone: "+1 (555) 123-4567",
    },
    {
      id: "ORD-2024-1232",
      date: "December 5, 2024",
      time: "8:15 PM",
      items: [
        { name: "Hawaiian Pizza", size: "Large", qty: 2, price: 35.98 },
        { name: "Veggie Supreme Pizza", size: "Medium", qty: 1, price: 15.99 },
      ],
      total: 51.97,
      status: "delivered",
      deliveryAddress: "123 Main St, Toronto, ON M5V 3A8",
      phone: "+1 (555) 123-4567",
    },
    {
      id: "ORD-2024-1231",
      date: "November 28, 2024",
      time: "5:45 PM",
      items: [
        { name: "Meat Lovers Pizza", size: "Large", qty: 1, price: 19.99 },
        { name: "Mozzarella Sticks", qty: 1, price: 7.99 },
      ],
      total: 27.98,
      status: "delivered",
      deliveryAddress: "123 Main St, Toronto, ON M5V 3A8",
      phone: "+1 (555) 123-4567",
    },
    {
      id: "ORD-2024-1230",
      date: "November 20, 2024",
      time: "7:00 PM",
      items: [
        { name: "Four Cheese Pizza", size: "Medium", qty: 1, price: 16.99 },
        { name: "Buffalo Chicken Pizza", size: "Small", qty: 1, price: 12.99 },
      ],
      total: 29.98,
      status: "delivered",
      deliveryAddress: "123 Main St, Toronto, ON M5V 3A8",
      phone: "+1 (555) 123-4567",
    },
  ]

  const getStatusIcon = (status: string) => {
    return <CheckCircle2 className="w-5 h-5 text-green-600" />
  }

  const getStatusColor = (status: string) => {
    return "bg-green-100 text-green-700 border-green-300"
  }

  const handleReorder = (order: any) => {
    console.log("[v0] Reordering items from order:", order.id)
    // Convert order items to cart items and add them to cart
    order.items.forEach((item: any) => {
      const cartItem = {
        id: `${item.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}-${Math.random()}`,
        name: item.name,
        price: item.price / item.qty, // Get unit price
        size: item.size || "Large",
        quantity: item.qty,
        image: `/placeholder.svg?height=200&width=200&query=${encodeURIComponent(item.name)}`,
      }
      addItem(cartItem)
    })

    toast({
      title: "Items added to cart!",
      description: `${order.items.length} items from order ${order.id} have been added to your cart.`,
    })
  }

  const handleViewReceipt = (order: any) => {
    console.log("[v0] Opening receipt for order:", order.id)
    setSelectedOrder(order)
    setIsReceiptOpen(true)
  }

  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <BackButton />

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-heading font-bold text-4xl md:text-5xl mb-3">Your Orders</h1>
            <p className="text-muted-foreground text-lg">View all your past orders and track your deliveries</p>
          </div>

          {/* Search Bar */}
          <div className="mb-8 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search orders by ID or item name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-6">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-xl font-semibold mb-2">No orders found</p>
                <p className="text-muted-foreground">Try adjusting your search query</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-background border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Order Header */}
                  <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-4 md:p-6 border-b">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-heading font-bold text-xl">{order.id}</h3>
                          <Badge variant="outline" className={getStatusColor(order.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(order.status)}
                              <span className="capitalize">{order.status}</span>
                            </span>
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {order.date} at {order.time}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                        <p className="font-heading font-bold text-2xl text-primary">${order.total.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-4 md:p-6">
                    <h4 className="font-semibold mb-3">Order Items</h4>
                    <div className="space-y-2 mb-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2 border-b last:border-0">
                          <div>
                            <p className="font-medium">
                              {item.name} {item.size && `(${item.size})`}
                            </p>
                            <p className="text-sm text-muted-foreground">Qty: {item.qty}</p>
                          </div>
                          <p className="font-semibold">${item.price.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>

                    {/* Delivery Info */}
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Delivery Address</p>
                          <p className="text-sm text-muted-foreground">{order.deliveryAddress}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Contact Number</p>
                          <p className="text-sm text-muted-foreground">{order.phone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-4">
                      <Button variant="outline" className="flex-1 bg-transparent" onClick={() => handleReorder(order)}>
                        Reorder
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 bg-transparent"
                        onClick={() => handleViewReceipt(order)}
                      >
                        View Receipt
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />

      {/* Receipt Modal */}
      <OrderReceiptModal isOpen={isReceiptOpen} onClose={() => setIsReceiptOpen(false)} order={selectedOrder} />
    </div>
  )
}
