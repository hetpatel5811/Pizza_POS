"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SavedAddressesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/checkout");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-slate-600">
      Redirecting to checkout...
    </div>
  );
}
