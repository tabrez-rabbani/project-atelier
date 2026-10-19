"use client";

import dynamic from "next/dynamic";
import type { CSSProperties } from "react";
import { useLazySection } from "@/hooks/useLazySection";
import styles from "./HomeSections.module.css";

const NewInSection = dynamic(() => import("@/components/home/NewInSection/NewInSection"));
const BenefitsBar = dynamic(() => import("@/components/home/BenefitsBar/BenefitsBar"));
const CategorySection = dynamic(() => import("@/components/home/CategorySection/CategorySection"));
const CampaignBanners = dynamic(() => import("@/components/home/CampaignBanners/CampaignBanners"));
const ProductSection = dynamic(() => import("@/components/home/ProductSection/ProductSection"));
const BeautyBanner = dynamic(() => import("@/components/home/BeautyBanner/BeautyBanner"));

function LazySection({ children, minHeight = "400px" }: { children: React.ReactNode; minHeight?: string }) {
  const [ref, isVisible] = useLazySection("300px");
  return (
    <div
      ref={ref}
      className={isVisible ? undefined : styles.placeholder}
      style={isVisible ? undefined : ({ "--lazy-min-height": minHeight } as CSSProperties)}
    >
      {isVisible ? children : null}
    </div>
  );
}

export default function HomeSections() {
  return (
    <>
      <LazySection minHeight="500px">
        <NewInSection />
      </LazySection>
      <LazySection minHeight="100px">
        <BenefitsBar />
      </LazySection>
      <LazySection minHeight="400px">
        <CategorySection />
      </LazySection>
      <LazySection minHeight="400px">
        <CampaignBanners />
      </LazySection>
      <LazySection minHeight="500px">
        <ProductSection />
      </LazySection>
      <LazySection minHeight="300px">
        <BeautyBanner />
      </LazySection>
    </>
  );
}
