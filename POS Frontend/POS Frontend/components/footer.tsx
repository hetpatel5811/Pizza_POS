"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Clock3, Instagram, Mail, MapPin, Phone, Pizza, Youtube } from "lucide-react"

export function Footer() {
  return (
    <footer className="relative mt-12 overflow-hidden border-t border-[#d6bb9b] bg-[#2f1c14] text-[#f7e8d6]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(228,130,79,0.28),transparent_42%),radial-gradient(circle_at_80%_10%,rgba(236,193,94,0.18),transparent_35%)]" />

      <div className="relative container mx-auto px-4 py-12 md:py-14">
        <div className="grid gap-9 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#d95b34] to-[#a63522] shadow-lg">
                <Pizza className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-heading text-2xl font-bold">Fresh &amp; Hot Pizza</h3>
                <p className="text-xs uppercase tracking-[0.2em] text-[#f3c99e]">Sturlings, Canada</p>
              </div>
            </div>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#f7e8d6]/80">
              We bake with fresh dough, real mozzarella, and balanced sauces to deliver a consistent premium taste in
              every order.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-[#f3c99e]">Fastest Delivery Window</p>
                <p className="mt-1 font-heading text-xl font-semibold">30 minutes</p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-[#f3c99e]">Customer Rating</p>
                <p className="mt-1 font-heading text-xl font-semibold">4.8 / 5</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-heading text-lg font-semibold">Quick Links</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/" className="text-[#f7e8d6]/75 transition-colors hover:text-white">
                  Menu
                </Link>
              </li>
              <li>
                <Link href="/deals" className="text-[#f7e8d6]/75 transition-colors hover:text-white">
                  Deals
                </Link>
              </li>
              <li>
                <Link href="/track-order" className="text-[#f7e8d6]/75 transition-colors hover:text-white">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-[#f7e8d6]/75 transition-colors hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-lg font-semibold">Contact</h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-2 text-[#f7e8d6]/80">
                <Phone className="mt-0.5 h-4 w-4 text-[#f3c99e]" />
                <a href="tel:+14165557499" className="hover:text-white">
                  (416) 555-7499
                </a>
              </li>
              <li className="flex items-start gap-2 text-[#f7e8d6]/80">
                <Mail className="mt-0.5 h-4 w-4 text-[#f3c99e]" />
                <a href="mailto:orders@freshpizza.ca" className="hover:text-white">
                  orders@freshpizza.ca
                </a>
              </li>
              <li className="flex items-start gap-2 text-[#f7e8d6]/80">
                <MapPin className="mt-0.5 h-4 w-4 text-[#f3c99e]" />
                <span>123 Pizza Street, Sturlings, Canada</span>
              </li>
              <li className="flex items-start gap-2 text-[#f7e8d6]/80">
                <Clock3 className="mt-0.5 h-4 w-4 text-[#f3c99e]" />
                <span>Open daily, 11:00 AM - 11:00 PM</span>
              </li>
            </ul>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-5"
        >
          <p className="text-xs text-[#f7e8d6]/70">Copyright 2026 Fresh &amp; Hot Pizza. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/20 bg-white/5 transition hover:bg-white/15"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/20 bg-white/5 transition hover:bg-white/15"
            >
              <Youtube className="h-4 w-4" />
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
