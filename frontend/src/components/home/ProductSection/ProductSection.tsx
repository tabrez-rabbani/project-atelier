"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import ProductCard from "@/components/product/ProductCard/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/Skeleton/Skeleton";
import { Button } from "@/components";
import authApiInstance from "@/lib/axios";
import type { Product } from "@/types";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/animations";
import styles from "./ProductSection.module.css";

export default function ProductSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    try {
      const cached = sessionStorage.getItem("maisone_trending_products");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0 && isMounted) {
          setProducts(parsed);
          setLoading(false);
        }
      }
    } catch {}

    const fetchProducts = async () => {
      try {
        const response = await authApiInstance.get("/products?limit=8&sort=newest&isNewIn=false");
        if (response.data?.success && Array.isArray(response.data.products) && isMounted) {
          setProducts(response.data.products);
          try {
            sessionStorage.setItem("maisone_trending_products", JSON.stringify(response.data.products));
          } catch {}
        }
      } catch {
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!loading && products.length === 0) return null;

  const trendingProducts = products.map((product) => {
    const activeColor =
      product.colors?.find((c) => Array.isArray(c.images) && c.images.length > 0) ||
      product.colors?.[0];
    const mainImage = activeColor?.images?.[0] || "";
    const hoverImage = activeColor?.images?.[1] || mainImage;

    return {
      id: product._id,
      title: product.title,
      slug: product.slug,
      price: product.price?.amount || 0,
      originalPrice: product.originalPrice?.amount,
      mainImage,
      hoverImage,
      colors: (product.colors || []).map((c) => c.hex),
      colorsList: product.colors || [],
      colorName: activeColor?.name || "Default",
      sizes: product.sizes || [],
    };
  });

  return (
    <section className={`section ${styles.products}`} aria-label="Trending Products">
      <div className="container">
        <motion.div
          className={styles.products__header}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <h2 className={styles.products__title}>Trending Products</h2>
          <Link href="/collection" className={styles.products__viewAll}>
            View All <ArrowRight className={styles.products__arrow} size={16} strokeWidth={2.5} />
          </Link>
        </motion.div>

        <motion.div
          className={styles.products__grid}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {loading && products.length === 0
            ? Array.from({ length: 8 }).map((_, idx) => (
                <ProductCardSkeleton key={idx} />
              ))
            : trendingProducts.map((product) => (
                <motion.div key={product.id} variants={staggerItem}>
                  <ProductCard {...product} />
                </motion.div>
              ))}
        </motion.div>

        {products.length > 0 && (
          <motion.div
            className={styles.products__mobileAction}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
          >
            <Button href="/collection" variant="outline" fullWidth>
              View All Products
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
