"use client"

import type React from "react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CartSidebar } from "@/components/cart-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Phone, Mail, MapPin, Clock, Send, MessageCircle } from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Contact form submitted:", formData)
    alert("Thank you for contacting us! We'll get back to you soon.")
    setFormData({ name: "", email: "", phone: "", message: "" })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary via-primary-hover to-secondary py-20 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/pizza-pattern.svg')] opacity-10" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto text-white"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm font-medium">We're Here to Help</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="font-heading font-bold text-5xl md:text-6xl mb-4 text-balance"
              >
                Get In Touch
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-xl text-white/90 text-pretty"
              >
                Questions, feedback, or just want to say hi? Drop us a message and we'll respond within 24 hours!
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Quick Contact Cards */}
        <section className="py-8 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 -mt-16 relative z-20">
              {[
                {
                  icon: <Phone className="w-7 h-7 text-primary" />,
                  title: "Call Us",
                  subtitle: "Mon-Fri: 9am - 9pm",
                  link: "tel:+14165557499",
                  linkText: "(416) 555-PIZZA",
                },
                {
                  icon: <Mail className="w-7 h-7 text-primary" />,
                  title: "Email Us",
                  subtitle: "24/7 Response Time",
                  link: "mailto:info@freshhotpizza.ca",
                  linkText: "info@freshhotpizza.ca",
                },
              ].map((contact, index) => (
                <motion.div
                  key={contact.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <Card className="text-center shadow-lg border-2 hover:border-primary transition-colors">
                    <CardContent className="pt-6">
                      <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        {contact.icon}
                      </div>
                      <h3 className="font-heading font-bold text-xl mb-2">{contact.title}</h3>
                      <p className="text-muted-foreground mb-2">{contact.subtitle}</p>
                      {contact.link ? (
                        <a href={contact.link} className="text-primary font-semibold hover:underline text-lg block">
                          {contact.linkText}
                        </a>
                      ) : (
                        <Button variant="link" className="text-primary font-semibold text-lg p-0 h-auto">
                          {contact.linkText}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Content */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="mb-8">
                  <h2 className="font-heading font-bold text-3xl mb-3">Send Us a Message</h2>
                  <p className="text-muted-foreground text-lg">
                    Fill out the form below and our team will get back to you within 24 hours.
                  </p>
                </div>

                <Card className="shadow-lg border-2">
                  <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-base font-semibold">
                          Full Name *
                        </Label>
                        <Input
                          id="name"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-base font-semibold">
                          Email Address *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john.doe@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-base font-semibold">
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="(416) 555-0123"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-base font-semibold">
                          Your Message *
                        </Label>
                        <Textarea
                          id="message"
                          placeholder="Tell us what's on your mind..."
                          rows={6}
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          required
                          className="resize-none"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-12 bg-primary hover:bg-primary-hover text-lg font-semibold"
                      >
                        <Send className="w-5 h-5 mr-2" />
                        Send Message
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Contact Information */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="font-heading font-bold text-3xl mb-6">Visit Our Store</h2>

                  <Card className="shadow-lg border-2">
                    <CardContent className="p-6 space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-heading font-bold text-lg mb-2">Location</h3>
                          <p className="text-muted-foreground leading-relaxed">
                            123 Pizza Street
                            <br />
                            Sturlings
                            <br />
                            Canada
                          </p>
                        </div>
                      </div>

                      <div className="border-t pt-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                            <Clock className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-heading font-bold text-lg mb-2">Operating Hours</h3>
                            <div className="space-y-1 text-muted-foreground">
                              <p className="flex justify-between gap-8">
                                <span>Monday - Thursday:</span>
                                <span className="font-semibold">11am - 11pm</span>
                              </p>
                              <p className="flex justify-between gap-8">
                                <span>Friday - Saturday:</span>
                                <span className="font-semibold">11am - 1am</span>
                              </p>
                              <p className="flex justify-between gap-8">
                                <span>Sunday:</span>
                                <span className="font-semibold">12pm - 10pm</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Contact Information */}
                <Card className="shadow-lg border-2">
                  <CardContent className="p-6">
                    <h3 className="font-heading font-bold text-xl mb-4">Additional Information</h3>
                    <div className="space-y-3 text-muted-foreground">
                      <p>
                        <strong>For catering inquiries:</strong> Please contact us at least 48 hours in advance.
                      </p>
                      <p>
                        <strong>For large orders:</strong> Call us directly for special pricing and arrangements.
                      </p>
                      <p>
                        <strong>Feedback:</strong> We value your feedback! Let us know how we can improve.
                      </p>
                      <p>
                        <strong>Response Time:</strong> We typically respond to all inquiries within 24 hours during business days.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <CartSidebar />
    </div>
  )
}
