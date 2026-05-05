"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CartSidebar } from "@/components/cart-sidebar"
import { PizzaCard } from "@/components/pizza-card"
import { Badge } from "@/components/ui/badge"
import { Percent } from "lucide-react"
import { listDeals, type MenuItemRead } from "@/lib/api/menu"

export default function DealsPage() {
  const [deals, setDeals] = useState<MenuItemRead[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDeals = async () => {
    try {
      const data = await listDeals(true)
      setDeals(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("ERROR FETCHING DEALS:", error)
      setDeals([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeals()
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16">
          <div className="container mx-auto px-4 text-center">
            <Badge variant="secondary" className="mb-4 bg-secondary text-white">
              <Percent className="w-4 h-4 mr-1" /> Special Offers
            </Badge>
            <h1 className="font-heading font-bold text-4xl md:text-5xl mb-4">
              Amazing Deals & Combos
            </h1>
            <p className="text-lg text-muted-foreground">
              Save big with our exclusive combo deals and specials.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="font-heading font-bold text-3xl mb-8 text-center">
              Combo Deals
            </h2>

            {loading && <p className="text-center text-muted-foreground">Loading deals...</p>}

            {!loading && deals.length === 0 && (
              <p className="text-center text-muted-foreground">
                No deals available right now.
              </p>
            )}

            {!loading && deals.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {deals.map((deal) => (
                  <PizzaCard key={deal.id} pizza={deal} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
      <CartSidebar />
    </div>
  )
}
