"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Minus, Plus } from "lucide-react"
import { useCart, type SelectedTopping } from "@/lib/cart-context"
import { listCrustOptions, listToppings, type CrustOptionRead, type ToppingRead } from "@/lib/api/menu"

type SizeOption = {
  value: "small" | "medium" | "large"
  label: "Small" | "Medium" | "Large"
  price: number
}

type Pizza = {
  id: number | string
  name: string
  image?: string
  sizeOptions: SizeOption[]
}

interface PizzaCustomizerProps {
  pizza: Pizza
  isOpen: boolean
  onClose: () => void
}

export function PizzaCustomizer({ pizza, isOpen, onClose }: PizzaCustomizerProps) {
  const { addItem } = useCart()

  const defaultSize = useMemo(
    () => pizza.sizeOptions.find((option) => option.value === "medium") || pizza.sizeOptions[0] || null,
    [pizza.sizeOptions]
  )
  const [size, setSize] = useState<"small" | "medium" | "large">(defaultSize?.value || "medium")
  const [selectedCrustOptionId, setSelectedCrustOptionId] = useState<number | null>(null)
  const [selectedToppings, setSelectedToppings] = useState<SelectedTopping[]>([])
  const [quantity, setQuantity] = useState(1)

  const [availableToppings, setAvailableToppings] = useState<ToppingRead[]>([])
  const [availableCrustOptions, setAvailableCrustOptions] = useState<CrustOptionRead[]>([])
  const [loadingToppings, setLoadingToppings] = useState(false)
  const [loadingCrustOptions, setLoadingCrustOptions] = useState(false)
  const [toppingsError, setToppingsError] = useState<string | null>(null)
  const [crustOptionsError, setCrustOptionsError] = useState<string | null>(null)

  useEffect(() => {
    if (!defaultSize) return
    if (!isOpen) return
    setSize(defaultSize.value)
  }, [defaultSize, isOpen])

  useEffect(() => {
    if (!isOpen) return

    let mounted = true
    ;(async () => {
      try {
        setLoadingCrustOptions(true)
        setLoadingToppings(true)
        setCrustOptionsError(null)
        setToppingsError(null)
        const [toppings, crustOptions] = await Promise.all([
          listToppings({ only_available: true }),
          listCrustOptions({ only_available: true }),
        ])
        if (!mounted) return
        setAvailableToppings(toppings)
        setAvailableCrustOptions(crustOptions)
        setSelectedCrustOptionId(crustOptions[0]?.id ?? null)
      } catch (err: any) {
        if (!mounted) return
        const message = err?.message || "Failed to load customization options"
        setCrustOptionsError(message)
        setToppingsError(message)
      } finally {
        if (mounted) {
          setLoadingCrustOptions(false)
          setLoadingToppings(false)
        }
      }
    })()

    return () => {
      mounted = false
    }
  }, [isOpen])

  const selectedSize = pizza.sizeOptions.find((option) => option.value === size) || defaultSize
  const selectedCrustOption =
    availableCrustOptions.find((option) => option.id === selectedCrustOptionId) || null
  const basePrice = Number(selectedSize?.price || 0)
  const toppingsPrice = useMemo(
    () => selectedToppings.reduce((sum, topping) => sum + topping.price * topping.quantity, 0),
    [selectedToppings]
  )
  const crustUpcharge = Number(selectedCrustOption?.price_adjustment || 0)
  const totalPrice = (basePrice + toppingsPrice + crustUpcharge) * quantity

  const handleAddToCart = () => {
    if (!selectedSize) return

    addItem({
      id: `${pizza.id}-${size}-${Date.now()}`,
      menuItemId: Number(pizza.id),
      name: pizza.name,
      price: basePrice + toppingsPrice + crustUpcharge,
      size,
      quantity,
      image: pizza.image || "/placeholder.svg",
      customizations: {
        crust: selectedCrustOption?.name || undefined,
        crustOptionId: selectedCrustOption?.id || undefined,
        toppings: selectedToppings,
        extraToppings: selectedToppings.map((t) => t.name),
      },
    })
    onClose()
  }

  const toggleTopping = (topping: ToppingRead) => {
    setSelectedToppings((prev) => {
      const exists = prev.some((t) => t.topping_id === topping.id)
      if (exists) return prev.filter((t) => t.topping_id !== topping.id)
      return [
        ...prev,
        {
          topping_id: topping.id,
          name: topping.name,
          price: Number(topping.price || 0),
          quantity: 1,
        },
      ]
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Customize Your {pizza.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <Label className="text-base font-semibold mb-3 block">Choose Size</Label>
            {pizza.sizeOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Size options are not configured for this item.</p>
            ) : (
              <RadioGroup value={size} onValueChange={(value: "small" | "medium" | "large") => setSize(value)}>
                <div className="grid grid-cols-3 gap-3">
                  {pizza.sizeOptions.map((option) => (
                    <div key={option.value} className="relative">
                      <RadioGroupItem value={option.value} id={option.value} className="peer sr-only" />
                      <Label
                        htmlFor={option.value}
                        className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-background p-4 hover:bg-muted cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                      >
                        <span className="font-semibold">{option.label}</span>
                        <span className="text-sm text-muted-foreground">${option.price.toFixed(2)}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">Crust Type</Label>
            {loadingCrustOptions ? (
              <p className="text-sm text-muted-foreground">Loading crust options...</p>
            ) : crustOptionsError ? (
              <p className="text-sm text-red-600">{crustOptionsError}</p>
            ) : availableCrustOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No crust options available right now.</p>
            ) : (
              <RadioGroup
                value={selectedCrustOptionId != null ? String(selectedCrustOptionId) : ""}
                onValueChange={(value) => setSelectedCrustOptionId(Number(value))}
              >
                <div className="grid grid-cols-2 gap-3">
                  {availableCrustOptions.map((option) => {
                    const optionId = `crust-option-${option.id}`
                    const upcharge = Number(option.price_adjustment || 0)
                    return (
                      <div key={option.id} className="relative">
                        <RadioGroupItem value={String(option.id)} id={optionId} className="peer sr-only" />
                        <Label
                          htmlFor={optionId}
                          className="flex items-center justify-between rounded-lg border-2 border-muted bg-background p-3 hover:bg-muted cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                        >
                          <span className="font-medium">{option.name}</span>
                          {upcharge > 0 ? (
                            <span className="text-xs text-muted-foreground">+${upcharge.toFixed(2)}</span>
                          ) : null}
                        </Label>
                      </div>
                    )
                  })}
                </div>
              </RadioGroup>
            )}
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">Extra Toppings</Label>

            {loadingToppings ? (
              <p className="text-sm text-muted-foreground">Loading toppings...</p>
            ) : toppingsError ? (
              <p className="text-sm text-red-600">{toppingsError}</p>
            ) : availableToppings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No toppings available right now.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableToppings.map((topping) => {
                  const checked = selectedToppings.some((t) => t.topping_id === topping.id)
                  const inputId = `topping-${topping.id}`
                  return (
                    <div
                      key={topping.id}
                      className={`rounded-lg border-2 p-3 transition-colors ${
                        checked
                          ? "border-primary bg-primary/5"
                          : "border-muted bg-background hover:border-primary/50 hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id={inputId}
                          checked={checked}
                          onCheckedChange={() => toggleTopping(topping)}
                          className="mt-0.5"
                        />
                        <Label htmlFor={inputId} className="cursor-pointer leading-tight">
                          <span className="block text-sm font-medium">{topping.name}</span>
                          <span className="block text-xs text-muted-foreground">
                            +${Number(topping.price || 0).toFixed(2)}
                          </span>
                        </Label>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">Quantity</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-xl font-bold w-12 text-center">{quantity}</span>
              <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
            Cancel
          </Button>
          <Button
            onClick={handleAddToCart}
            className="flex-1 bg-primary hover:bg-primary-hover text-lg font-semibold"
            disabled={!selectedSize}
          >
            Add to Cart - ${totalPrice.toFixed(2)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
