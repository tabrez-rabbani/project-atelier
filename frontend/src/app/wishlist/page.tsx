"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, X, ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import authApiInstance from "@/lib/axios";
import { toast } from "sonner";
import styles from "./wishlist.module.css";

interface WishlistProduct {
  _id: string;
  title: string;
  slug: string;
  price: number | { amount?: number };
  originalPrice?: number | { amount?: number };
  image?: string;
  images?: string[];
  colors?: Array<{
    name: string;
    hex: string;
    images: string[];
  }>;
  sizes?: string[];
  rating?: number;
  inStock?: boolean;
}

const WISHLIST_CACHE_KEY = "atelier_wishlist_cache";

const getPriceAmount = (val: unknown): number => {
  if (!val) return 0;
  if (typeof val === "number") return val;
  if (
    typeof val === "object" &&
    val !== null &&
    "amount" in val &&
    typeof (val as { amount: unknown }).amount === "number"
  ) {
    return (val as { amount: number }).amount;
  }
  const parsed = Number(val);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export default function WishlistPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toggleWishlist, removeWishlistId, clearWishlist } = useWishlist();
  const { refreshCart, openCart } = useCart();

  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({});

  useEffect(() => {
    document.title = "My Wishlist | MAISONÉ";
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setProducts([]);
      setLoading(false);
      try {
        sessionStorage.removeItem(WISHLIST_CACHE_KEY);
      } catch {}
      return;
    }

    let hasCached = false;
    try {
      const cached = sessionStorage.getItem(WISHLIST_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setProducts(parsed);
          setLoading(false);
          hasCached = true;
          const defaults: Record<string, string> = {};
          parsed.forEach((p: WishlistProduct) => {
            if (p.sizes && p.sizes.length > 0) {
              defaults[p._id] = p.sizes[0];
            }
          });
          setSelectedSizes(defaults);
        }
      }
    } catch {}

    const fetchWishlist = async () => {
      try {
        if (!hasCached) {
          setLoading(true);
        }
        const res = await authApiInstance.get("/wishlist");
        if (res.data?.success && Array.isArray(res.data.wishlist)) {
          const list: WishlistProduct[] = res.data.wishlist;
          setProducts(list);
          try {
            sessionStorage.setItem(WISHLIST_CACHE_KEY, JSON.stringify(list));
          } catch {}
          const defaults: Record<string, string> = {};
          list.forEach((p) => {
            if (p.sizes && p.sizes.length > 0) {
              defaults[p._id] = p.sizes[0];
            }
          });
          setSelectedSizes((prev) => ({ ...defaults, ...prev }));
        }
      } catch (error) {
        console.error("Failed to load wishlist", error);
        if (!hasCached) {
          toast.error("Could not load your wishlist.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [isAuthenticated, authLoading]);

  const handleRemove = async (productId: string) => {
    setProducts((prev) => {
      const updated = prev.filter((p) => p._id !== productId);
      try {
        sessionStorage.setItem(WISHLIST_CACHE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    await toggleWishlist(productId);
  };

  const handleClearAll = async () => {
    if (products.length === 0) return;
    const currentProducts = [...products];
    setProducts([]);
    try {
      sessionStorage.removeItem(WISHLIST_CACHE_KEY);
      await clearWishlist();
      toast.success("Wishlist cleared");
    } catch {
      setProducts(currentProducts);
      try {
        sessionStorage.setItem(WISHLIST_CACHE_KEY, JSON.stringify(currentProducts));
      } catch {}
      toast.error("Failed to clear wishlist.");
    }
  };

  const handleAddToCart = async (product: WishlistProduct) => {
    const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0;
    const size = hasSizes
      ? selectedSizes[product._id] || product.sizes?.[0] || "One Size"
      : "One Size";

    if (hasSizes && !size) {
      toast.warning("Please select a size first.");
      return;
    }

    const color = product.colors?.[0]?.name || "Default";

    try {
      setAddingToCart((prev) => ({ ...prev, [product._id]: true }));
      const res = await authApiInstance.post(`/wishlist/move-to-bag/${product._id}`, {
        color,
        size,
        quantity: 1,
      });

      if (res.data?.success) {
        setProducts((prev) => {
          const updated = prev.filter((p) => p._id !== product._id);
          try {
            sessionStorage.setItem(WISHLIST_CACHE_KEY, JSON.stringify(updated));
          } catch {}
          return updated;
        });
        removeWishlistId(product._id);
        await refreshCart();
        toast.success(`Moved ${product.title} to bag!`);
        openCart();
      }
    } catch (error: unknown) {
      const errObj = error as { response?: { data?: { message?: string } } };
      toast.error(errObj.response?.data?.message || "Failed to move to bag.");
    } finally {
      setAddingToCart((prev) => ({ ...prev, [product._id]: false }));
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main>
        <div className={`container ${styles.mainContainer}`}>
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Wishlist</h1>
            {isAuthenticated && !loading && products.length > 0 && (
              <span className={styles.itemCount}>
                {products.length} {products.length === 1 ? "Item" : "Items"}
              </span>
            )}
          </div>

          {!authLoading && !isAuthenticated && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconWrapper}>
                <Heart className={styles.emptyHeartIcon} strokeWidth={1.2} />
              </div>
              <h2 className={styles.emptyTitle}>Sign in to view your wishlist</h2>
              <p className={styles.emptyDesc}>
                Log in to keep track of your favourite items and access them across all your devices.
              </p>
              <Link href="/account/login" className={styles.primaryBtn}>
                <span>Sign In to Account</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          )}

          {loading && isAuthenticated && (
            <div className={styles.grid}>
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className={styles.skeletonCard}>
                  <div className={styles.skeletonImage} />
                  <div className={styles.skeletonBody}>
                    <div className={styles.skeletonTitle} />
                    <div className={styles.skeletonPrice} />
                    <div className={styles.skeletonButton} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && isAuthenticated && products.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconWrapper}>
                <Heart className={styles.emptyHeartIcon} strokeWidth={1.2} />
              </div>
              <h2 className={styles.emptyTitle}>Your wishlist is empty</h2>
              <p className={styles.emptyDesc}>
                Explore our curated collection and add the pieces you love by tapping the heart icon.
              </p>
              <Link href="/collection" className={styles.primaryBtn}>
                <span>Explore Collection</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          )}

          {!loading && isAuthenticated && products.length > 0 && (
            <>
              <div className={styles.topBar}>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className={styles.clearAllBtn}
                >
                  Clear Wishlist
                </button>
              </div>

              <div className={styles.grid}>
                {products.map((product) => {
                  const imageSrc =
                    product.colors?.[0]?.images?.[0] ||
                    product.image ||
                    product.images?.[0] ||
                    "/images/categories/accessories.jpg";
                  const price = getPriceAmount(product.price);
                  const originalPrice = getPriceAmount(product.originalPrice);

                  return (
                    <div key={product._id} className={styles.card}>
                      <div className={styles.imageBox}>
                        <Link href={`/product/${product.slug}`} className={styles.imageLink}>
                          <Image
                            src={imageSrc}
                            alt={product.title}
                            fill
                            sizes="(max-width: 480px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className={styles.productImg}
                          />
                        </Link>

                        <button
                          type="button"
                          className={styles.removeBtn}
                          onClick={() => handleRemove(product._id)}
                          aria-label="Remove from wishlist"
                          title="Remove"
                        >
                          <X size={15} strokeWidth={2} />
                        </button>

                        {product.inStock === false && (
                          <span className={styles.badgeStock}>Out of stock</span>
                        )}
                      </div>

                      <div className={styles.cardContent}>
                        <div className={styles.cardHeader}>
                          <Link
                            href={`/product/${product.slug}`}
                            className={styles.productTitle}
                            title={product.title}
                          >
                            {product.title}
                          </Link>

                          <div className={styles.priceRow}>
                            <span className={styles.price}>
                              {formatINR(price)}
                            </span>
                            {originalPrice > price && (
                              <span className={styles.originalPrice}>
                                {formatINR(originalPrice)}
                              </span>
                            )}
                          </div>
                        </div>

                        {product.sizes && product.sizes.length > 0 && (
                          <div className={styles.sizeRow}>
                            <span className={styles.sizeLabel}>Size:</span>
                            <div className={styles.sizePills}>
                              {product.sizes.map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  className={`${styles.sizePill} ${
                                    selectedSizes[product._id] === s
                                      ? styles.sizePillActive
                                      : ""
                                  }`}
                                  onClick={() =>
                                    setSelectedSizes((prev) => ({
                                      ...prev,
                                      [product._id]: s,
                                    }))
                                  }
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <button
                          type="button"
                          className={styles.addToBagBtn}
                          disabled={
                            product.inStock === false ||
                            addingToCart[product._id]
                          }
                          onClick={() => handleAddToCart(product)}
                        >
                          {product.inStock === false
                            ? "Out of Stock"
                            : addingToCart[product._id]
                            ? "Adding..."
                            : "Move to Bag"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
