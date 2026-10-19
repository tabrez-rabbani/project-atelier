import asyncHandler from "../middlewares/asyncHandler.js";
import { createHero, updateHero, getAllHeroes, getActiveHeroes, getHeroById, deleteHero, toggleHeroActive } from "../services/hero.service.js";

export const getActiveHeroSlidesController = asyncHandler(async (req, res) => {
    const slides = await getActiveHeroes();

    res.status(200).json({
        success: true,
        message: "Active hero banners fetched successfully",
        slides,
    });
});

export const getAllHeroSlidesController = asyncHandler(async (req, res) => {
    const slides = await getAllHeroes();

    res.status(200).json({
        success: true,
        message: "All hero banners fetched successfully",
        slides,
    });
});

export const getHeroSlideByIdController = asyncHandler(async (req, res) => {
    const slide = await getHeroById(req.params.id);

    res.status(200).json({
        success: true,
        slide,
    });
});

export const createHeroSlideController = asyncHandler(async (req, res) => {
    const slide = await createHero(req.body, req.files);

    res.status(201).json({
        success: true,
        message: "Hero banner created successfully",
        slide,
    });
});

export const updateHeroSlideController = asyncHandler(async (req, res) => {
    const slide = await updateHero(req.params.id, req.body, req.files);

    res.status(200).json({
        success: true,
        message: "Hero banner updated successfully",
        slide,
    });
});

export const toggleHeroStatusController = asyncHandler(async (req, res) => {
    const slide = await toggleHeroActive(req.params.id);
    const action = slide.isActive ? "activated" : "deactivated";

    res.status(200).json({
        success: true,
        message: `Hero banner ${action} successfully`,
        slide,
    });
});

export const deleteHeroSlideController = asyncHandler(async (req, res) => {
    await deleteHero(req.params.id);

    res.status(200).json({
        success: true,
        message: "Hero banner deleted successfully",
    });
});
