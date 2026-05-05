"use client"

import { Button } from "@/components/ui/button"
import { Timer, Percent } from "lucide-react"
import { motion } from "framer-motion"

export function DealsBanner() {
  return (
    <section className="bg-gradient-to-r from-primary to-secondary py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center gap-4"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="w-16 h-16 bg-white rounded-full flex items-center justify-center"
            >
              <Percent className="w-8 h-8 text-primary" />
            </motion.div>
            <div className="text-white">
              <h3 className="font-heading font-bold text-xl md:text-2xl">Limited Time Offers!</h3>
              <p className="text-white/90">Save big on combo deals and family packs</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center gap-3"
          >
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg backdrop-blur">
              <Timer className="w-5 h-5 text-white" />
              <span className="text-white font-bold">Ends in 24:00:00</span>
            </div>
            <Button variant="secondary" size="lg" className="font-semibold">
              View Deals
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
