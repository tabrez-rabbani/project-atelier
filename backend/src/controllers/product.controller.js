import asyncHandler from "../middlewares/asyncHandler.js";
import { createProduct as createProductService, getAllProducts as getAllProductsService, getProductDetails as getProductDetailsService, deleteProduct, updateProduct, getAvailableColors, searchProducts as searchProductsService } from "../services/product.service.js";
import { getProductById } from "../dao/product.dao.js";
import AppError from "../utils/AppError.js";

export const createProduct = asyncHandler(async (req, res) => {
    const product = await createProductService(req.body, req.files, req.user._id);

    res.status(201).json({
        success: true,
        message: "Product created successfully",
        product,
    });
});

export const editProduct = asyncHandler(async (req, res) => {
    const product = await updateProduct(req.params.id, req.body, req.files);

    res.status(200).json({
        success: true,
        message: "Product updated successfully",
        product,
    });
});

export const getAllProducts = asyncHandler(async (req, res) => {
    const { products, pagination } = await getAllProductsService(req.query);

    res.status(200).json({
        success: true,
        message: "Products fetched successfully",
        products,
        pagination,
    });
});

export const getColors = asyncHandler(async (req, res) => {
    const colors = await getAvailableColors(req.query.category);

    res.status(200).json({
        success: true,
        message: "Colors fetched successfully",
        colors,
    });
});

export const getProductDetails = asyncHandler(async (req, res) => {
    const product = await getProductDetailsService(req.params.slug);

    res.status(200).json({
        success: true,
        message: "Product fetched successfully",
        product,
    });
});

export const getAdminProductById = asyncHandler(async (req, res) => {
    const product = await getProductById(req.params.id);
    if (!product) throw new AppError("Product not found", 404);

    res.status(200).json({
        success: true,
        product,
    });
});

export const removeProduct = asyncHandler(async (req, res) => {
    await deleteProduct(req.params.id);

    res.status(200).json({
        success: true,
        message: "Product deleted successfully",
    });
});

export const searchProducts = asyncHandler(async (req, res) => {
    const result = await searchProductsService(req.query);

    res.status(200).json({
        success: true,
        message: "Search results fetched successfully",
        ...result,
    });
});