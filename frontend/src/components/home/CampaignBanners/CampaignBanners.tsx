"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { slideLeft, slideRight, fadeUp } from "@/lib/animations";
import styles from "./CampaignBanners.module.css";

const MotionLink = motion.create(Link);

interface Campaign {
  id: number;
  subtitle: string;
  title: string;
  description: string;
  buttonText: string;
  link: string;
  image: string;
  color: "light" | "dark";
  align: "left" | "right";
}

const campaigns: Campaign[] = [
  {
    id: 1,
    subtitle: "WOMEN'S COLLECTION",
    title: "EFFORTLESS\nELEGANCE",
    description: "Modern styles for every moment.",
    buttonText: "SHOP WOMEN",
    link: "/collection/women",
    image: "/images/campaigns/left_image.png",
    color: "light",
    align: "left",
  },
  {
    id: 2,
    subtitle: "ACCESSORIES",
    title: "COMPLETE\nYOUR LOOK",
    description: "Details that make the difference.",
    buttonText: "ACCESSORIES",
    link: "/collection/accessories",
    image: "/images/campaigns/right_image.png",
    color: "light",
    align: "right",
  },
];

export default function CampaignBanners() {
  return (
    <section className={styles.campaigns} aria-label="Current Campaigns">
      <div className="container">
        <div className={styles.campaigns__grid}>
          {campaigns.map((campaign) => (
            <MotionLink
              key={campaign.id}
              href={campaign.link}
              className={`${styles.banner} ${styles[`banner--${campaign.color}Text`]} ${styles[`banner--align${campaign.align}`]}`}
              variants={campaign.align === "left" ? slideLeft : slideRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
            >
              <div className={styles.banner__bg}>
                <Image
                  src={campaign.image}
                  alt={campaign.title.replace(/\n/g, " ")}
                  fill
                  sizes="(max-width: 767px) 100vw, 50vw"
                  className={styles.banner__image}
                />
                <div className={styles.banner__overlay} />
              </div>

              <motion.div
                className={styles.banner__content}
                variants={fadeUp}
              >
                <span className={styles.banner__subtitle}>{campaign.subtitle}</span>
                <h2 className={styles.banner__title}>
                  {campaign.title.split("\n").map((line, i, arr) => (
                    <span key={i}>
                      {line}
                      {i < arr.length - 1 && <br />}
                    </span>
                  ))}
                </h2>
                <p className={styles.banner__description}>{campaign.description}</p>
                <span className={styles.banner__button}>
                  {campaign.buttonText}{" "}
                  <ArrowRight className={styles.banner__buttonIcon} size={15} strokeWidth={2.5} />
                </span>
              </motion.div>
            </MotionLink>
          ))}
        </div>
      </div>
    </section>
  );
}
