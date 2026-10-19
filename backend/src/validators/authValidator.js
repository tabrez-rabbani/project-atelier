import { body, validationResult } from "express-validator";
import AppError from "../utils/AppError.js";

export const validate = (req, res, next) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        const errorMessage = error.array()[0].msg;
        return next(new AppError(errorMessage, 400));
    }
    next();
};

// Registration Validator
export const registerValidator = [
    body("name")
        .trim()
        .notEmpty().withMessage("Full Name is required")
        .isLength({ min: 3, max: 50 }).withMessage("Full Name must be between 3 and 50 characters"),

    body("email")
        .trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Invalid email address")
        .normalizeEmail(),

    body("password")
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),

    body("phone")
        .notEmpty().withMessage("Contact number is required")
        .isNumeric().withMessage("Contact must be a number")
        .isLength({ min: 10, max: 15 }).withMessage("Contact must be between 10 to 15 digits"),

    validate,
];

// Login Validator
export const loginValidator = [
    body("email")
        .trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Invalid email address")
        .normalizeEmail(),

    body("password")
        .notEmpty().withMessage("Password is required"),

    validate,
];