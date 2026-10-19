import { body } from "express-validator";
import { validate } from "./authValidator.js";

export const productValidator = [
    body("title")
        .trim()
        .notEmpty().withMessage("Product title is required")
        .isString().withMessage("Title must be a string"),

    body("description")
        .trim()
        .notEmpty().withMessage("Product description is required"),

    body("category")
        .trim()
        .notEmpty().withMessage("Category is required"),

    body("priceAmount")
        .notEmpty().withMessage("Price amount is required")
        .isFloat({ min: 0 }).withMessage("Price must be a positive number"),

    body("priceCurrency")
        .optional()
        .isString().withMessage("Currency must be a string"),

    body("sizes")
        .optional()
        .custom((value) => {
            if (Array.isArray(value)) return true;
            try {
                const parsed = JSON.parse(value);
                if (!Array.isArray(parsed)) throw new Error();
                return true;
            } catch (error) {
                throw new Error("Sizes must be a valid JSON array");
            }
        }),

    body("colors")
        .optional()
        .custom((value) => {
            if (Array.isArray(value)) return true;
            try {
                const parsed = JSON.parse(value);
                if (!Array.isArray(parsed)) throw new Error();
                return true;
            } catch (error) {
                throw new Error("Colors must be a valid JSON array");
            }
        }),

    validate,
];
