"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, BadgePercent, Clock3, Gift } from "lucide-react"

import { Button } from "@/components/ui/button"

const DEAL_ITEMS = [
  {
    title: "Family Feast",
    detail: "2 large pizzas + garlic bread + 4 drinks",
    tag: "Save 18%",
  },
  {
    title: "Lunch Slice Box",
    detail: "Quick midday combo built for office orders",
    tag: "From CAD 11.99",
  },
  {
    title: "Weekend Party Pack",
    detail: "Bulk order pricing for gatherings and game nights",
    tag: "Free delivery over CAD 55",
  },
]

export function DealsBanner() {
  return (
    <section className="py-8 md:py-10">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55 }}
          className="overflow-hidden rounded-3xl border border-[#d6b18b] bg-gradient-to-r from-[#8e2f1f] via-[#b6422a] to-[#d55b31] p-6 text-white shadow-[0_18px_35px_rgba(126,48,27,0.34)] md:p-8"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                <BadgePercent className="h-4 w-4" />
                Limited Time Offers
              </p>
              <h2 className="mt-3 font-heading text-2xl font-bold md:text-3xl">Hot deals crafted for your next order</h2>
              <p className="mt-2 max-w-2xl text-white/85">
                Pick a combo built by our kitchen team and save more without compromising quality.
              </p>
            </div>

            <div className="rounded-2xl border border-white/30 bg-white/15 px-4 py-3 text-sm backdrop-blur">
              <p className="inline-flex items-center gap-2 font-semibold">
                <Clock3 className="h-4 w-4" />
                Deal refresh in 08:12:35
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {DEAL_ITEMS.map((deal, index) => (
              <motion.article
                key={deal.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.08 * index }}
                className="rounded-2xl border border-white/25 bg-white/12 p-4 backdrop-blur"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-white/80">{deal.tag}</p>
                <h3 className="mt-1 font-heading text-lg font-bold">{deal.title}</h3>
                <p className="mt-2 text-sm text-white/80">{deal.detail}</p>
              </motion.article>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild variant="secondary" className="rounded-xl bg-white text-[#8e2f1f] hover:bg-[#ffe8cf]">
              <Link href="/deals">
                View All Deals
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <p className="inline-flex items-center gap-2 text-sm text-white/85">
              <Gift className="h-4 w-4" />
              Add one combo to cart and unlock extra topping discount.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
