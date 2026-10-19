"use client";

import { Truck, ShieldCheck, Package, Headset } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/animations";
import styles from "./BenefitsBar.module.css";

const benefits = [
  {
    icon: Truck,
    title: "FREE SHIPPING",
    description: "On all orders over ₹999",
  },
  {
    icon: ShieldCheck,
    title: "SECURE PAYMENTS",
    description: "100% safe & trusted",
  },
  {
    icon: Package,
    title: "EASY RETURNS",
    description: "Hassle-free shopping",
  },
  {
    icon: Headset,
    title: "24/7 SUPPORT",
    description: "We're here for you",
  },
];

export default function BenefitsBar() {
  const renderBenefitItems = (prefix: string) =>
    benefits.map((benefit, idx) => {
      const Icon = benefit.icon;
      return (
        <div key={`${prefix}-${idx}`} className={styles.benefit}>
          <Icon className={styles.benefit__icon} strokeWidth={1.5} />
          <div className={styles.benefit__content}>
            <h3 className={styles.benefit__title}>{benefit.title}</h3>
            <p className={styles.benefit__description}>
              {benefit.description}
            </p>
          </div>
        </div>
      );
    });

  return (
    <motion.section
      className={styles.benefits}
      aria-label="Store Benefits"
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
    >
      <div className={styles.benefits__container}>
        <div className={styles.benefits__track}>
          <div className={styles.benefits__group}>
            {renderBenefitItems("main")}
          </div>
          <div className={styles.benefits__groupClone} aria-hidden="true">
            {renderBenefitItems("clone")}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
