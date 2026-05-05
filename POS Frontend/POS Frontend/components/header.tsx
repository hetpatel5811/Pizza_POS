// components/header.tsx
"use client";

import { useState } from "react";
import { ShoppingCart, User, Menu, X, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { UserProfile } from "@/components/user-profile";
import useAuth from "@/hooks/useAuth";

export function Header() {
  const router = useRouter();
  const { items, setIsCartOpen } = useCart();
  const { user, logout } = useAuth(); // logout available
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCartClick = () => {
    setIsCartOpen(true);
  };

  const handleLogout = () => {
    // logout from useAuth (clears localStorage + state)
    logout();
    // navigate to login page after logout for clarity
    router.push("/login");
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-heading font-bold text-xl">FP</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-heading font-bold text-xl text-foreground">Fresh Pizza</h1>
                <p className="text-xs text-muted-foreground">Point of Sale</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/#menu" className="text-sm font-medium hover:text-primary transition-colors">
                Menu
              </Link>
              <Link href="/deals" className="text-sm font-medium hover:text-primary transition-colors">
                Deals
              </Link>
              <Link href="/track-order" className="text-sm font-medium hover:text-primary transition-colors">
                Track Order
              </Link>
              <Link href="/contact" className="text-sm font-medium hover:text-primary transition-colors">
                Contact
              </Link>
              <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors">
                About Us
              </Link>
            </nav>

            {/* Actions (Login/Signup OR Profile + Logout + Cart + Mobile Menu) */}
            <div className="flex items-center gap-3">

              {/* Desktop: when NOT logged in → show Login + Signup */}
              {!user ? (
                <div className="hidden md:flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/login")}
                    className="px-4"
                  >
                    Login
                  </Button>

                  <Button
                    variant="default"
                    onClick={() => router.push("/register")}
                    className="px-4 bg-primary text-white hover:bg-primary/90"
                  >
                    Signup
                  </Button>
                </div>
              ) : (
                // Desktop: when logged in → REORDERED: Cart first, then Profile, then Logout
                <div className="hidden md:flex items-center gap-2">
                  {/* Cart Button - MOVED FIRST */}
                  <Button
                    variant="default"
                    size="icon"
                    className="relative bg-primary hover:bg-primary-hover"
                    onClick={handleCartClick}
                    aria-label="Open cart"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {itemCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {itemCount}
                      </span>
                    )}
                  </Button>

                  {/* Profile Button - MOVED SECOND - CHANGED TO GREEN */}
                  <Button
                    variant="default"
                    size="icon"
                    onClick={() => setIsProfileOpen(true)}
                    aria-label="Open profile"
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    <User className="w-5 h-5" />
                  </Button>

                  {/* Logout Button - MOVED LAST */}
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </div>
              )}

              {/* Mobile Menu Toggle (visible on small screens) */}
              <button
                onClick={() => setMobileMenuOpen((s) => !s)}
                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-foreground hover:bg-surface/50"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden
          />

          {/* Panel */}
          <div className="absolute top-16 right-0 left-0 bg-white border-t shadow-lg">
            <div className="p-4 space-y-3">
              <nav className="flex flex-col gap-2">
                <Link href="/#menu" onClick={() => setMobileMenuOpen(false)} className="py-2 px-3 rounded hover:bg-gray-100">
                  Menu
                </Link>
                <Link href="/deals" onClick={() => setMobileMenuOpen(false)} className="py-2 px-3 rounded hover:bg-gray-100">
                  Deals
                </Link>
                <Link href="/track-order" onClick={() => setMobileMenuOpen(false)} className="py-2 px-3 rounded hover:bg-gray-100">
                  Track Order
                </Link>
                <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="py-2 px-3 rounded hover:bg-gray-100">
                  Contact
                </Link>
                <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="py-2 px-3 rounded hover:bg-gray-100">
                  About Us
                </Link>
              </nav>

              <div className="border-t pt-3 flex flex-col gap-2">
                {!user ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        router.push("/login");
                      }}
                      className="w-full"
                    >
                      Login
                    </Button>

                    <Button
                      variant="default"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        router.push("/register");
                      }}
                      className="w-full bg-primary text-white"
                    >
                      Signup
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 px-2">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                        {user.name ? user.name.split(" ").map(s => s[0]).slice(0,2).join("").toUpperCase() : "U"}
                      </div>
                      <div>
                        <div className="font-semibold">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setIsProfileOpen(true);
                      }}
                      className="w-full"
                    >
                      Open Profile
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full"
                    >
                      Logout
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Drawer */}
      <UserProfile isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
}

export default Header;