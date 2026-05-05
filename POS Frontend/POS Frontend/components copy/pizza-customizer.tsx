"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Minus, Plus } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import type { Pizza } from "@/lib/menu-data"

interface PizzaCustomizerProps {
  pizza: Pizza
  isOpen: boolean
  onClose: () => void
}

const extraToppings = [
  "Extra Cheese",
  "Pepperoni",
  "Mushrooms",
  "Onions",
  "Green Peppers",
  "Black Olives",
  "Italian Sausage",
  "Bacon",
  "Tomatoes",
  "Jalapeños",
]

const crustOptions = ["Regular", "Thin Crust", "Thick Crust", "Stuffed Crust"]

export function PizzaCustomizer({ pizza, isOpen, onClose }: PizzaCustomizerProps) {
  const { addItem } = useCart()
  const [size, setSize] = useState<"medium" | "large" | "xlarge">("medium")
  const [crust, setCrust] = useState("Regular")
  const [selectedToppings, setSelectedToppings] = useState<string[]>([])
  const [quantity, setQuantity] = useState(1)

  const basePrice = pizza.price[size]
  const toppingsPrice = selectedToppings.length * 1.5
  const crustUpcharge = crust === "Stuffed Crust" ? 3 : 0
  const totalPrice = (basePrice + toppingsPrice + crustUpcharge) * quantity

  const handleAddToCart = () => {
    addItem({
      id: `${pizza.id}-${size}-${Date.now()}`,
      name: pizza.name,
      price: basePrice + toppingsPrice + crustUpcharge,
      size,
      quantity,
      image: pizza.image,
      customizations: {
        crust,
        extraToppings: selectedToppings,
      },
    })
    onClose()
  }

  const toggleTopping = (topping: string) => {
    setSelectedToppings((prev) => (prev.includes(topping) ? prev.filter((t) => t !== topping) : [...prev, topping]))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Customize Your {pizza.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Pizza Image */}
          <img
            src={pizza.image || "/placeholder.svg"}
            alt={pizza.name}
            className="w-full h-48 object-cover rounded-lg"
          />

          {/* Size Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Choose Size</Label>
            <RadioGroup value={size} onValueChange={(value: any) => setSize(value)}>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "medium", label: "Medium", price: pizza.price.medium },
                  { value: "large", label: "Large", price: pizza.price.large },
                  { value: "xlarge", label: "X-Large", price: pizza.price.xlarge },
                ].map((option) => (
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
          </div>

          {/* Crust Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Crust Type</Label>
            <RadioGroup value={crust} onValueChange={setCrust}>
              <div className="grid grid-cols-2 gap-3">
                {crustOptions.map((option) => (
                  <div key={option} className="relative">
                    <RadioGroupItem value={option} id={option} className="peer sr-only" />
                    <Label
                      htmlFor={option}
                      className="flex items-center justify-between rounded-lg border-2 border-muted bg-background p-3 hover:bg-muted cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                    >
                      <span className="font-medium">{option}</span>
                      {option === "Stuffed Crust" && <span className="text-xs text-muted-foreground">+$3.00</span>}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Extra Toppings */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Extra Toppings <span className="text-sm font-normal text-muted-foreground">(+$1.50 each)</span>
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {extraToppings.map((topping) => (
                <div key={topping} className="flex items-center space-x-2">
                  <Checkbox
                    id={topping}
                    checked={selectedToppings.includes(topping)}
                    onCheckedChange={() => toggleTopping(topping)}
                  />
                  <Label htmlFor={topping} className="text-sm font-normal cursor-pointer">
                    {topping}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Quantity */}
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
          <Button onClick={handleAddToCart} className="flex-1 bg-primary hover:bg-primary-hover text-lg font-semibold">
            Add to Cart - ${totalPrice.toFixed(2)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
