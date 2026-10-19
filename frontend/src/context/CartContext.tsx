"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import authApiInstance from "@/lib/axios";
import { useAuth } from "./AuthContext";

export interface CartItem {
  id: string;
  title: string;
  price: number;
  image: string;
  color: string;
  size: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  isLoading: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (id: string, color: string, size: string) => void;
  updateQuantity: (id: string, color: string, size: string, quantity: number) => void;
  totalItems: number;
  subtotal: number;
  refreshCart: () => Promise<void>;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const prevAuthRef = useRef(isAuthenticated);
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const cached = localStorage.getItem("atelier_cart_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
        }
      }
    } catch {}
  }, []);

  const refreshCart = useCallback(async () => {
    try {
      const response = await authApiInstance.get("/cart");
      if (response.data.success && response.data.cart?.items) {
        const fetchedItems = response.data.cart.items.map((item: {
          product: {
            _id: string;
            title: string;
            price?: { amount: number };
            colors?: { name: string; images?: string[] }[];
          };
          currentPrice?: { amount: number };
          color: string;
          size: string;
          quantity: number;
        }) => {
          const colorData = item.product.colors?.find((c) => c.name === item.color);
          return {
            id: item.product._id,
            title: item.product.title,
            price: item.currentPrice?.amount || item.product.price?.amount || 0,
            image: colorData?.images?.[0] || item.product.colors?.[0]?.images?.[0] || "",
            color: item.color,
            size: item.size,
            quantity: item.quantity,
          };
        });
        setItems(fetchedItems);
        try {
          localStorage.setItem("atelier_cart_cache", JSON.stringify(fetchedItems));
        } catch {}
      } else {
        setItems([]);
        try {
          localStorage.removeItem("atelier_cart_cache");
        } catch {}
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem("atelier_cart_cache");
    } catch {}
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated) {
      refreshCart();
    } else {
      setIsLoading(false);
      if (prevAuthRef.current && !isAuthenticated) {
        clearCart();
      }
    }

    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated, authLoading, refreshCart, clearCart]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback((newItem: CartItem) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.id === newItem.id && i.color === newItem.color && i.size === newItem.size
      );
      let updated: CartItem[];
      if (existing) {
        updated = prev.map((i) =>
          i.id === newItem.id && i.color === newItem.color && i.size === newItem.size
            ? { ...i, quantity: i.quantity + newItem.quantity }
            : i
        );
      } else {
        updated = [...prev, newItem];
      }
      try {
        localStorage.setItem("atelier_cart_cache", JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback(async (id: string, color: string, size: string) => {
    setItems((prev) => {
      const updated = prev.filter((i) => !(i.id === id && i.color === color && i.size === size));
      try {
        localStorage.setItem("atelier_cart_cache", JSON.stringify(updated));
      } catch {}
      return updated;
    });
    try {
      await authApiInstance.delete(`/cart/remove/${id}`, { data: { color, size } });
      refreshCart();
    } catch {
      refreshCart();
    }
  }, [refreshCart]);

  const updateQuantity = useCallback(async (id: string, color: string, size: string, quantity: number) => {
    if (quantity < 1) return;

    const item = items.find((i) => i.id === id && i.color === color && i.size === size);
    if (!item) return;

    const isIncrement = quantity > item.quantity;
    const endpoint = isIncrement ? `/cart/quantity/increment/${id}` : `/cart/quantity/decrement/${id}`;

    setItems((prev) => {
      const updated = prev.map((i) =>
        i.id === id && i.color === color && i.size === size ? { ...i, quantity } : i
      );
      try {
        localStorage.setItem("atelier_cart_cache", JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      await authApiInstance.patch(endpoint, { color, size });
      refreshCart();
    } catch {
      refreshCart();
    }
  }, [items, refreshCart]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, isOpen, isLoading, openCart, closeCart, addItem, removeItem, updateQuantity, totalItems, subtotal, refreshCart, clearCart }}
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
