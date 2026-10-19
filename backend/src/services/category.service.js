import {
    insertCategory,
    fetchAllCategories,
    findCategoryByName,
    findCategoryById,
    updateCategoryById,
    removeCategoryById,
} from "../dao/category.dao.js";
import AppError from "../utils/AppError.js";
import { uploadFile } from "./storage.service.js";

export const addCategory = async (name, file) => {
    if (!name || !name.trim()) {
        throw new AppError("Category name is required", 400);
    }

    const trimmedName = name.trim();
    const slug = trimmedName.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");

    const existingCategory = await findCategoryByName(trimmedName);
    if (existingCategory) {
        throw new AppError("Category already exists", 400);
    }

    let imageUrl = "";
    if (file && file.buffer) {
        const result = await uploadFile({
            buffer: file.buffer,
            fileName: `${Date.now()}-${file.originalname ? file.originalname.replace(/\s+/g, "-") : "category.jpg"}`,
            folder: "maisone/categories",
        });
        imageUrl = result.url;
    }

    return await insertCategory({ name: trimmedName, slug, image: imageUrl });
};

export const updateCategory = async (id, { name }, file) => {
    const category = await findCategoryById(id);
    if (!category) {
        throw new AppError("Category not found", 404);
    }

    const updateData = {};
    if (name && name.trim()) {
        const trimmedName = name.trim();
        // If name is changing, check if another category has the same name
        if (trimmedName.toLowerCase() !== category.name.toLowerCase()) {
            const existing = await findCategoryByName(trimmedName);
            if (existing && existing._id.toString() !== id) {
                throw new AppError("A category with this name already exists", 400);
            }
        }
        updateData.name = trimmedName;
        updateData.slug = trimmedName.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
    }

    if (file && file.buffer) {
        const result = await uploadFile({
            buffer: file.buffer,
            fileName: `${Date.now()}-${file.originalname ? file.originalname.replace(/\s+/g, "-") : "category.jpg"}`,
            folder: "maisone/categories",
        });
        updateData.image = result.url;
    }

    return await updateCategoryById(id, updateData);
};

export const getCategories = async () => {
    return await fetchAllCategories();
};

export const deleteCategory = async (id) => {
    const category = await removeCategoryById(id);
    if (!category) {
        throw new AppError("Category not found", 404);
    }
    return category;
};
