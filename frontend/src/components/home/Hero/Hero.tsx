"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components";
import authApiInstance from "@/lib/axios";
import { heroContainer, heroTextVariants } from "@/lib/animations";
import styles from "./Hero.module.css";

interface HeroSlide {
  _id: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
  desktopImage: string;
  mobileImage?: string;
  ratingText?: string;
  showSocialProof?: boolean;
  order?: number;
}

export default function Hero() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    try {
      const cached = sessionStorage.getItem("maisone_hero_slides");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0 && isMounted) {
          setSlides(parsed);
          setLoading(false);
        }
      }
    } catch {}

    const fetchHeroBanners = async () => {
      try {
        const res = await authApiInstance.get("/hero");
        if (res.data?.success && Array.isArray(res.data.slides)) {
          if (isMounted) {
            setSlides(res.data.slides);
            try {
              sessionStorage.setItem("maisone_hero_slides", JSON.stringify(res.data.slides));
            } catch {}
          }
        }
      } catch {
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHeroBanners();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6500);

    return () => clearInterval(timer);
  }, [slides.length]);

  const renderFormattedText = (text?: string) => {
    if (!text) return null;
    const parts = text.split(/\r?\n|<br\s*\/?>/i);
    if (parts.length > 1) {
      return parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && <br />}
        </span>
      ));
    }
    const words = text.split(" ");
    if (words.length === 2) {
      return (
        <>
          {words[0]}<br />{words[1]}
        </>
      );
    }
    return text;
  };

  if (loading && slides.length === 0) {
    return (
      <section className={`${styles.hero} ${styles.heroSkeleton}`} aria-label="Loading Campaign Hero">
        <div className={styles.heroSkeletonImagePlaceholder} aria-hidden="true">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.heroSkeletonImageIcon}>
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
            <circle cx="9" cy="9" r="2"/>
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
          </svg>
        </div>
        <div className={`container ${styles.hero__wrapper}`}>
          <div className={styles.hero__content}>
            <div className={styles.skeletonEyebrow} />
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonTitleSecond} />
            <div className={styles.skeletonDescription} />
            <div className={styles.skeletonCta} />
            <div className={styles.skeletonSocial} />
          </div>
        </div>
      </section>
    );
  }

  if (slides.length === 0) {
    return null;
  }

  const activeSlide = slides[currentIndex] || slides[0];

  return (
    <section className={styles.hero} aria-label="Campaign Hero">
      <div className={styles.hero__background}>
        <picture className={styles.hero__picture}>
          {activeSlide.mobileImage && (
            <source
              srcSet={activeSlide.mobileImage}
              media="(max-width: 767px)"
            />
          )}
          <Image
            src={activeSlide.desktopImage}
            alt={activeSlide.title || "MAISONÉ Campaign"}
            fill
            priority
            className={styles.hero__image}
            sizes="(max-width: 767px) 100vw, 100vw"
          />
        </picture>
      </div>

      <div className={`container ${styles.hero__wrapper}`}>
        <motion.div
          className={styles.hero__content}
          key={activeSlide._id || currentIndex}
          variants={heroContainer}
          initial="hidden"
          animate="visible"
        >
          {activeSlide.eyebrow && (
            <motion.span variants={heroTextVariants} className={styles.hero__eyebrow}>
              {activeSlide.eyebrow}
            </motion.span>
          )}

          <motion.h1 variants={heroTextVariants} className={styles.hero__title}>
            {renderFormattedText(activeSlide.title)}
          </motion.h1>

          {activeSlide.description && (
            <motion.p variants={heroTextVariants} className={styles.hero__description}>
              {renderFormattedText(activeSlide.description)}
            </motion.p>
          )}

          <motion.div variants={heroTextVariants}>
            <Button
              href={activeSlide.ctaLink || "/collection"}
              variant="secondary"
              size="lg"
              showArrow
              className={styles.hero__cta}
            >
              <span className={styles.hero__ctaDesktop}>{activeSlide.ctaText || "Shop New Collection"}</span>
              <span className={styles.hero__ctaMobile}>Shop Now</span>
            </Button>
          </motion.div>

          {activeSlide.showSocialProof !== false && (
            <motion.div variants={heroTextVariants} className={styles.hero__socialProof}>
              <div className={styles.hero__ratingInfo}>
                <span className={styles.hero__ratingText}>{activeSlide.ratingText || "10K+ Happy Customers"}</span>
                <div className={styles.hero__stars}>★★★★★</div>
              </div>
            </motion.div>
          )}

          {slides.length > 1 && (
            <div className={styles.hero__controls} role="tablist" aria-label="Hero carousel controls">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  role="tab"
                  aria-selected={idx === currentIndex}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`${styles.hero__dot} ${idx === currentIndex ? styles["hero__dot--active"] : ""}`}
                  onClick={() => setCurrentIndex(idx)}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
