"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Receipt, MapPin, Phone, CreditCard, Calendar, Clock, Package, Download, CheckCircle2 } from "lucide-react"

interface OrderItem {
  name: string
  size?: string
  qty: number
  price: number
}

interface Order {
  id: string
  date: string
  time: string
  items: OrderItem[]
  total: number
  status: string
  deliveryAddress: string
  phone: string
  paymentMethod?: string
  subtotal?: number
  tax?: number
  deliveryFee?: number
}

interface OrderReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  order: Order | null
}

export function OrderReceiptModal({ isOpen, onClose, order }: OrderReceiptModalProps) {
  if (!order) return null

  const subtotal = order.subtotal || order.total * 0.88
  const tax = order.tax || order.total * 0.13
  const deliveryFee = order.deliveryFee || 4.99

  const handleDownload = () => {
    // In a real app, this would generate and download a PDF
    alert("Receipt download functionality will be implemented with backend integration")
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Receipt className="w-6 h-6 text-primary" />
            Order Receipt
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Status */}
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Order Completed</p>
                <p className="text-sm text-green-700">Thank you for your order!</p>
              </div>
            </div>
            <Badge className="bg-green-600 text-white">{order.status.toUpperCase()}</Badge>
          </div>

          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Package className="w-4 h-4" />
                Order Number
              </p>
              <p className="font-semibold text-lg">{order.id}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Order Date
              </p>
              <p className="font-semibold">{order.date}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Order Time
              </p>
              <p className="font-semibold">{order.time}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Payment Method
              </p>
              <p className="font-semibold">{order.paymentMethod || "Credit Card"}</p>
            </div>
          </div>

          <Separator />

          {/* Items */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Order Items</h3>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start py-2">
                  <div className="flex-1">
                    <p className="font-medium">
                      {item.name}
                      {item.size && <span className="text-muted-foreground"> ({item.size})</span>}
                    </p>
                    <p className="text-sm text-muted-foreground">Quantity: {item.qty}</p>
                  </div>
                  <p className="font-semibold">${item.price.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Price Breakdown */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery Fee</span>
              <span className="font-medium">${deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (13% HST)</span>
              <span className="font-medium">${tax.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total Paid</span>
              <span className="text-primary">${order.total.toFixed(2)}</span>
            </div>
          </div>

          <Separator />

          {/* Delivery Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Delivery Information</h3>
            <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
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
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handlePrint} variant="outline" className="flex-1 bg-transparent">
              Print Receipt
            </Button>
            <Button onClick={handleDownload} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>

          {/* Footer Note */}
          <div className="text-center text-sm text-muted-foreground pt-4 border-t">
            <p>Thank you for choosing our Pizza Store!</p>
            <p>Questions? Contact us at support@pizzastore.com or (555) 123-4567</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
