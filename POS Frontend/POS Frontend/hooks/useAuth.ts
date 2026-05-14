"use client";

import { useCallback, useEffect, useState } from "react";

export type AuthUser = {
  id?: number;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "employee" | "admin";
};

const AUTH_STATE_EVENT = "auth:state-updated";

function readStoredAuth() {
  if (typeof window === "undefined") {
    return { token: null as string | null, user: null as AuthUser | null };
  }

  try {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    return {
      token: storedToken || null,
      user: storedUser ? (JSON.parse(storedUser) as AuthUser) : null,
    };
  } catch {
    return { token: null as string | null, user: null as AuthUser | null };
  }
}

function broadcastAuthStateChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_STATE_EVENT));
}

export default function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const syncFromStorage = useCallback(() => {
    const snapshot = readStoredAuth();
    setToken(snapshot.token);
    setUser(snapshot.user);
  }, []);

  useEffect(() => {
    syncFromStorage();
    setLoading(false);

    const handleStorage = () => syncFromStorage();
    const handleAuthEvent = () => syncFromStorage();

    window.addEventListener("storage", handleStorage);
    window.addEventListener(AUTH_STATE_EVENT, handleAuthEvent);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(AUTH_STATE_EVENT, handleAuthEvent);
    };
  }, [syncFromStorage]);

  const login = useCallback((jwt: string, userData: AuthUser) => {
    localStorage.setItem("token", jwt);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(jwt);
    setUser(userData);
    broadcastAuthStateChange();
  }, []);

  const updateUser = useCallback((nextUser: Partial<AuthUser>) => {
    setUser((prevUser) => {
      if (!prevUser) return prevUser;
      const hasChanges = Object.entries(nextUser).some(([key, value]) => {
        const existingValue = prevUser[key as keyof AuthUser];
        return existingValue !== value;
      });
      if (!hasChanges) return prevUser;
      const mergedUser = { ...prevUser, ...nextUser };
      localStorage.setItem("user", JSON.stringify(mergedUser));
      broadcastAuthStateChange();
      return mergedUser;
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    broadcastAuthStateChange();
    window.location.href = "/login";
  }, []);

  return { user, token, loading, login, logout, updateUser };
}
