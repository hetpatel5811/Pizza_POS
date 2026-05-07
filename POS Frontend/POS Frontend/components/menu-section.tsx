"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Filter, Pizza } from "lucide-react"

import { PizzaCard } from "@/components/pizza-card"
import { SearchFilter } from "@/components/search-filter"
import { getPizzaImageByName } from "@/lib/customer-images"
import { listCategories, listMenuItems, type CategoryRead, type MenuItemRead } from "@/lib/api/menu"

type MenuCardItem = MenuItemRead & {
  displayImage: string
}

type CategoryTab = {
  id: string
  name: string
}

export function MenuSection() {
  const [activeCategory, setActiveCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [pizzas, setPizzas] = useState<MenuCardItem[]>([])
  const [categories, setCategories] = useState<CategoryTab[]>([{ id: "all", name: "All Pizzas" }])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const fetchMenu = async () => {
      try {
        setLoading(true)
        setError(null)

        const [menuItems, categoryItems] = await Promise.all([
          listMenuItems({ only_active: true }),
          listCategories(true),
        ])

        if (!mounted) return

        const mappedCategories: CategoryTab[] = [
          { id: "all", name: "All Pizzas" },
          ...categoryItems.map((category: CategoryRead) => ({ id: String(category.id), name: category.name })),
        ]

        const menuWithImages: MenuCardItem[] = menuItems.map((pizza: MenuItemRead) => ({
          ...pizza,
          displayImage: pizza.image_url || getPizzaImageByName(pizza.name),
        }))

        setCategories(mappedCategories)
        setPizzas(menuWithImages)
      } catch (err) {
        if (!mounted) return
        console.error(err)
        setError("Unable to load menu right now. Please try again in a moment.")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchMenu()

    return () => {
      mounted = false
    }
  }, [])

  const filteredPizzas = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return pizzas.filter((pizza) => {
      const matchesCategory = activeCategory === "all" || String(pizza.category_id) === activeCategory
      const matchesQuery =
        !query ||
        pizza.name.toLowerCase().includes(query) ||
        (pizza.description || "").toLowerCase().includes(query) ||
        (pizza.category_name || "").toLowerCase().includes(query)

      return matchesCategory && matchesQuery
    })
  }, [activeCategory, pizzas, searchQuery])

  return (
    <section id="menu" className="pb-16 pt-8 md:pb-24 md:pt-12">
      <div className="container mx-auto px-4">
        <div className="soft-panel rounded-3xl px-4 py-8 md:px-8 md:py-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.5 }}
            className="mb-8 text-center"
          >
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Pizza className="h-4 w-4" />
              Customer Menu
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold text-[#3a2217] md:text-4xl">Build the perfect pizza</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-foreground/70 md:text-base">
              Start with your favorite base, then customize sizes and toppings to match your craving.
            </p>
          </motion.div>

          <div className="mx-auto mb-7 max-w-2xl">
            <SearchFilter onSearch={setSearchQuery} />
          </div>

          <div className="mb-7 flex items-center gap-2 text-sm font-medium text-foreground/70">
            <Filter className="h-4 w-4 text-primary" />
            Filter by category
          </div>

          <div className="mb-8 flex flex-wrap gap-2">
            {categories.map((category) => {
              const isActive = category.id === activeCategory
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25"
                      : "border-[#d5bc9f] bg-white/80 text-foreground/70 hover:border-primary/45 hover:text-primary"
                  }`}
                >
                  {category.name}
                </button>
              )
            })}
          </div>

          {loading && (
            <div className="py-12 text-center text-muted-foreground">Loading your menu selection...</div>
          )}

          {error && !loading && <div className="py-12 text-center text-red-600">{error}</div>}

          {!loading && !error && filteredPizzas.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#cda980] bg-white/75 py-12 text-center">
              <p className="font-heading text-2xl font-semibold text-[#3a2217]">No pizzas found</p>
              <p className="mt-2 text-sm text-muted-foreground">Try another search term or switch category.</p>
            </div>
          )}

          {!loading && !error && filteredPizzas.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredPizzas.map((pizza) => (
                <PizzaCard key={pizza.id} pizza={pizza} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
