"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { fadeIn, scaleUp } from "@/lib/animations";
import styles from "./BeautyBanner.module.css";

export default function BeautyBanner() {
  return (
    <motion.section
      className={styles.beautyBanner}
      aria-label="Maisoné Beauty Campaign"
      variants={fadeIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
    >
      <Link href="/collection/beauty" className={styles.beautyBanner__link}>
        <motion.div className={styles.beautyBanner__imageWrapper} variants={scaleUp}>
          <Image
            src="/images/hero/maisone_beauty.png"
            alt="Maisoné Beauty, Redefined"
            width={1680}
            height={936}
            sizes="100vw"
            className={styles.beautyBanner__image}
          />
        </motion.div>
      </Link>
    </motion.section>
  );
}
