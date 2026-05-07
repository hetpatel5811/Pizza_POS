"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Clock3, Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getAllPizzaImages, getHeroImage } from "@/lib/customer-images"
import { SmartImage } from "@/components/smart-image"

export function Hero() {
  const pizzaImages = getAllPizzaImages()

  return (
    <section className="relative overflow-hidden pb-16 pt-10 md:pb-20 md:pt-14">
      <div className="absolute inset-0 pizza-grid-bg opacity-45" />
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-[#fff4e0] via-transparent to-transparent" />

      <div className="relative container mx-auto px-4">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="space-y-7"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/80 px-4 py-2 text-sm font-semibold text-primary">
              <Star className="h-4 w-4 fill-current" />
              4.8 average rating from local customers
            </div>

            <div className="space-y-4">
              <h1 className="font-heading text-balance text-4xl font-extrabold leading-tight text-[#3a2217] md:text-6xl">
                Real oven-fired pizza,
                <span className="block text-primary">ready for your next craving.</span>
              </h1>
              <p className="max-w-xl text-pretty text-base leading-relaxed text-foreground/75 md:text-lg">
                Fresh &amp; Hot Pizza combines premium ingredients, quick delivery, and a smooth digital ordering
                experience for families in Sturlings, Canada.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="rounded-xl bg-primary px-6 hover:bg-primary-hover">
                <Link href="#menu">
                  Order From Menu
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl border-primary/30 bg-card/70 px-6">
                <Link href="/deals">Explore Today's Deals</Link>
              </Button>
            </div>

            <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
              {[
                { value: "30 min", label: "Average delivery" },
                { value: "Fresh daily", label: "Dough prepared in-house" },
                { value: "7 days", label: "Open every week" },
              ].map((stat) => (
                <div key={stat.label} className="soft-panel rounded-2xl px-4 py-3">
                  <p className="font-heading text-lg font-bold text-[#3a2217]">{stat.value}</p>
                  <p className="text-sm text-foreground/65">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -left-8 top-16 hidden h-44 w-44 rounded-full bg-[#f4d380]/35 blur-3xl md:block" />
            <div className="absolute -right-4 bottom-4 hidden h-56 w-56 rounded-full bg-[#e27a4e]/30 blur-3xl md:block" />

            <div className="relative overflow-hidden rounded-[2rem] border border-[#d3b797] bg-card p-2 shadow-[0_22px_45px_rgba(103,60,32,0.22)]">
              <SmartImage
                src={getHeroImage()}
                fallbackSrc={pizzaImages[0]}
                alt="Freshly baked artisan pizza"
                className="h-[420px] w-full rounded-[1.5rem] object-cover"
              />

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.45 }}
                className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/40 bg-white/85 px-4 py-3 backdrop-blur"
              >
                <p className="font-heading text-lg font-semibold text-[#3a2217]">Chef-selected combo tonight</p>
                <p className="mt-1 inline-flex items-center gap-1 text-sm text-foreground/70">
                  <Clock3 className="h-4 w-4 text-primary" />
                  Ready in about 25 minutes
                </p>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35, duration: 0.45 }}
              className="absolute -bottom-8 -left-6 hidden w-40 overflow-hidden rounded-2xl border border-[#d3b797] bg-card p-1 shadow-lg md:block"
            >
              <SmartImage
                src={pizzaImages[3]}
                fallbackSrc={pizzaImages[1]}
                alt="Closeup pizza with toppings"
                className="h-28 w-full rounded-xl object-cover"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
