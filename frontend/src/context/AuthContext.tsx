"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import authApiInstance from "@/lib/axios";
import { toast } from "sonner";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const response = await authApiInstance.get("/auth/get-me");
        if (response.data.success) {
          const userData = response.data.user;
          setUser(userData);

          const params = new URLSearchParams(window.location.search);
          if (params.get("auth") === "google_success") {
            const firstName = userData?.name ? userData.name.split(" ")[0] : "Customer";
            toast.success(`Welcome back, ${firstName}! Signed in with Google.`);
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const logout = async () => {
    try {
      await authApiInstance.get("/auth/logout");
      setUser(null);
      try {
        localStorage.removeItem("atelier_cart_cache");
        localStorage.removeItem("atelier_wishlist_cache");
      } catch {}
      toast.success("You have been signed out successfully.");
    } catch {
      toast.error("Sign out failed. Please try again.");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        setUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
