import { param, body, validationResult } from "express-validator";
import AppError from "../utils/AppError.js";

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessage = errors.array()[0].msg;
        return next(new AppError(errorMessage, 400));
    }
    next();
};

export const validateAddToCart = [
    param("productId").isMongoId().withMessage("Invalid product ID"),
    body("color").trim().notEmpty().withMessage("Color is required"),
    body("size").trim().notEmpty().withMessage("Size is required"),
    body("quantity").optional().isInt({ min: 1 }).withMessage("Quantity must be at least 1"),

    validateRequest,
];

export const validateIncrementCartItemQuantity = [
    param("productId").isMongoId().withMessage("Invalid product ID"),
    body("color").trim().notEmpty().withMessage("Color is required"),
    body("size").trim().notEmpty().withMessage("Size is required"),

    validateRequest,
];