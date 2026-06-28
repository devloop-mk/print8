"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  clearCartStorage,
  loadCartFromStorage,
  saveCartToStorage,
} from "@/lib/storage/cart-storage";

export type CartItemType = "service" | "design" | "product";

export interface CartItem {
  id: string;
  type: CartItemType;
  name: string;
  price: number;
  quantity: number;
  metadata?: Record<string, string | number | boolean>;
  designPreview?: string;
  backDesignPreview?: string;
  leftDesignPreview?: string;
  rightDesignPreview?: string;
  fileIds?: string[];
}

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

  useEffect(() => {
    let cancelled = false;

    loadCartFromStorage()
      .then((stored) => {
        if (!cancelled && stored) {
          setItems(stored);
        }
      })
      .catch(() => {
        // ignore corrupt storage
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

  const addItem = useCallback((item: Omit<CartItem, "id">) => {
    setItems((prev) => [
      ...prev,
      { ...item, id: crypto.randomUUID() },
    ]);
  }, []);

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

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        itemCount,
        hydrated,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
