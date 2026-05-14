"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useEffect, useMemo, useState } from "react"
import { ChevronRight, Clock, Heart, LogOut, MapPin, Settings, Sparkles, X } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useFavorites } from "@/hooks/useFavorites"
import useAuth from "@/hooks/useAuth"
import { listCustomerOrders } from "@/lib/api/customerOrders"

interface UserProfileProps {
  isOpen: boolean
  onClose: () => void
}

export function UserProfile({ isOpen, onClose }: UserProfileProps) {
  const { user, logout } = useAuth()
  const { favorites } = useFavorites()
  const router = useRouter()
  const [orderCount, setOrderCount] = useState(0)

  useEffect(() => {
    let active = true

    const loadOrderCount = async () => {
      if (!isOpen || !user) {
        setOrderCount(0)
        return
      }

      try {
        const orders = await listCustomerOrders({ limit: 200 })
        if (!active) return
        setOrderCount(Array.isArray(orders) ? orders.length : 0)
      } catch {
        if (!active) return
        setOrderCount(0)
      }
    }

    loadOrderCount()

    return () => {
      active = false
    }
  }, [isOpen, user])

  const initials =
    user?.name
      ?.split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "U"

  const avatarStorageKey = useMemo(() => {
    if (!user) return "fhp:profile-avatar:guest"
    if (typeof user.id === "number") return `fhp:profile-avatar:id:${user.id}`
    return `fhp:profile-avatar:email:${user.email.toLowerCase()}`
  }, [user])

  const localAvatar =
    typeof window !== "undefined" && (user?.id || user?.email)
      ? localStorage.getItem(avatarStorageKey)
      : null

  const avatarUrl =
    localAvatar || (user?.name
      ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`
      : "https://api.dicebear.com/7.x/avataaars/svg?seed=Guest")

  const actions = useMemo(
    () => [
      {
        href: "/order-history",
        label: "Order History",
        description: orderCount > 0 ? `${orderCount} orders available` : "Track and repeat your recent orders",
        countLabel: orderCount > 0 ? String(orderCount) : null,
        icon: Clock,
      },
      {
        href: "/favorite-pizzas",
        label: "Favorite Pizzas",
        description: favorites.length > 0 ? `${favorites.length} pizzas saved` : "Access your saved custom picks",
        countLabel: favorites.length > 0 ? String(favorites.length) : null,
        icon: Heart,
      },
      {
        href: "/account-settings",
        label: "Account Settings",
        description: "Update personal details and profile photo",
        countLabel: null,
        icon: Settings,
      },
    ],
    [favorites.length, orderCount],
  )

  const handleLogout = () => {
    logout()
    onClose()
    router.push("/login")
  }

  if (!isOpen) return null

  return (
    <>
      <motion.button
        aria-label="Close profile panel"
        className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.aside
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
        className="fixed right-0 top-0 z-50 h-full w-full overflow-y-auto border-l border-[#d9b996] bg-[#fff9f1] shadow-[0_24px_50px_rgba(71,40,18,0.25)] md:w-[430px]"
      >
        <div className="relative min-h-full p-5 md:p-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-[#ffd5a9]/55 via-[#ffe8c9]/45 to-transparent" />

          <div className="relative">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/75">Customer Profile</p>
                <h2 className="mt-1 font-heading text-3xl font-bold text-[#2f1a10]">My Profile</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl hover:bg-primary/10">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="mb-5 rounded-2xl border border-[#e2c4a4] bg-white/90 p-4 shadow-sm">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Fresh &amp; Hot Pizza
              </p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-foreground/75">
                <MapPin className="h-4 w-4 text-primary" />
                Sturlings, Canada
              </p>
            </div>

            <div className="mb-6 rounded-3xl border border-[#dfbf9d] bg-gradient-to-br from-[#fff4e3] to-[#ffe9cc] p-5 shadow-[0_12px_25px_rgba(110,65,31,0.16)]">
              <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24 border-4 border-[#e67a48] shadow-md">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="bg-primary text-lg font-bold text-white">{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h3 className="truncate font-heading text-2xl font-bold text-[#2f1a10]">{user?.name || "Guest User"}</h3>
                  <p className="truncate text-sm text-foreground/70">{user?.email || "Not logged in"}</p>
                  <p className="text-sm text-foreground/70">{user?.phone || "No phone number"}</p>
                </div>
              </div>
            </div>

            <div className="mb-5 space-y-3">
              {actions.map((action) => {
                const Icon = action.icon
                return (
                  <Link key={action.href} href={action.href} onClick={onClose} className="group block">
                    <div className="rounded-2xl border border-[#d8bfa4] bg-white/85 px-4 py-3 transition-all hover:border-primary/40 hover:bg-white hover:shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-heading text-lg font-semibold text-[#2f1a10]">{action.label}</p>
                          <p className="text-xs text-foreground/65">{action.description}</p>
                        </div>
                        {action.countLabel && (
                          <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                            {action.countLabel}
                          </span>
                        )}
                        <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            <div className="mb-6 rounded-2xl border border-[#dfbf9d] bg-white/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Preferred Pickup Store</p>
              <p className="mt-1 font-heading text-lg font-semibold text-[#2f1a10]">Fresh &amp; Hot Pizza</p>
              <p className="mt-1 text-sm text-foreground/70">123 Pizza Street, Sturlings, Canada</p>
            </div>

            <Button
              variant="destructive"
              size="lg"
              className="h-12 w-full rounded-2xl bg-[#e53b2d] text-base font-semibold hover:bg-[#cc2f23]"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </motion.aside>
    </>
  )
}
