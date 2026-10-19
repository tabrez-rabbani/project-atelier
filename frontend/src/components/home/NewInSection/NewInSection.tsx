"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import authApiInstance from "@/lib/axios";
import type { Product } from "@/types";
import { NewInCardSkeleton } from "@/components/ui/Skeleton/Skeleton";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/animations";
import styles from "./NewInSection.module.css";

const MotionLink = motion.create(Link);

export default function NewInSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    try {
      const cached = sessionStorage.getItem("maisone_new_in_products");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0 && isMounted) {
          setProducts(parsed);
          setLoading(false);
        }
      }
    } catch {}

    const fetchNewInProducts = async () => {
      try {
        const response = await authApiInstance.get("/products?isNewIn=true&limit=12&sort=newest");
        if (response.data?.success && Array.isArray(response.data.products) && isMounted) {
          setProducts(response.data.products);
          try {
            sessionStorage.setItem("maisone_new_in_products", JSON.stringify(response.data.products));
          } catch {}
        }
      } catch {
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchNewInProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading && products.length === 0) {
    return (
      <section className={styles.newIn} aria-label="New In Collection">
        <div className={styles.newIn__container}>
          <div className={styles.newIn__header}>
            <h2 className={styles.newIn__title}>NEW IN</h2>
          </div>

          <div className={styles.newIn__grid}>
            {Array.from({ length: 12 }).map((_, idx) => (
              <NewInCardSkeleton key={idx} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className={styles.newIn} aria-label="New In Collection">
      <div className={styles.newIn__container}>
        <motion.div
          className={styles.newIn__header}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <h2 className={styles.newIn__title}>NEW IN</h2>
        </motion.div>

        <motion.div
          className={styles.newIn__grid}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {products.map((product, index) => {
            const image =
              product.colors?.find((c) => Array.isArray(c.images) && c.images.length > 0)?.images[0] ||
              product.colors?.[0]?.images?.[0] ||
              null;
            if (!image) return null;

            return (
              <MotionLink
                key={product._id}
                href={product.slug ? `/product/${product.slug}` : `/product/${product._id}`}
                className={styles.newIn__card}
                title={product.title}
                variants={staggerItem}
              >
                <div className={styles.newIn__imageWrapper}>
                  <Image
                    src={image}
                    alt={product.title || "New In Product"}
                    width={360}
                    height={480}
                    sizes="(max-width: 580px) 50vw, (max-width: 860px) 33vw, (max-width: 1200px) 25vw, 16vw"
                    priority={index < 2}
                    className={styles.newIn__image}
                  />
                </div>
              </MotionLink>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
