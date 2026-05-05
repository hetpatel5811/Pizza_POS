
"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PizzaCard } from "@/components/pizza-card"
import { SearchFilter } from "@/components/search-filter"
import { motion } from "framer-motion"

export function MenuSection() {
  const [activeCategory, setActiveCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [pizzas, setPizzas] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([
    { id: "all", name: "All Pizzas", icon: "🍕" },
  ])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ----------------------------------------------------------------
  // FETCH MENU + CATEGORIES FROM BACKEND (FIXED API URLS)
  // ----------------------------------------------------------------

  const fetchMenu = async () => {
    try {
      setLoading(true)

      const [menuRes, catRes] = await Promise.all([
        fetch("http://localhost:8000/api/menu"),             
        fetch("http://localhost:8000/api/menu/categories"),   
      ])

      if (!menuRes.ok || !catRes.ok) {
        throw new Error("API failed")
      }

      const menuJson = await menuRes.json()
      const catJson = await catRes.json()

      // SAFE category list mapping
      const mappedCategories = [
        { id: "all", name: "All Pizzas", icon: "🍕" },

        ...(Array.isArray(catJson) ? catJson : [])
          .filter((c: any) => c.name !== "Classic") 
          .map((c: any) => ({
            id: String(c.id),
            name: c.name,
            icon: c.icon || "⭐",
          })),
      ]


      setCategories(mappedCategories)
      setPizzas(Array.isArray(menuJson) ? menuJson : [])
    } catch (err) {
      console.error(err)
      setError("Failed to load menu")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMenu()
  }, [])

  // ----------------------------------------------------------------
  // FILTERING LOGIC
  // ----------------------------------------------------------------

  const filteredPizzas = pizzas.filter((pizza: any) => {
    const matchesCategory =
      activeCategory === "all" ||
      String(pizza.category_id) === activeCategory

    const matchesSearch =
      searchQuery === "" ||
      pizza.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pizza.description.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCategory && matchesSearch
  })

  // ----------------------------------------------------------------
  // UI SECTION
  // ----------------------------------------------------------------

  return (
    <section id="menu" className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-block px-4 py-2 bg-primary/10 rounded-full mb-4">
            <span className="text-primary font-medium text-sm">🍕 Our Menu</span>
          </div>
          <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">
            Choose Your Favorite Pizza
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Handcrafted with love using fresh ingredients and traditional recipes
          </p>
        </motion.div>

        {/* Search Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-2xl mx-auto mb-8"
        >
          <SearchFilter onSearch={setSearchQuery} />
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="text-center text-lg text-muted-foreground py-10">
            Loading menu...
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center text-red-500 py-10">
            {error}
          </div>
        )}

        {/* FINAL MENU SECTION */}
        {!loading && !error && (
          <Tabs defaultValue="all" className="w-full">
            
            {/* Category Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <TabsList className="w-full justify-start overflow-x-auto flex-nowrap mb-8 bg-background border h-auto p-1">
                {categories.map((category, idx) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.4 + idx * 0.1 }}
                  >
                    <TabsTrigger
                      value={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className="whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-white px-6 py-3 gap-2"
                    >
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </TabsTrigger>
                  </motion.div>
                ))}
              </TabsList>
            </motion.div>

            {/* Pizza Grid */}
            <TabsContent value={activeCategory} className="mt-0">
              {filteredPizzas.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                  <p className="text-muted-foreground text-lg">
                    No pizzas found matching your search.
                  </p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPizzas.map((pizza: any) => (
                    <PizzaCard key={pizza.id} pizza={pizza} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </section>
  )
}
