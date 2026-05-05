"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, ShoppingCart, Star, Flame, Clock } from "lucide-react"
import { BackButton } from "@/components/back-button"
import { motion } from "framer-motion"
import { getPizzaImageByName } from "@/lib/customer-images"

export default function FavoritePizzasPage() {
  const [favorites] = useState([
    {
      id: 1,
      name: "Pepperoni Classic",
      description: "Traditional pepperoni with extra cheese",
      price: 14.99,
      image: getPizzaImageByName("Pepperoni Classic"),
      rating: 4.8,
      orders: 45,
      lastOrdered: "5 days ago",
      customization: { size: "Large", crust: "Hand Tossed", extras: ["Extra Cheese"] },
    },
    {
      id: 2,
      name: "BBQ Chicken Deluxe",
      description: "Grilled chicken with BBQ sauce and red onions",
      price: 16.99,
      image: getPizzaImageByName("BBQ Chicken Deluxe"),
      rating: 4.9,
      orders: 32,
      lastOrdered: "2 weeks ago",
      customization: { size: "Large", crust: "Thin Crust", extras: ["Jalapeños"] },
    },
    {
      id: 3,
      name: "Veggie Supreme",
      description: "Fresh vegetables with mozzarella",
      price: 15.99,
      image: getPizzaImageByName("Veggie Supreme"),
      rating: 4.7,
      orders: 28,
      lastOrdered: "1 week ago",
      customization: { size: "Medium", crust: "Hand Tossed", extras: ["Olives", "Mushrooms"] },
    },
    {
      id: 4,
      name: "Meat Lovers",
      description: "Loaded with pepperoni, sausage, and bacon",
      price: 18.99,
      image: getPizzaImageByName("Meat Lovers"),
      rating: 4.9,
      orders: 52,
      lastOrdered: "3 days ago",
      customization: { size: "Large", crust: "Pan", extras: ["Extra Meat"] },
    },
  ])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <BackButton />

          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-3">
              <Heart className="w-10 h-10 text-primary fill-primary" />
              <h1 className="font-heading font-bold text-4xl md:text-5xl">Your Favorite Pizzas</h1>
            </div>
            <p className="text-muted-foreground text-lg">Your most loved pizzas, just a click away</p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              {
                label: "Total Favorites",
                value: favorites.length,
                icon: <Heart className="w-12 h-12 text-primary/20 fill-primary/20" />,
                gradient: "from-primary/10 to-secondary/10",
              },
              {
                label: "Total Orders",
                value: favorites.reduce((sum, fav) => sum + fav.orders, 0),
                icon: <Flame className="w-12 h-12 text-orange-500/20" />,
                gradient: "from-orange-500/10 to-yellow-500/10",
              },
              {
                label: "Avg Rating",
                value: (favorites.reduce((sum, fav) => sum + fav.rating, 0) / favorites.length).toFixed(1),
                icon: <Star className="w-12 h-12 text-yellow-500/20 fill-yellow-500/20" />,
                gradient: "from-green-500/10 to-emerald-500/10",
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.03 }}
                className={`bg-gradient-to-br ${stat.gradient} rounded-lg p-6 border`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="font-heading font-bold text-3xl">{stat.value}</p>
                  </div>
                  {stat.icon}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Favorites Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {favorites.map((pizza, index) => (
              <motion.div
                key={pizza.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-background border rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all group"
              >
                <div className="relative">
                  <img
                    src={pizza.image || "/placeholder.svg"}
                    alt={pizza.name}
                    className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="rounded-full shadow-lg bg-white/90 backdrop-blur hover:bg-white"
                    >
                      <Heart className="w-5 h-5 text-primary fill-primary" />
                    </Button>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                    <Badge variant="secondary" className="bg-white/90 backdrop-blur">
                      <Star className="w-3 h-3 mr-1 fill-yellow-500 text-yellow-500" />
                      {pizza.rating}
                    </Badge>
                    <Badge variant="secondary" className="bg-white/90 backdrop-blur">
                      {pizza.orders} orders
                    </Badge>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="font-heading font-bold text-2xl mb-2">{pizza.name}</h3>
                  <p className="text-muted-foreground mb-4">{pizza.description}</p>

                  {/* Customization Details */}
                  <div className="bg-muted/50 rounded-lg p-4 mb-4 space-y-2">
                    <p className="text-sm font-semibold mb-2">Your Usual Order:</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{pizza.customization.size}</Badge>
                      <Badge variant="outline">{pizza.customization.crust}</Badge>
                      {pizza.customization.extras.map((extra, idx) => (
                        <Badge key={idx} variant="outline">
                          {extra}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-heading font-bold text-2xl text-primary">${pizza.price}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        Last ordered {pizza.lastOrdered}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button className="flex-1 gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      Quick Reorder
                    </Button>
                    <Button variant="outline" className="flex-1 bg-transparent">
                      Customize
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Empty State (if no favorites) */}
          {favorites.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center py-16"
            >
              <Heart className="w-20 h-20 text-muted-foreground/20 mx-auto mb-4" />
              <h2 className="font-heading font-bold text-2xl mb-2">No Favorites Yet</h2>
              <p className="text-muted-foreground mb-6">
                Start adding pizzas to your favorites by clicking the heart icon on any pizza!
              </p>
              <Button size="lg">Browse Menu</Button>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
