"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"

import { useCart } from "@/lib/cart-context"
import { getPizzaImageByName } from "@/lib/customer-images"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { SmartImage } from "@/components/smart-image"

type CartSummary = {
  subtotal: number
  tax: number
  total: number
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "")

const currencyFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
})

export function CartSidebar() {
  const { items, removeItem, updateQuantity, isCartOpen, setIsCartOpen } = useCart()
  const [summary, setSummary] = useState<CartSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const cartCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items])

  useEffect(() => {
    if (items.length === 0) {
      setSummary(null)
      return
    }

    let mounted = true

    const calculateTotals = async () => {
      try {
        setLoading(true)

        const response = await fetch(`${API_BASE}/cart/calculate-simple`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((item) => ({
              price: item.price,
              quantity: item.quantity,
            })),
          }),
        })

        if (!response.ok) {
          throw new Error("Cart calculation failed")
        }

        const data: CartSummary = await response.json()
        if (mounted) setSummary(data)
      } catch (error) {
        console.error("Cart calculation error:", error)
        if (mounted) setSummary(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    calculateTotals()

    return () => {
      mounted = false
    }
  }, [items])

  const handleCheckout = () => {
    setIsCartOpen(false)
    router.push("/checkout")
  }

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent className="w-full border-l border-[#d3b493] bg-[#fff8ee] sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-heading text-2xl text-[#3a2217]">
            <ShoppingBag className="h-6 w-6 text-primary" />
            Your Cart ({cartCount})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10">
              <ShoppingBag className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-heading text-2xl font-semibold text-[#3a2217]">Cart is empty</h3>
            <p className="mt-2 text-sm text-muted-foreground">Add a pizza to start your order.</p>
            <Button className="mt-6 rounded-xl bg-primary hover:bg-primary-hover" onClick={() => setIsCartOpen(false)}>
              Browse Menu
            </Button>
          </div>
        ) : (
          <>
            <div className="my-4 flex-1 space-y-3 overflow-y-auto pr-1">
              {items.map((item) => (
                <article key={item.id} className="rounded-2xl border border-[#ddc4a8] bg-white/85 p-3 shadow-sm">
                  <div className="flex gap-3">
                    <SmartImage
                      src={item.image || getPizzaImageByName(item.name)}
                      fallbackSrc={getPizzaImageByName(item.name)}
                      alt={item.name}
                      className="h-20 w-20 rounded-xl object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <h4 className="line-clamp-1 font-semibold text-[#3a2217]">{item.name}</h4>
                      <p className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">{item.size}</p>
                      <p className="mt-2 font-semibold text-primary">{currencyFormatter.format(item.price * item.quantity)}</p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      disabled={item.quantity <= 1}
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </article>
              ))}
            </div>

            <SheetFooter className="mt-2 flex-col gap-3 border-t border-[#ddc4a8] pt-4">
              {loading && <p className="text-center text-sm text-muted-foreground">Calculating total...</p>}

              {!loading && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{currencyFormatter.format(summary?.subtotal || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Tax (13%)</span>
                    <span>{currencyFormatter.format(summary?.tax || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-[#ddc4a8] pt-3 text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">{currencyFormatter.format(summary?.total || 0)}</span>
                  </div>

                  <Button
                    size="lg"
                    className="w-full rounded-xl bg-primary hover:bg-primary-hover"
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
