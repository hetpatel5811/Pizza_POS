"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Flame, Heart, Plus, Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { PizzaCustomizer } from "@/components/pizza-customizer"
import { useCart } from "@/lib/cart-context"
import { getPizzaImageByName } from "@/lib/customer-images"
import { type MenuItemRead } from "@/lib/api/menu"
import { SmartImage } from "@/components/smart-image"
import { useFavorites } from "@/hooks/useFavorites"

type PizzaCardItem = MenuItemRead & {
  displayImage?: string
}

interface PizzaCardProps {
  pizza: PizzaCardItem
}

const currencyFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
})

export function PizzaCard({ pizza }: PizzaCardProps) {
  const { addItem } = useCart()
  const { toggleFavorite, isFavorite } = useFavorites()
  const [showCustomizer, setShowCustomizer] = useState(false)

  const prices = {
    small: Number(pizza.price_small ?? 0),
    medium: Number(pizza.price_medium ?? 0),
    large: Number(pizza.price_large ?? 0),
  }
  const baseMediumPrice = prices.medium || prices.small || prices.large || 0

  const displayImage = pizza.displayImage || pizza.image_url || getPizzaImageByName(pizza.name)
  const liked = isFavorite(pizza.id, pizza.name)

  const sizeOptions = useMemo(
    () => [
      { value: "small" as const, label: "Small" as const, price: prices.small },
      { value: "medium" as const, label: "Medium" as const, price: prices.medium },
      { value: "large" as const, label: "Large" as const, price: prices.large },
    ],
    [prices.large, prices.medium, prices.small]
  )

  const handleQuickAdd = () => {
    addItem({
      id: `${pizza.id}-medium`,
      menuItemId: pizza.id,
      name: pizza.name,
      price: baseMediumPrice,
      size: "medium",
      quantity: 1,
      image: displayImage,
    })
  }

  const handleToggleFavorite = () => {
    toggleFavorite({
      menuItemId: pizza.id,
      name: pizza.name,
      description: pizza.description || "Freshly prepared with quality ingredients.",
      image: displayImage,
      price: baseMediumPrice,
      rating: pizza.is_popular ? 4.9 : 4.7,
      defaultSize: "Medium",
      defaultCrust: "Hand Tossed",
    })
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.45 }}
        whileHover={{ y: -6 }}
        className="h-full"
      >
        <Card className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[#d2b491] bg-[#fffaf1] shadow-[0_14px_28px_rgba(107,63,31,0.14)] transition-all">
          <div className="relative overflow-hidden">
            <SmartImage
              src={displayImage}
              fallbackSrc={getPizzaImageByName(pizza.name)}
              alt={pizza.name}
              className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

            <div className="absolute left-3 top-3 flex gap-2">
              {pizza.is_spicy && (
                <Badge className="border-0 bg-[#d2452f] text-white shadow-sm">
                  <Flame className="mr-1 h-3 w-3" />
                  Spicy
                </Badge>
              )}
              {pizza.is_popular && (
                <Badge className="border-0 bg-[#e6b049] text-[#4a2f1e] shadow-sm">
                  <Star className="mr-1 h-3 w-3 fill-current" />
                  Popular
                </Badge>
              )}
            </div>

            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute right-3 top-3 rounded-full bg-white/90 shadow-md backdrop-blur hover:bg-white"
              onClick={handleToggleFavorite}
              aria-label={liked ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-primary text-primary" : "text-slate-600"}`} />
            </Button>
          </div>

          <CardContent className="flex flex-1 flex-col p-5">
            <div className="mb-3">
              <h3 className="font-heading text-xl font-semibold text-[#362014]">{pizza.name}</h3>
              <p className="mt-1 min-h-10 text-sm leading-relaxed text-foreground/70">{pizza.description || "Freshly prepared with quality ingredients."}</p>
            </div>

            <div className="mt-auto grid grid-cols-3 gap-2 rounded-2xl border border-[#e0cab0] bg-white/80 p-3 text-sm">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Small</p>
                <p className="font-semibold">{currencyFormatter.format(prices.small)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Medium</p>
                <p className="font-semibold text-primary">{currencyFormatter.format(prices.medium)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Large</p>
                <p className="font-semibold">{currencyFormatter.format(prices.large)}</p>
              </div>
            </div>
          </CardContent>

          <CardFooter className="gap-2 p-5 pt-0">
            <Button
              variant="outline"
              className="flex-1 rounded-xl border-primary/20 bg-white/75"
              onClick={() => setShowCustomizer(true)}
            >
              Customize
            </Button>

            <Button className="flex-1 rounded-xl bg-primary hover:bg-primary-hover" onClick={handleQuickAdd}>
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </CardFooter>
        </Card>
      </motion.div>

      {showCustomizer && (
        <PizzaCustomizer
          pizza={{
            id: pizza.id,
            name: pizza.name,
            image: displayImage,
            sizeOptions,
          }}
          isOpen={showCustomizer}
          onClose={() => setShowCustomizer(false)}
        />
      )}
    </>
  )
}
