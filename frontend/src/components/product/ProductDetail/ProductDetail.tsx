"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart, Plus, Minus } from "lucide-react";
import authApiInstance from "@/lib/axios";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { toast } from "sonner";
import type { Product } from "@/types";
import { ProductDetailSkeleton } from "@/components/ui/Skeleton/Skeleton";
import styles from "./ProductDetail.module.css";

interface ProductDetailProps {
  slug: string;
}

const PRODUCT_CACHE_TTL = 10 * 60 * 1000;

function getCacheKey(slug: string) {
  return `pd_${slug}`;
}

export default function ProductDetail({ slug }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const router = useRouter();

  const { refreshCart, openCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const cacheKey = getCacheKey(slug);
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const { data, ts } = JSON.parse(cached);
          if (Date.now() - ts < PRODUCT_CACHE_TTL) {
            setProduct(data);
            setLoading(false);
            return;
          }
        }
        const response = await authApiInstance.get(`/products/detail/${slug}`);
        if (response.data.success) {
          setProduct(response.data.product);
          sessionStorage.setItem(cacheKey, JSON.stringify({ data: response.data.product, ts: Date.now() }));
        }
      } catch (error) {
        console.error("Failed to fetch product details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return <div className={styles.detail__notFound}>Product not found</div>;
  }

  const toggleAccordion = (section: string) => {
    setOpenAccordion(openAccordion === section ? null : section);
  };

  const handleColorChange = (idx: number) => {
    setSelectedColor(idx);
    setSelectedImage(0);
  };

  const formatINR = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  const handleAddToBag = async (isBuyNow = false) => {
    const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0;
    if (hasSizes && selectedSize === null) {
      toast.warning("Please select a size first");
      return;
    }

    try {
      if (isBuyNow) setIsBuyingNow(true);
      else setIsAddingToCart(true);

      const color = product.colors[selectedColor]?.name ?? "";
      const size = hasSizes && selectedSize !== null ? product.sizes[selectedSize] : "One Size";

      const response = await authApiInstance.post(`/cart/add/${product._id}`, {
        color,
        size,
        quantity: 1,
      });

      if (response.data.success) {
        await refreshCart();
        toast.success("Added to bag!");
        if (isBuyNow) {
          router.push("/cart");
        } else {
          openCart();
        }
      }
    } catch (error: unknown) {
      console.error("Failed to add to cart", error);
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to add to bag. Please ensure you are logged in.");
    } finally {
      setIsAddingToCart(false);
      setIsBuyingNow(false);
    }
  };

  return (
    <div className={styles.detail}>
      <div className={styles.detail__layout}>
        <div className={styles.gallery}>
          <div className={styles.gallery__thumbnails}>
            {product.colors[selectedColor]?.images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                className={`${styles.gallery__thumb} ${idx === selectedImage ? styles["gallery__thumb--active"] : ""}`}
                onClick={() => setSelectedImage(idx)}
                aria-label={`View image ${idx + 1}`}
              >
                <Image
                  src={img}
                  alt={`${product.title} ${idx + 1}`}
                  fill
                  sizes="80px"
                  className={styles.gallery__thumbImage}
                />
              </button>
            ))}
          </div>

          <div className={styles.gallery__main}>
            {product.colors[selectedColor]?.images[selectedImage] && (
              <Image
                key={product.colors[selectedColor].images[selectedImage]}
                src={product.colors[selectedColor].images[selectedImage]}
                alt={`${product.title} - ${product.colors[selectedColor].name} view`}
                fill
                sizes="(max-width: 767px) 100vw, 50vw"
                className={styles.gallery__mainImage}
                priority
              />
            )}
          </div>
        </div>

        <div className={styles.info}>
          <h1 className={styles.info__title}>{product.title}</h1>

          <div className={styles.info__priceRow}>
            <span className={styles.info__price}>{formatINR(product.price.amount)}</span>
            {product.originalPrice && (
              <span className={styles.info__originalPrice}>
                {formatINR(product.originalPrice.amount)}
              </span>
            )}
          </div>
          <p className={styles.info__tax}>MRP inclusive of all taxes</p>

          {product.colors.length > 0 && (
            <div className={styles.info__section}>
              <p className={styles.info__label}>
                COLOUR: <span className={styles.info__labelValue}>{product.colors[selectedColor].name}</span>
              </p>
              <div className={styles.info__colors}>
                {product.colors.map((color, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`${styles.info__colorThumbBtn} ${idx === selectedColor ? styles["info__colorThumbBtn--active"] : ""}`}
                    onClick={() => handleColorChange(idx)}
                    aria-label={`Select ${color.name}`}
                  >
                    {color.images && color.images.length > 0 ? (
                      <div className={styles.info__colorThumbWrapper}>
                        <Image 
                          src={color.images[0]} 
                          alt={color.name} 
                          fill 
                          sizes="64px"
                          className={styles.info__colorThumbImg} 
                        />
                      </div>
                    ) : (
                      <span
                        className={styles.info__colorFallback}
                        style={{ "--fallback-hex": color.hex } as React.CSSProperties}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.sizes.length > 0 && (
            <div className={styles.info__section}>
              <p className={styles.info__label}>SIZE</p>
              <div className={styles.info__sizes}>
                {product.sizes.map((size, idx) => (
                  <button
                    key={size}
                    type="button"
                    className={`${styles.info__sizeBtn} ${idx === selectedSize ? styles["info__sizeBtn--active"] : ""}`}
                    onClick={() => setSelectedSize(idx)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={styles.info__actions}>
            <button
              type="button"
              className={styles.info__addToBag}
              onClick={() => handleAddToBag(false)}
              disabled={isAddingToCart || isBuyingNow}
            >
              {isAddingToCart ? "ADDING..." : "ADD TO BAG"}
            </button>
            <button
              type="button"
              className={`${styles.info__addToBag} ${styles.info__buyNow}`}
              onClick={() => handleAddToBag(true)}
              disabled={isAddingToCart || isBuyingNow}
            >
              {isBuyingNow ? "PLEASE WAIT..." : "BUY IT NOW"}
            </button>
            <button 
              type="button"
              className={`${styles.info__wishlistBtn} ${isInWishlist(product._id) ? styles["info__wishlistBtn--active"] : ""}`} 
              aria-label={isInWishlist(product._id) ? "Remove from wishlist" : "Add to wishlist"}
              onClick={() => toggleWishlist(product._id)}
            >
              <Heart 
                size={22} 
                strokeWidth={1.5} 
                fill={isInWishlist(product._id) ? "currentColor" : "none"} 
              />
            </button>
          </div>

          <div className={styles.accordions}>
            {[
              { key: "description", title: "DESCRIPTION & FIT", content: product.description },
              { key: "materials", title: "MATERIALS", content: product.material },
              { key: "delivery", title: "DELIVERY AND PAYMENT", content: product.deliveryInfo },
            ].map((item) => (
              <div key={item.key} className={styles.accordion}>
                <button
                  type="button"
                  className={styles.accordion__trigger}
                  onClick={() => toggleAccordion(item.key)}
                  aria-expanded={openAccordion === item.key}
                >
                  <span>{item.title}</span>
                  {openAccordion === item.key ? (
                    <Minus size={18} strokeWidth={2} />
                  ) : (
                    <Plus size={18} strokeWidth={2} />
                  )}
                </button>
                {openAccordion === item.key && (
                  <div className={styles.accordion__content}>
                    <p>{item.content || "Not specified."}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
