"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Clock3, LogOut, MapPin, Menu, ShoppingCart, User, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import { UserProfile } from "@/components/user-profile"
import useAuth from "@/hooks/useAuth"

const NAV_LINKS = [
  { href: "/#menu", label: "Menu" },
  { href: "/deals", label: "Deals" },
  { href: "/track-order", label: "Track Order" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]

export function Header() {
  const router = useRouter()
  const { items, setIsCartOpen } = useCart()
  const { user, logout } = useAuth()

  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const handleCartClick = () => setIsCartOpen(true)

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="hidden md:block border-b border-border/60 bg-[#fff4df] text-[13px] text-foreground/80">
          <div className="container mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <p className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                Sturlings, Canada
              </p>
              <p className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5 text-primary" />
                Open now until 11:00 PM
              </p>
            </div>
            <p className="font-medium">Hand-stretched dough, fresh from the oven</p>
          </div>
        </div>

        <div className="container mx-auto px-4">
          <div className="flex h-20 items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-primary to-[#b73722] shadow-md shadow-primary/30">
                <span className="font-heading text-xl font-bold text-primary-foreground">FP</span>
              </div>
              <div>
                <h1 className="font-heading text-xl font-semibold leading-tight">Fresh &amp; Hot Pizza</h1>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Customer Lounge</p>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-2 shadow-sm">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-4 py-2 text-sm font-medium text-foreground/75 transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="relative rounded-xl border-primary/20 bg-card hover:border-primary/50"
                    onClick={handleCartClick}
                    aria-label="Open cart"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {itemCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 rounded-full bg-primary px-1 text-[11px] font-bold leading-5 text-primary-foreground">
                        {itemCount}
                      </span>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className="hidden md:inline-flex rounded-xl border-primary/20 bg-card hover:border-primary/50"
                    onClick={() => setIsProfileOpen(true)}
                    aria-label="Open profile"
                  >
                    <User className="h-5 w-5" />
                  </Button>

                  <Button
                    variant="outline"
                    className="hidden md:inline-flex rounded-xl border-primary/20 bg-card px-4 hover:border-primary/50"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Button variant="outline" className="rounded-xl" onClick={() => router.push("/login")}>
                    Login
                  </Button>
                  <Button className="rounded-xl bg-primary hover:bg-primary-hover" onClick={() => router.push("/register")}>
                    Sign Up
                  </Button>
                </div>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden rounded-xl"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            className="absolute inset-0 bg-black/35"
            aria-label="Close menu overlay"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="absolute left-4 right-4 top-[5.4rem] rounded-2xl border border-border bg-card p-5 shadow-2xl">
            <nav className="grid gap-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-primary/10 hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-4 border-t border-border pt-4 space-y-2">
              {!user ? (
                <>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      router.push("/login")
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    className="w-full rounded-xl bg-primary hover:bg-primary-hover"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      router.push("/register")
                    }}
                  >
                    Sign Up
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      setIsProfileOpen(true)
                    }}
                  >
                    <User className="mr-2 h-4 w-4" />
                    View Profile
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      handleLogout()
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <UserProfile isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  )
}

export default Header
