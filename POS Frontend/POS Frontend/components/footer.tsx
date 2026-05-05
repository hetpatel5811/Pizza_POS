"use client"

import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, Pizza, Clock, Award, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white mt-16 overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-64 h-64 bg-primary rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary rounded-full blur-3xl"></div>
      </div>

      <div className="relative container mx-auto px-4 py-12">
        

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* About Section */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
                <Pizza className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-2xl">Fresh Pizza</h3>
                <p className="text-xs text-gray-400">Canadian Pizza Excellence</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Serving authentic Italian pizzas with love since 2010. Fresh ingredients, traditional recipes, and a
              passion for perfection in every slice. Your satisfaction is our mission!
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                <Award className="w-5 h-5 text-primary mb-1" />
                <p className="text-xs text-gray-400">Best Pizza 2024</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                <TrendingUp className="w-5 h-5 text-secondary mb-1" />
                <p className="text-xs text-gray-400">15+ Years</p>
              </div>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h4 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-primary rounded-full"></div>
              Quick Links
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-gray-400 hover:text-primary transition-colors flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-primary transition-colors"></span>
                  Menu
                </Link>
              </li>
              <li>
                <Link
                  href="/deals"
                  className="text-gray-400 hover:text-primary transition-colors flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-primary transition-colors"></span>
                  Deals
                </Link>
              </li>
              <li>
                <Link
                  href="/track-order"
                  className="text-gray-400 hover:text-primary transition-colors flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-primary transition-colors"></span>
                  Track Order
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-gray-400 hover:text-primary transition-colors flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-primary transition-colors"></span>
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-400 hover:text-primary transition-colors flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-primary transition-colors"></span>
                  Contact
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h4 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-primary rounded-full"></div>
              Contact Us
            </h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3 group">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Call Us</p>
                  <a href="tel:+14165557499" className="text-gray-300 hover:text-white transition-colors">
                    (416) 555-PIZZA
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Email Us</p>
                  <a href="mailto:order@freshpizza.ca" className="text-gray-300 hover:text-white transition-colors">
                    order@freshpizza.ca
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Visit Us</p>
                  <p className="text-gray-300">123 Pizza Street, Toronto, ON M5V 2T6</p>
                </div>
              </li>
            </ul>
          </motion.div>

          {/* Opening Hours */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h4 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-primary rounded-full"></div>
              Opening Hours
            </h4>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold">We're Open!</span>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between items-center">
                  <span className="text-gray-400">Mon - Thu:</span>
                  <span className="text-white font-medium">11:00 AM - 11:00 PM</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-gray-400">Fri - Sat:</span>
                  <span className="text-white font-medium">11:00 AM - 1:00 AM</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-gray-400">Sunday:</span>
                  <span className="text-white font-medium">12:00 PM - 10:00 PM</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="text-center md:text-left">
            <p className="text-sm text-gray-400">© 2025 Fresh Pizza. All rights reserved.</p>
            <div className="flex gap-4 mt-2 justify-center md:justify-start">
              {/* <Link href="#" className="text-xs text-gray-500 hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <span className="text-gray-700">•</span>
              <Link href="#" className="text-xs text-gray-500 hover:text-primary transition-colors">
                Terms of Service
              </Link>
              <span className="text-gray-700">•</span>
              <Link href="#" className="text-xs text-gray-500 hover:text-primary transition-colors">
                Cookie Policy
              </Link> */}
            </div>
          </div>

          <div className="flex gap-3">
            <motion.a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-white/5 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-primary border border-white/10 transition-all group"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Facebook className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
            </motion.a>
            <motion.a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-white/5 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-primary border border-white/10 transition-all group"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Instagram className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
            </motion.a>
            <motion.a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-white/5 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-primary border border-white/10 transition-all group"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Twitter className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
            </motion.a>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
