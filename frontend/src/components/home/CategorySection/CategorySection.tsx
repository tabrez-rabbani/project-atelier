"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import authApiInstance from "@/lib/axios";
import { CategorySkeleton } from "@/components/ui/Skeleton/Skeleton";
import type { Category } from "@/types";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/animations";
import styles from "./CategorySection.module.css";

const MotionLink = motion.create(Link);

const CATEGORY_DISPLAY_ORDER = [
  "dresses",
  "dress",
  "tops",
  "top",
  "bottoms",
  "bottom",
  "bags",
  "bag",
  "accessories",
  "accessory",
  "jewelry",
  "beauty",
  "footwear",
  "shoes",
];

const getCategoryRank = (cat: Category) => {
  const slug = (cat.slug || cat.name || "").toLowerCase().trim();
  const idx = CATEGORY_DISPLAY_ORDER.findIndex((key) => slug === key || slug.startsWith(key));
  return idx === -1 ? 999 : idx;
};

const formatDisplayName = (name: string) => {
  if (!name) return "";
  if (name === name.toUpperCase()) {
    return name
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
  return name;
};

export default function CategorySection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    try {
      const cached = sessionStorage.getItem("maisone_categories");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0 && isMounted) {
          setCategories(parsed);
          setLoading(false);
        }
      }
    } catch {}

    const fetchCategories = async () => {
      try {
        const response = await authApiInstance.get("/categories");
        if (response.data?.success && Array.isArray(response.data.categories) && isMounted) {
          const sorted = [...response.data.categories].sort((a, b) => {
            return getCategoryRank(a) - getCategoryRank(b);
          });
          setCategories(sorted);
          try {
            sessionStorage.setItem("maisone_categories", JSON.stringify(sorted));
          } catch {}
        }
      } catch {
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!loading && categories.length === 0) return null;

  return (
    <section className={`section ${styles.category}`} aria-label="Shop by Category">
      <div className="container">
        <motion.div
          className={styles.category__header}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <h2 className={styles.category__title}>Shop By Category</h2>
          <Link href="/collection" className={styles.category__viewAll}>
            View All <span className={styles.category__arrow}>→</span>
          </Link>
        </motion.div>

        <motion.div
          className={styles.category__grid}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {loading && categories.length === 0
            ? Array.from({ length: 8 }).map((_, idx) => (
                <CategorySkeleton key={idx} />
              ))
            : categories.map((cat) => {
                const categorySlug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, "-");
                const displayName = formatDisplayName(cat.name);

                return (
                  <MotionLink
                    key={cat._id || cat.name}
                    href={`/collection/${categorySlug}`}
                    className={styles.category__item}
                    variants={staggerItem}
                  >
                    <div className={styles.category__imageWrapper}>
                      {cat.image ? (
                        <Image
                          src={cat.image}
                          alt={`Shop ${displayName} collection`}
                          fill
                          sizes="(max-width: 600px) 28vw, (max-width: 1023px) 18vw, 140px"
                          className={styles.category__image}
                        />
                      ) : (
                        <div className={styles.category__noImage}>
                          <span>{displayName.slice(0, 2).toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                    <span className={styles.category__name}>{displayName}</span>
                  </MotionLink>
                );
              })}
        </motion.div>
      </div>
    </section>
  );
}
