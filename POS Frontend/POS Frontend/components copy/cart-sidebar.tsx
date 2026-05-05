"use client"

import { useEffect, useState } from "react"
import { useCart } from "@/lib/cart-context"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react"
import { useRouter } from "next/navigation"

type CartSummary = {
  subtotal: number
  tax: number
  total: number
}

export function CartSidebar() {
  const {
    items,
    removeItem,
    updateQuantity,
    isCartOpen,
    setIsCartOpen,
  } = useCart()

  const [summary, setSummary] = useState<CartSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCheckout = () => {
    setIsCartOpen(false)
    router.push("/checkout")
  }

  // 🔒 SAFE BACKEND CALCULATION
  useEffect(() => {
    if (items.length === 0) {
      setSummary(null)
      return
    }

    setLoading(true)

    fetch("http://localhost:8000/api/cart/calculate-simple", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map(item => ({
          price: item.price,
          quantity: item.quantity,
        })),
      }),
    })
      .then(res => {
        if (!res.ok) throw new Error("Calculation failed")
        return res.json()
      })
      .then(setSummary)
      .catch(err => {
        console.error("Cart calculation error:", err)
        setSummary(null)
      })
      .finally(() => setLoading(false))
  }, [items])

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-2xl">
            <ShoppingBag className="w-6 h-6 text-primary" />
            Your Cart ({items.length})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground mb-6">
              Add items to start your order
            </p>
            <Button onClick={() => setIsCartOpen(false)}>Browse Menu</Button>
          </div>
        ) : (
          <>
            {/* ITEMS */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {items.map(item => (
                <div
                  key={item.id}
                  className="flex gap-4 bg-muted/50 p-3 rounded-lg"
                >
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded"
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold line-clamp-1">{item.name}</h4>
                    <p className="text-sm capitalize text-muted-foreground">
                      {item.size}
                    </p>
                    <p className="font-bold text-primary mt-1">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex flex-col justify-between items-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={item.quantity <= 1}
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                      >
                        <Minus className="w-3 h-3" />
                      </Button>

                      <span className="w-6 text-center font-semibold">
                        {item.quantity}
                      </span>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* TOTALS */}
            <SheetFooter className="flex-col gap-4 border-t pt-4">
              {loading && (
                <p className="text-sm text-center text-muted-foreground">
                  Calculating totals…
                </p>
              )}

              {!loading && (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>
                      ${summary ? summary.subtotal.toFixed(2) : "0.00"}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span>Tax (13%)</span>
                    <span>
                      ${summary ? summary.tax.toFixed(2) : "0.00"}
                    </span>
                  </div>

                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total</span>
                    <span className="text-primary">
                      ${summary ? summary.total.toFixed(2) : "0.00"}
                    </span>
                  </div>

                  <Button
                    size="lg"
                    disabled={!summary}
                    onClick={handleCheckout}
                  >
                    Proceed to Checkout
                  </Button>
                </>
              )}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
