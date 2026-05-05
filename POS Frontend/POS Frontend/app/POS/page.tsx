// app/POS/page.tsx (or page.jsx)
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import EmployeePanel from "@/components/EmployeePanel";

export default function POSPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (!(user.role === "admin" || user.role === "employee")) router.replace("/menu");
  }, [user, loading, router]);

  if (loading || !user || !(user.role === "admin" || user.role === "employee")) {
    return <div className="min-h-screen flex items-center justify-center">Checking access…</div>;
  }

  return <EmployeePanel />;
}
