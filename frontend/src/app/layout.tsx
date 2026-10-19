import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Cinzel } from "next/font/google";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { WishlistProvider } from "@/context/WishlistContext";
import CartDrawer from "@/components/cart/CartDrawer/CartDrawer";
import { Toaster } from "sonner";
import "./globals.css";

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const cinzel = Cinzel({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: "700",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MAISONÉ — Premium Fashion & Lifestyle",
    template: "%s | MAISONÉ",
  },
  description:
    "Discover modern fashion for a brighter you. Premium quality dresses, tops, accessories, and more with free shipping on orders over ₹999.",
  keywords: [
    "fashion",
    "women clothing",
    "premium fashion",
    "dresses",
    "accessories",
    "online shopping",
    "MAISONÉ",
  ],
  openGraph: {
    title: "MAISONÉ — Premium Fashion & Lifestyle",
    description:
      "Discover modern fashion for a brighter you. Premium quality dresses, tops, accessories, and more.",
    type: "website",
    locale: "en_US",
    siteName: "MAISONÉ",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${cormorantGaramond.variable} ${inter.variable} ${cinzel.variable}`}
      data-scroll-behavior="smooth"
    >
      <body suppressHydrationWarning>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              {children}
              <CartDrawer />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
