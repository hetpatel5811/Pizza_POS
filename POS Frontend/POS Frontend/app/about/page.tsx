"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Clock, Users, Award, Pizza } from "lucide-react"
import { motion } from "framer-motion"
import { getChefImage } from "@/lib/customer-images"

export default function AboutPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="font-heading font-bold text-4xl md:text-5xl mb-4 text-balance">About Fresh Pizza</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              Serving authentic, delicious pizzas in Canada since 2010. Made with passion, served with love.
            </p>
          </motion.div>

          {/* Story Section */}
          <div className="grid md:grid-cols-2 gap-8 mb-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-heading font-bold text-3xl mb-4">Our Story</h2>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                Fresh Pizza was founded in 2010 with a simple mission: to bring authentic, delicious pizza to our
                community. What started as a small family-owned pizzeria has grown into a beloved local establishment.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We believe in using only the finest ingredients, preparing our dough fresh daily, and creating an
                unforgettable experience with every order. Our commitment to quality and customer satisfaction has made
                us a trusted name in Canadian pizza.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative h-80 rounded-lg overflow-hidden"
            >
              <img src={getChefImage()} alt="Pizza chef" className="h-full w-full object-cover" loading="lazy" />
            </motion.div>
          </div>

          {/* Values Section */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              {
                icon: <Pizza className="w-8 h-8 text-primary" />,
                title: "Quality Ingredients",
                description: "We source the finest ingredients to ensure every pizza is a masterpiece",
              },
              {
                icon: <Clock className="w-8 h-8 text-primary" />,
                title: "Fresh Daily",
                description: "Our dough is prepared fresh every morning for the perfect crust",
              },
              {
                icon: <Users className="w-8 h-8 text-primary" />,
                title: "Community First",
                description: "We are proud to serve and give back to our local community",
              },
              {
                icon: <Award className="w-8 h-8 text-primary" />,
                title: "Award Winning",
                description: "Recognized for excellence in taste and customer service",
              },
            ].map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-card border rounded-lg p-6 text-center"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  {value.icon}
                </div>
                <h3 className="font-heading font-bold text-xl mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-primary/80 to-secondary/80 text-white rounded-lg p-8 md:p-12"
          >
            <h2 className="font-heading font-bold text-3xl mb-8 text-center">Our Journey in Numbers</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              {[
                { value: "15+", label: "Years in Business" },
                { value: "50K+", label: "Happy Customers" },
                { value: "100K+", label: "Pizzas Delivered" },
                { value: "4.9", label: "Average Rating" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <p className="font-heading font-bold text-5xl mb-2">{stat.value}</p>
                  <p className="text-white/90">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </>
  )
}
