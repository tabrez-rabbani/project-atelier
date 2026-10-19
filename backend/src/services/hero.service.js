import {
    insertHeroSlide,
    fetchAllHeroSlides,
    fetchActiveHeroSlides,
    findHeroSlideById,
    updateHeroSlideById,
    removeHeroSlideById,
} from "../dao/hero.dao.js";
import AppError from "../utils/AppError.js";
import { uploadFile } from "./storage.service.js";

export const createHero = async (data, files) => {
    const {
        title,
        eyebrow,
        subtitle,
        description,
        ctaText,
        ctaLink,
        ratingText,
        showSocialProof,
        order,
        isActive,
    } = data;

    if (!title || !title.trim()) {
        throw new AppError("Hero banner title is required", 400);
    }

    let desktopImageUrl = data.desktopImage || "";
    let mobileImageUrl = data.mobileImage || "";

    const desktopFile = files?.desktopImage?.[0];
    const mobileFile = files?.mobileImage?.[0];

    // Upload desktop banner image if provided
    if (desktopFile && desktopFile.buffer) {
        const cleanName = desktopFile.originalname ? desktopFile.originalname.replace(/\s+/g, "-") : "hero.jpg";
        const result = await uploadFile({
            buffer: desktopFile.buffer,
            fileName: `${Date.now()}-desktop-${cleanName}`,
            folder: "maisone/hero",
        });
        desktopImageUrl = result.url;
    }

    // Upload mobile banner image if provided
    if (mobileFile && mobileFile.buffer) {
        const cleanName = mobileFile.originalname ? mobileFile.originalname.replace(/\s+/g, "-") : "hero-mob.jpg";
        const result = await uploadFile({
            buffer: mobileFile.buffer,
            fileName: `${Date.now()}-mobile-${cleanName}`,
            folder: "maisone/hero",
        });
        mobileImageUrl = result.url;
    }

    if (!desktopImageUrl) {
        throw new AppError("Desktop banner image is required", 400);
    }

    const heroDoc = {
        title: title.trim(),
        eyebrow: eyebrow ? eyebrow.trim() : "New Collection",
        subtitle: subtitle ? subtitle.trim() : "",
        description: description ? description.trim() : "Fashion for a Brighter You. Premium quality. Everyday confidence.",
        ctaText: ctaText ? ctaText.trim() : "Shop New Collection",
        ctaLink: ctaLink ? ctaLink.trim() : "/collection",
        desktopImage: desktopImageUrl,
        mobileImage: mobileImageUrl || desktopImageUrl,
        ratingText: ratingText ? ratingText.trim() : "10K+ Happy Customer",
        showSocialProof: showSocialProof === "false" || showSocialProof === false ? false : true,
        order: Number(order) || 0,
        isActive: isActive === "false" || isActive === false ? false : true,
    };

    return await insertHeroSlide(heroDoc);
};

export const updateHero = async (id, data, files) => {
    const existing = await findHeroSlideById(id);
    if (!existing) {
        throw new AppError("Hero banner slide not found", 404);
    }

    const updateData = {};

    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.eyebrow !== undefined) updateData.eyebrow = data.eyebrow.trim();
    if (data.subtitle !== undefined) updateData.subtitle = data.subtitle.trim();
    if (data.description !== undefined) updateData.description = data.description.trim();
    if (data.ctaText !== undefined) updateData.ctaText = data.ctaText.trim();
    if (data.ctaLink !== undefined) updateData.ctaLink = data.ctaLink.trim();
    if (data.ratingText !== undefined) updateData.ratingText = data.ratingText.trim();
    if (data.showSocialProof !== undefined) {
        updateData.showSocialProof = data.showSocialProof !== "false" && data.showSocialProof !== false;
    }
    if (data.order !== undefined) updateData.order = Number(data.order) || 0;
    if (data.isActive !== undefined) {
        updateData.isActive = data.isActive !== "false" && data.isActive !== false;
    }

    const desktopFile = files?.desktopImage?.[0];
    const mobileFile = files?.mobileImage?.[0];

    if (desktopFile && desktopFile.buffer) {
        const cleanName = desktopFile.originalname ? desktopFile.originalname.replace(/\s+/g, "-") : "hero.jpg";
        const result = await uploadFile({
            buffer: desktopFile.buffer,
            fileName: `${Date.now()}-desktop-${cleanName}`,
            folder: "maisone/hero",
        });
        updateData.desktopImage = result.url;
    } else if (data.desktopImage) {
        updateData.desktopImage = data.desktopImage;
    }

    if (mobileFile && mobileFile.buffer) {
        const cleanName = mobileFile.originalname ? mobileFile.originalname.replace(/\s+/g, "-") : "hero-mob.jpg";
        const result = await uploadFile({
            buffer: mobileFile.buffer,
            fileName: `${Date.now()}-mobile-${cleanName}`,
            folder: "maisone/hero",
        });
        updateData.mobileImage = result.url;
    } else if (data.mobileImage) {
        updateData.mobileImage = data.mobileImage;
    }

    return await updateHeroSlideById(id, updateData);
};

export const getAllHeroes = async () => {
    return await fetchAllHeroSlides();
};

export const getActiveHeroes = async () => {
    return await fetchActiveHeroSlides();
};

export const getHeroById = async (id) => {
    const hero = await findHeroSlideById(id);
    if (!hero) {
        throw new AppError("Hero banner slide not found", 404);
    }
    return hero;
};

export const deleteHero = async (id) => {
    const hero = await removeHeroSlideById(id);
    if (!hero) {
        throw new AppError("Hero banner slide not found", 404);
    }
    return hero;
};

export const toggleHeroActive = async (id) => {
    const hero = await findHeroSlideById(id);
    if (!hero) {
        throw new AppError("Hero banner slide not found", 404);
    }
    hero.isActive = !hero.isActive;
    return await hero.save();
};
