"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useAuth from "@/hooks/useAuth";
import {
  addFavoritePizza,
  deleteFavoritePizza,
  listFavoritePizzas,
  type FavoritePizzaPayload,
  type FavoritePizzaRead,
} from "@/lib/api/favorites";

export type FavoritePizza = {
  id: string;
  serverId?: number;
  menuItemId?: number;
  name: string;
  description?: string;
  image: string;
  price: number;
  rating?: number;
  defaultSize?: string;
  defaultCrust?: string;
  extras?: string[];
  orderCount?: number;
  lastOrderedAt?: string;
  createdAt: string;
};

export type FavoritePizzaInput = Omit<FavoritePizza, "id" | "createdAt"> & {
  id?: string;
};

const FAVORITES_STORAGE_KEY_GUEST = "fhp:favorites:guest";
const FAVORITES_UPDATED_EVENT = "favorites:updated";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeReadFavorites(storageKey: string): FavoritePizza[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FavoritePizza[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.id === "string" && typeof item.name === "string");
  } catch {
    return [];
  }
}

function persistFavorites(storageKey: string, next: FavoritePizza[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey, JSON.stringify(next));
  window.dispatchEvent(new Event(FAVORITES_UPDATED_EVENT));
}

function buildFavoriteId(input: { id?: string; menuItemId?: number; name: string }) {
  if (input.id?.trim()) return input.id.trim();
  if (typeof input.menuItemId === "number") return `menu:${input.menuItemId}`;
  return `name:${slugify(input.name)}`;
}

function normalizeFavorite(input: FavoritePizzaInput): FavoritePizza {
  return {
    id: buildFavoriteId(input),
    serverId: input.serverId,
    menuItemId: input.menuItemId,
    name: input.name,
    description: input.description,
    image: input.image,
    price: Number(input.price || 0),
    rating: input.rating,
    defaultSize: input.defaultSize || "Medium",
    defaultCrust: input.defaultCrust || "Hand Tossed",
    extras: input.extras || [],
    orderCount: input.orderCount,
    lastOrderedAt: input.lastOrderedAt,
    createdAt: new Date().toISOString(),
  };
}

function parseServerId(favoriteId: string): number | null {
  if (!favoriteId.startsWith("server:")) return null;
  const raw = favoriteId.slice("server:".length);
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function fromApiFavorite(input: FavoritePizzaRead): FavoritePizza {
  return {
    id: `server:${input.id}`,
    serverId: input.id,
    menuItemId: input.menu_item_id ?? undefined,
    name: input.name,
    description: input.description ?? undefined,
    image: input.image_url ?? "",
    price: Number(input.price || 0),
    rating: input.rating ?? undefined,
    defaultSize: input.default_size ?? "Medium",
    defaultCrust: input.default_crust ?? "Hand Tossed",
    extras: input.extras || [],
    createdAt: input.created_at,
  };
}

function toApiPayload(input: FavoritePizzaInput): FavoritePizzaPayload {
  return {
    menu_item_id: input.menuItemId,
    name: input.name,
    description: input.description,
    image_url: input.image,
    price: Number(input.price || 0),
    rating: input.rating,
    default_size: input.defaultSize || "Medium",
    default_crust: input.defaultCrust || "Hand Tossed",
    extras: input.extras || [],
  };
}

export function useFavorites() {
  const { user, token } = useAuth();
  const [favorites, setFavorites] = useState<FavoritePizza[]>([]);

  const isAuthenticated = useMemo(() => Boolean(user && token), [token, user]);

  const loadFromGuestStorage = useCallback(() => {
    setFavorites(safeReadFavorites(FAVORITES_STORAGE_KEY_GUEST));
  }, []);

  const loadFromServer = useCallback(async () => {
    try {
      const data = await listFavoritePizzas();
      setFavorites((Array.isArray(data) ? data : []).map(fromApiFavorite));
    } catch {
      setFavorites([]);
    }
  }, []);

  const reloadFavorites = useCallback(async () => {
    if (isAuthenticated) {
      await loadFromServer();
      return;
    }
    loadFromGuestStorage();
  }, [isAuthenticated, loadFromGuestStorage, loadFromServer]);

  useEffect(() => {
    reloadFavorites();
  }, [reloadFavorites]);

  useEffect(() => {
    if (isAuthenticated) return;

    const onStorage = (event: StorageEvent) => {
      if (!event.key) return;
      if (event.key === FAVORITES_STORAGE_KEY_GUEST) loadFromGuestStorage();
    };

    const onFavoritesEvent = () => loadFromGuestStorage();

    window.addEventListener("storage", onStorage);
    window.addEventListener(FAVORITES_UPDATED_EVENT, onFavoritesEvent);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(FAVORITES_UPDATED_EVENT, onFavoritesEvent);
    };
  }, [isAuthenticated, loadFromGuestStorage]);

  const isFavorite = useCallback(
    (menuItemId?: number, name?: string) => {
      const menuMatch = typeof menuItemId === "number" ? menuItemId : undefined;
      const normalizedName = name?.trim().toLowerCase();

      return favorites.some((item) => {
        if (typeof menuMatch === "number" && item.menuItemId === menuMatch) return true;
        if (normalizedName && item.name.trim().toLowerCase() === normalizedName) return true;
        return false;
      });
    },
    [favorites]
  );

  const addFavorite = useCallback(
    async (input: FavoritePizzaInput) => {
      if (isAuthenticated) {
        await addFavoritePizza(toApiPayload(input));
        await loadFromServer();
        return;
      }

      const nextFavorite = normalizeFavorite(input);
      setFavorites((prev) => {
        if (prev.some((item) => item.id === nextFavorite.id)) return prev;
        const next = [nextFavorite, ...prev];
        persistFavorites(FAVORITES_STORAGE_KEY_GUEST, next);
        return next;
      });
    },
    [isAuthenticated, loadFromServer]
  );

  const removeFavorite = useCallback(
    async (favoriteId: string) => {
      if (isAuthenticated) {
        const serverId = parseServerId(favoriteId);
        if (serverId != null) {
          await deleteFavoritePizza(serverId);
        } else {
          const existing = favorites.find((item) => item.id === favoriteId);
          if (existing?.serverId != null) {
            await deleteFavoritePizza(existing.serverId);
          }
        }
        await loadFromServer();
        return;
      }

      setFavorites((prev) => {
        const next = prev.filter((item) => item.id !== favoriteId);
        persistFavorites(FAVORITES_STORAGE_KEY_GUEST, next);
        return next;
      });
    },
    [favorites, isAuthenticated, loadFromServer]
  );

  const toggleFavorite = useCallback(
    async (input: FavoritePizzaInput) => {
      const matchByMenu =
        typeof input.menuItemId === "number"
          ? favorites.find((item) => item.menuItemId === input.menuItemId)
          : undefined;
      const matchByName = favorites.find((item) => item.name.trim().toLowerCase() === input.name.trim().toLowerCase());
      const existing = matchByMenu || matchByName;

      if (existing) {
        await removeFavorite(existing.id);
        return false;
      }

      await addFavorite(input);
      return true;
    },
    [addFavorite, favorites, removeFavorite]
  );

  const clearFavorites = useCallback(async () => {
    if (isAuthenticated) {
      for (const favorite of favorites) {
        if (favorite.serverId != null) {
          await deleteFavoritePizza(favorite.serverId);
        }
      }
      await loadFromServer();
      return;
    }

    setFavorites([]);
    persistFavorites(FAVORITES_STORAGE_KEY_GUEST, []);
  }, [favorites, isAuthenticated, loadFromServer]);

  return {
    favorites,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    clearFavorites,
    reloadFavorites,
  };
}
