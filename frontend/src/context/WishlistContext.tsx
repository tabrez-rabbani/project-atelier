"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import authApiInstance from "@/lib/axios";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

interface WishlistContextType {
  wishlistIds: Set<string>;
  isWishlistLoaded: boolean;
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  removeWishlistId: (productId: string) => void;
  clearWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [isWishlistLoaded, setIsWishlistLoaded] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setWishlistIds(new Set());
      setIsWishlistLoaded(false);
      return;
    }

    const fetchIds = async () => {
      try {
        const res = await authApiInstance.get("/wishlist/ids");
        if (res.data?.success && Array.isArray(res.data.productIds)) {
          setWishlistIds(new Set(res.data.productIds));
        }
      } catch {
      } finally {
        setIsWishlistLoaded(true);
      }
    };

    fetchIds();
  }, [isAuthenticated, authLoading]);

  const toggleWishlist = useCallback(
    async (productId: string) => {
      if (!isAuthenticated) {
        toast.error("Please log in to add items to your wishlist.");
        return;
      }

      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (next.has(productId)) {
          next.delete(productId);
        } else {
          next.add(productId);
        }
        return next;
      });

      try {
        const res = await authApiInstance.post(`/wishlist/toggle/${productId}`);
        if (res.data?.success) {
          if (res.data.action === "added") {
            toast.success("Added to wishlist");
          } else {
            toast.success("Removed from wishlist");
          }
        }
      } catch {
        setWishlistIds((prev) => {
          const next = new Set(prev);
          if (next.has(productId)) {
            next.delete(productId);
          } else {
            next.add(productId);
          }
          return next;
        });
        toast.error("Failed to update wishlist. Please try again.");
      }
    },
    [isAuthenticated]
  );

  const isInWishlist = useCallback(
    (productId: string) => wishlistIds.has(productId),
    [wishlistIds]
  );

  const removeWishlistId = useCallback((productId: string) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  }, []);

  const clearWishlist = useCallback(async () => {
    setWishlistIds(new Set());
    try {
      localStorage.removeItem("atelier_wishlist_cache");
    } catch {}
    try {
      await authApiInstance.delete("/wishlist/clear/all");
    } catch {}
  }, []);

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        isWishlistLoaded,
        toggleWishlist,
        isInWishlist,
        removeWishlistId,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
