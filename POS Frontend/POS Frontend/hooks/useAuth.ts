"use client";

import { useEffect, useState } from "react";

export type AuthUser = {
  id?: number;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "employee" | "admin";
};

export default function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const t = localStorage.getItem("token");
      const u = localStorage.getItem("user");
      if (t) setToken(t);
      if (u) setUser(JSON.parse(u));
    } catch {
      // ignore bad storage
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (jwt: string, userData: AuthUser) => {
    localStorage.setItem("token", jwt);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(jwt);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    // ✅ force navigation so panel clears
    window.location.href = "/login";
  };

  return { user, token, loading, login, logout };
}
