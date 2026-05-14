"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Clock, Heart, ShoppingCart, Star, Trash2 } from "lucide-react"

import { BackButton } from "@/components/back-button"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { SmartImage } from "@/components/smart-image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useFavorites } from "@/hooks/useFavorites"
import useAuth from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { type CustomerOrderRead, listCustomerOrders } from "@/lib/api/customerOrders"
import { useCart } from "@/lib/cart-context"
import { getPizzaImageByName } from "@/lib/customer-images"

type FavoriteOrderStats = {
  count: number
  lastOrderedAt?: string
}

function normalizeName(value: string) {
  return value.trim().toLowerCase()
}

function formatLastOrdered(iso?: string) {
  if (!iso) return "Not ordered yet"

  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "Not ordered yet"

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return "today"
  if (diffDays === 1) return "1 day ago"
  if (diffDays < 30) return `${diffDays} days ago`

  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths === 1) return "1 month ago"
  if (diffMonths < 12) return `${diffMonths} months ago`

  const diffYears = Math.floor(diffMonths / 12)
  return diffYears === 1 ? "1 year ago" : `${diffYears} years ago`
}

export default function FavoritePizzasPage() {
  const { user } = useAuth()
  const { favorites, removeFavorite } = useFavorites()
  const { addItem } = useCart()
  const { toast } = useToast()

  const [orders, setOrders] = useState<CustomerOrderRead[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)

  useEffect(() => {
    let active = true

    const loadOrders = async () => {
      if (!user) {
        setOrders([])
        setLoadingOrders(false)
        return
      }

      try {
        setLoadingOrders(true)
        const data = await listCustomerOrders({ limit: 200 })
        if (!active) return
        setOrders(Array.isArray(data) ? data : [])
      } catch {
        if (!active) return
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

  const orderStatsMap = useMemo(() => {
    const stats = new Map<string, FavoriteOrderStats>()

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const key = normalizeName(item.menu_item_name)
        const previous = stats.get(key)

        const latestTimestamp = previous?.lastOrderedAt
          ? Math.max(new Date(previous.lastOrderedAt).getTime(), new Date(order.created_at).getTime())
          : new Date(order.created_at).getTime()

        stats.set(key, {
          count: (previous?.count || 0) + Number(item.quantity || 0),
          lastOrderedAt: Number.isNaN(latestTimestamp) ? previous?.lastOrderedAt : new Date(latestTimestamp).toISOString(),
        })
      })
    })

    return stats
  }, [orders])

  const favoritesView = useMemo(() => {
    return favorites.map((favorite) => {
      const stats = orderStatsMap.get(normalizeName(favorite.name))
      return {
        ...favorite,
        displayImage: favorite.image || getPizzaImageByName(favorite.name),
        orderCount: stats?.count ?? favorite.orderCount ?? 0,
        lastOrderedAt: stats?.lastOrderedAt ?? favorite.lastOrderedAt,
        rating: favorite.rating ?? 4.8,
      }
    })
  }, [favorites, orderStatsMap])

  const totalOrdersFromFavorites = useMemo(
    () => favoritesView.reduce((sum, favorite) => sum + favorite.orderCount, 0),
    [favoritesView]
  )

  const averageRating = useMemo(() => {
    if (favoritesView.length === 0) return "0.0"
    const rating = favoritesView.reduce((sum, favorite) => sum + Number(favorite.rating || 0), 0) / favoritesView.length
    return rating.toFixed(1)
  }, [favoritesView])

  const handleQuickReorder = (favoriteId: string) => {
    const favorite = favoritesView.find((item) => item.id === favoriteId)
    if (!favorite) return

    addItem({
      id: `${favorite.menuItemId || favorite.id}-favorite-${Date.now()}`,
      menuItemId: favorite.menuItemId,
      name: favorite.name,
      price: Number(favorite.price || 0),
      size: (favorite.defaultSize || "medium").toLowerCase(),
      quantity: 1,
      image: favorite.displayImage,
      customizations: {
        crust: favorite.defaultCrust,
        extraToppings: favorite.extras || [],
      },
    })

    toast({
      title: "Added to cart",
      description: `${favorite.name} is ready for checkout.`,
    })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <BackButton />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="mb-3 flex items-center gap-3">
              <Heart className="h-10 w-10 fill-primary text-primary" />
              <h1 className="font-heading text-4xl font-bold md:text-5xl">Your Favorite Pizzas</h1>
            </div>
            <p className="text-lg text-muted-foreground">Saved picks that update with your real customer activity.</p>
          </motion.div>

          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                label: "Total Favorites",
                value: favoritesView.length,
                gradient: "from-primary/10 to-secondary/10",
              },
              {
                label: "Total Orders",
                value: totalOrdersFromFavorites,
                gradient: "from-orange-500/10 to-yellow-500/10",
              },
              {
                label: "Avg Rating",
                value: averageRating,
                gradient: "from-green-500/10 to-emerald-500/10",
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.08 }}
                className={`rounded-2xl border bg-gradient-to-br ${stat.gradient} p-6`}
              >
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-2 font-heading text-3xl font-bold">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {favoritesView.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border border-dashed bg-background py-16 text-center"
            >
              <Heart className="mx-auto mb-4 h-20 w-20 text-muted-foreground/20" />
              <h2 className="mb-2 font-heading text-2xl font-bold">No favorites yet</h2>
              <p className="mb-6 text-muted-foreground">Tap the heart on any pizza card to add it here dynamically.</p>
              <Button size="lg" onClick={() => (window.location.href = "/#menu")}>Browse Menu</Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {favoritesView.map((pizza, index) => (
                <motion.article
                  key={pizza.id}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: index * 0.06 }}
                  className="group overflow-hidden rounded-2xl border bg-background shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative">
                    <SmartImage
                      src={pizza.displayImage}
                      fallbackSrc={getPizzaImageByName(pizza.name)}
                      alt={pizza.name}
                      className="h-56 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute right-4 top-4">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="rounded-full bg-white/90 shadow-md backdrop-blur hover:bg-white"
                        onClick={() => removeFavorite(pizza.id)}
                        aria-label={`Remove ${pizza.name} from favorites`}
                      >
                        <Trash2 className="h-4 w-4 text-rose-600" />
                      </Button>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                      <Badge variant="secondary" className="bg-white/90 backdrop-blur">
                        <Star className="mr-1 h-3 w-3 fill-yellow-500 text-yellow-500" />
                        {pizza.rating.toFixed(1)}
                      </Badge>
                      <Badge variant="secondary" className="bg-white/90 backdrop-blur">
                        {pizza.orderCount} orders
                      </Badge>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="mb-2 font-heading text-2xl font-bold">{pizza.name}</h3>
                    <p className="mb-4 text-muted-foreground">{pizza.description || "Customer favorite crafted your way."}</p>

                    <div className="mb-4 rounded-lg bg-muted/50 p-4">
                      <p className="mb-2 text-sm font-semibold">Your usual</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{pizza.defaultSize || "Medium"}</Badge>
                        <Badge variant="outline">{pizza.defaultCrust || "Hand Tossed"}</Badge>
                        {(pizza.extras || []).map((extra) => (
                          <Badge key={extra} variant="outline">
                            {extra}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4 flex items-center justify-between">
                      <p className="font-heading text-2xl font-bold text-primary">${Number(pizza.price || 0).toFixed(2)}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Last ordered {formatLastOrdered(pizza.lastOrderedAt)}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button className="flex-1 gap-2" onClick={() => handleQuickReorder(pizza.id)}>
                        <ShoppingCart className="h-4 w-4" />
                        Quick Reorder
                      </Button>
                      <Button variant="outline" className="flex-1 bg-transparent" onClick={() => (window.location.href = "/#menu")}>
                        Customize
                      </Button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}

          {loadingOrders && (
            <p className="mt-6 text-center text-sm text-muted-foreground">Updating your latest order stats...</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
