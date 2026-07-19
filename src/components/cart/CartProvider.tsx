"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  clearCartStorage,
  loadCartFromStorage,
  saveCartToStorage,
} from "@/lib/storage/cart-storage";
import type { CartItem } from "@/lib/cart/types";

export type { CartItem, CartItemType } from "@/lib/cart/types";

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  updateItem: (id: string, updates: Partial<Omit<CartItem, "id">>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
  hydrated: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const preHydrationAdds = useRef<CartItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    loadCartFromStorage()
      .then((stored) => {
        if (cancelled) return;
        const extras = preHydrationAdds.current;
        preHydrationAdds.current = [];
        setItems([...(stored ?? []), ...extras]);
      })
      .catch(() => {
        if (cancelled) return;
        const extras = preHydrationAdds.current;
        preHydrationAdds.current = [];
        if (extras.length > 0) {
          setItems(extras);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setHydrated(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    void saveCartToStorage(items);
  }, [items, hydrated]);

  const addItem = useCallback(
    (item: Omit<CartItem, "id">) => {
      const next: CartItem = { ...item, id: crypto.randomUUID() };
      if (!hydrated) {
        preHydrationAdds.current.push(next);
      }
      setItems((prev) => [...prev, next]);
    },
    [hydrated],
  );

  const updateItem = useCallback(
    (id: string, updates: Partial<Omit<CartItem, "id">>) => {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...updates } : i)),
      );
    },
    [],
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i)),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    void clearCartStorage();
  }, []);

  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items],
  );

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      addItem,
      updateItem,
      removeItem,
      updateQuantity,
      clearCart,
      total,
      itemCount,
      hydrated,
    }),
    [
      items,
      addItem,
      updateItem,
      removeItem,
      updateQuantity,
      clearCart,
      total,
      itemCount,
      hydrated,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
