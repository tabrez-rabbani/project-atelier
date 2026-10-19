import asyncHandler from "../middlewares/asyncHandler.js";
import { addCategory, updateCategory as updateCategoryService, getCategories, deleteCategory } from "../services/category.service.js";

export const createCategory = asyncHandler(async (req, res) => {
    const file = req.file || req.files?.[0] || null;
    const category = await addCategory(req.body.name, file);

    res.status(201).json({
        success: true,
        message: "Category created successfully",
        category,
    });
});

export const updateCategory = asyncHandler(async (req, res) => {
    const file = req.file || req.files?.[0] || null;
    const category = await updateCategoryService(req.params.id, req.body, file);

    res.status(200).json({
        success: true,
        message: "Category updated successfully",
        category,
    });
});

export const getAllCategories = asyncHandler(async (req, res) => {
    const categories = await getCategories();

    res.status(200).json({
        success: true,
        message: "Categories fetched successfully",
        categories,
    });
});

export const removeCategory = asyncHandler(async (req, res) => {
    await deleteCategory(req.params.id);

    res.status(200).json({
        success: true,
        message: "Category deleted successfully",
    });
});
