"use client";

import { useEffect } from "react";
import useAuth from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { DealsBanner } from "@/components/deals-banner";
import { MenuSection } from "@/components/menu-section";
import { CartSidebar } from "@/components/cart-sidebar";
import { Footer } from "@/components/footer";

export default function Home() {
  const router = useRouter();
  const { token, user, loading } = useAuth();

  // Wait for auth state before routing.
  useEffect(() => {
    if (loading) return;

    if (!token || !user) {
      router.replace("/login");
      return;
    }

    if (user.role === "admin") {
      router.replace("/admin");
      return;
    }

    if (user.role === "employee") {
      router.replace("/POS");
    }
  }, [token, user, loading, router]);

  // While auth is loading from localStorage.
  if (loading) {
    return <div className="p-10 text-center text-xl font-semibold">Loading...</div>;
  }

  // Non-customer users are redirected to their own panel.
  if (!token || !user || user.role !== "customer") {
    return <div className="p-10 text-center text-xl font-semibold">Redirecting...</div>;
  }

  // Customer authenticated.
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <Hero />
        <DealsBanner />
        <MenuSection />
      </main>

      <Footer />

      <CartSidebar />
    </div>
  );
}
