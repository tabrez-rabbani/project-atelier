"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Heart, X } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import authApiInstance from "@/lib/axios";
import { toast } from "sonner";
import type { ProductColor } from "@/types";
import styles from "./ProductCard.module.css";

export interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  mainImage: string;
  hoverImage: string;
  colors: string[];
  colorsList?: ProductColor[];
  colorName?: string;
  sizes?: string[];
  slug: string;
}

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export default function ProductCard({
  id,
  title,
  price,
  originalPrice,
  mainImage,
  hoverImage,
  colors = [],
  colorsList,
  colorName,
  sizes = [],
  slug,
}: ProductCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { openCart, refreshCart, addItem } = useCart();
  const wishlisted = isInWishlist(id);

  const [isSizeOpen, setIsSizeOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addingSize, setAddingSize] = useState<string | null>(null);
  const [selectedColorIdx, setSelectedColorIdx] = useState<number | null>(null);

  const availableSizes = Array.isArray(sizes)
    ? sizes.filter((s): s is string => Boolean(s && typeof s === "string" && s.trim()))
    : [];
  const hasSizes = availableSizes.length > 0;

  const activeColor =
    selectedColorIdx !== null && colorsList && colorsList[selectedColorIdx]
      ? colorsList[selectedColorIdx]
      : null;
  const displayMainImage = activeColor?.images?.[0] || mainImage;
  const displayHoverImage = activeColor?.images?.[1] || activeColor?.images?.[0] || hoverImage;
  const activeColorName = activeColor?.name || colorName || (colorsList?.[0]?.name ?? "Default");

  useEffect(() => {
    if (!isSizeOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setIsSizeOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSizeOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSizeOpen]);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(id);
  };

  const handleAddToCart = async (sizeToSelect: string) => {
    if (isAdding) return;

    try {
      setIsAdding(true);
      setAddingSize(sizeToSelect);

      try {
        const response = await authApiInstance.post(`/cart/add/${id}`, {
          color: activeColorName,
          size: sizeToSelect,
          quantity: 1,
        });

        if (response.data?.success) {
          await refreshCart();
          openCart();
          toast.success(`${title} added to bag!`);
          setIsSizeOpen(false);
          return;
        }
      } catch (apiError: unknown) {
        const errStatus = (apiError as { response?: { status?: number } })?.response?.status;
        if (errStatus === 401) {
          addItem({
            id,
            title,
            price,
            image: displayMainImage,
            color: activeColorName,
            size: sizeToSelect,
            quantity: 1,
          });
          openCart();
          toast.success(`${title} added to bag!`);
          setIsSizeOpen(false);
          return;
        }
        throw apiError;
      }
    } catch (error: unknown) {
      console.error("Failed to add to cart", error);
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to add to bag.";
      toast.error(message);
    } finally {
      setIsAdding(false);
      setAddingSize(null);
    }
  };

  const handlePlusClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (hasSizes) {
      setIsSizeOpen((prev) => !prev);
    } else {
      await handleAddToCart("One Size");
    }
  };

  const handleSizeSelect = async (e: React.MouseEvent, sz: string) => {
    e.preventDefault();
    e.stopPropagation();
    await handleAddToCart(sz);
  };

  const handleColorClick = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedColorIdx(idx);
  };

  const productHref = slug ? `/product/${slug}` : `/product/${id}`;

  return (
    <div className={styles.card} ref={cardRef}>
      <div className={styles.card__imageContainer}>
        <Link href={productHref} className={styles.card__imageLink} tabIndex={-1}>
          <div className={styles.card__imageWrapper}>
            {displayMainImage ? (
              <Image
                src={displayMainImage}
                alt={title}
                fill
                sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
                className={`${styles.card__image} ${styles["card__image--main"]}`}
              />
            ) : (
              <div className={styles.card__noImage}>No Image</div>
            )}
            {displayHoverImage && displayHoverImage !== displayMainImage ? (
              <Image
                src={displayHoverImage}
                alt={`${title} alternate view`}
                fill
                sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
                className={`${styles.card__image} ${styles["card__image--hover"]}`}
              />
            ) : null}
          </div>
        </Link>

        <button
          type="button"
          className={`${styles.card__wishlist} ${wishlisted ? styles["card__wishlist--active"] : ""}`}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          onClick={handleWishlistClick}
        >
          <Heart
            size={18}
            strokeWidth={1.5}
            fill={wishlisted ? "currentColor" : "none"}
          />
        </button>

        {isSizeOpen && hasSizes && (
          <div
            className={styles.card__sizeOverlay}
            role="dialog"
            aria-label="Size selection"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div className={styles.card__sizeHeader}>
              <span className={styles.card__sizeTitle}>Select Size</span>
              <button
                type="button"
                className={styles.card__sizeCloseBtn}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsSizeOpen(false);
                }}
                aria-label="Close size selector"
              >
                <X size={14} strokeWidth={2} />
              </button>
            </div>

            <div className={styles.card__sizeList}>
              {availableSizes.map((sz) => {
                const isLoadingCurrent = isAdding && addingSize === sz;
                return (
                  <button
                    key={sz}
                    type="button"
                    className={`${styles.card__sizeBtn} ${isLoadingCurrent ? styles["card__sizeBtn--loading"] : ""}`}
                    onClick={(e) => handleSizeSelect(e, sz)}
                    disabled={isAdding}
                    aria-label={`Select size ${sz}`}
                    aria-busy={isLoadingCurrent ? "true" : undefined}
                  >
                    {isLoadingCurrent ? (
                      <span className={styles.card__miniSpinner} aria-hidden="true" />
                    ) : (
                      sz
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className={styles.card__content}>
        <Link href={productHref} className={styles.card__titleLink}>
          <h3 className={styles.card__title}>{title}</h3>
        </Link>

        <div className={styles.card__footer}>
          <div className={styles.card__priceGroup}>
            <span className={styles.card__price}>{formatINR(price)}</span>
            {originalPrice ? (
              <span className={styles.card__originalPrice}>
                {formatINR(originalPrice)}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            className={`${styles.card__addToCart} ${isSizeOpen ? styles["card__addToCart--open"] : ""}`}
            aria-label={
              hasSizes
                ? isSizeOpen
                  ? "Close size selection"
                  : `Select size to add ${title} to cart`
                : `Add ${title} to cart`
            }
            onClick={handlePlusClick}
            disabled={isAdding && !hasSizes}
            aria-busy={isAdding && !hasSizes ? "true" : undefined}
          >
            {isAdding && !hasSizes ? (
              <span className={styles.card__miniSpinner} aria-hidden="true" />
            ) : (
              <Plus
                size={20}
                strokeWidth={2}
                className={`${styles.card__plusIcon} ${isSizeOpen ? styles["card__plusIcon--active"] : ""}`}
              />
            )}
          </button>
        </div>

        {colors.length > 0 && (
          <div className={styles.card__colors}>
            {colors.map((color, idx) => (
              <button
                key={idx}
                type="button"
                className={`${styles.card__colorSwatch} ${selectedColorIdx === idx ? styles["card__colorSwatch--active"] : ""}`}
                style={{ "--swatch-bg": color } as React.CSSProperties}
                aria-label={`Select color ${colorsList?.[idx]?.name || color}`}
                aria-pressed={selectedColorIdx === idx}
                onClick={(e) => handleColorClick(e, idx)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
