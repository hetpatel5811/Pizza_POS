"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Flame, Star } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { useState } from "react"
import { PizzaCustomizer } from "@/components/pizza-customizer"
import { motion } from "framer-motion"

interface PizzaCardProps {
  pizza: any   // backend response
}

export function PizzaCard({ pizza }: PizzaCardProps) {
  const { addItem } = useCart()
  const [showCustomizer, setShowCustomizer] = useState(false)

  // ⭐ FIX: NORMALIZE PRICES FOR FRONTEND
  const price = {
    small: pizza.price_small ?? 0,
    medium: pizza.price_medium ?? 0,
    large: pizza.price_large ?? 0,
    xlarge: pizza.price_xlarge ?? 0,
  }

  // ⭐ QUICK ADD (uses normalized price)
  const handleQuickAdd = () => {
    addItem({
      id: pizza.id,
      name: pizza.name,
      price: price.medium,
      size: "medium",
      quantity: 1,
      image: pizza.image_url,
    })
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
        whileHover={{ y: -8 }}
      >
        <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden border-2 hover:border-primary/50 h-full">
          
          {/* IMAGE */}
          <div className="relative overflow-hidden">
            <img
              src={pizza.image_url || "/placeholder.svg"}
              alt={pizza.name}
              className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
            />

            {pizza.is_popular && (
              <Badge className="absolute top-3 right-3 bg-secondary text-white border-0">
                <Star className="w-3 h-3 mr-1 fill-white" /> Popular
              </Badge>
            )}

            {pizza.is_spicy && (
              <Badge className="absolute top-3 left-3 bg-error text-white border-0">
                <Flame className="w-3 h-3 mr-1" /> Spicy
              </Badge>
            )}
          </div>

          {/* CONTENT */}
          <CardContent className="p-4">
            <h3 className="font-heading font-semibold text-lg mb-2">{pizza.name}</h3>
            <p className="text-sm text-muted-foreground mb-3">{pizza.description}</p>

            {/* PRICE DISPLAY */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Small</p>
                <p className="font-bold text-primary">${price.small.toFixed(2)}</p>
              </div>

              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Medium</p>
                <p className="font-bold text-primary">${price.medium.toFixed(2)}</p>
              </div>

              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Large</p>
                <p className="font-bold text-primary">${price.large.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>

          {/* BUTTONS */}
          <CardFooter className="p-4 pt-0 gap-2">
            <Button 
              variant="outline" 
              className="flex-1 bg-transparent"
              onClick={() => setShowCustomizer(true)}
            >
              Customize
            </Button>

            <Button 
              className="flex-1 bg-primary hover:bg-primary-hover"
              onClick={handleQuickAdd}
            >
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </CardFooter>
        </Card>
      </motion.div>

      {/* ⭐ CUSTOMIZER FIX — PASS NORMALIZED PRICE */}
      {showCustomizer && (
        <PizzaCustomizer
          pizza={{ ...pizza, price }}   // THIS FIXES THE CRASH
          isOpen={showCustomizer}
          onClose={() => setShowCustomizer(false)}
        />
      )}
    </>
  )
}
