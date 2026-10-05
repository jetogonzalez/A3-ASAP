"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import type { Configuration } from "@/lib/catalog";
import { cartSchema, type CartItemInput } from "@/lib/schema";

const STORAGE_KEY = "pliego-cart-v1";

type ArtworkRef = NonNullable<CartItemInput["artwork"]>;
type CartSnapshot = { ready: boolean; items: CartItemInput[] };

const SERVER_SNAPSHOT: CartSnapshot = { ready: false, items: [] };
let snapshot: CartSnapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();

function readStorage(): CartItemInput[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = cartSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data;
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return [];
}

function ensureClientSnapshot(): void {
  if (snapshot.ready || typeof window === "undefined") return;
  snapshot = { ready: true, items: readStorage() };
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): CartSnapshot {
  ensureClientSnapshot();
  return snapshot;
}

function getServerSnapshot(): CartSnapshot {
  return SERVER_SNAPSHOT;
}

function write(items: CartItemInput[]): void {
  snapshot = { ready: true, items };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  for (const listener of listeners) listener();
}

type CartContextValue = {
  ready: boolean;
  items: CartItemInput[];
  count: number;
  addItem: (configuration: Configuration, artwork: ArtworkRef | null) => void;
  updateItem: (id: string, configuration: Configuration, artwork: ArtworkRef | null) => void;
  removeItem: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const value = useMemo<CartContextValue>(
    () => ({
      ready: current.ready,
      items: current.items,
      count: current.items.length,
      addItem: (configuration, artwork) => {
        write(
          [...getSnapshot().items, { id: crypto.randomUUID(), configuration, artwork }].slice(-20),
        );
      },
      updateItem: (id, configuration, artwork) => {
        write(
          getSnapshot().items.map((item) =>
            item.id === id ? { ...item, configuration, artwork } : item,
          ),
        );
      },
      removeItem: (id) => write(getSnapshot().items.filter((item) => item.id !== id)),
      clear: () => write([]),
    }),
    [current],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart debe usarse dentro de CartProvider");
  return value;
}
