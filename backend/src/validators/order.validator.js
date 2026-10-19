import { body, validationResult } from "express-validator";

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: errors.array()[0].msg || "Validation failed",
            errors: errors.array(),
        });
    }
    next();
};

export const validatePlaceOrder = [
    body("shippingAddress.fullName")
        .trim()
        .notEmpty().withMessage("Full name is required")
        .isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
    body("shippingAddress.email")
        .trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Please enter a valid email address"),
    body("shippingAddress.phone")
        .trim()
        .notEmpty().withMessage("Phone number is required")
        .matches(/^[0-9+\s\-()]{7,15}$/).withMessage("Please enter a valid phone number"),
    body("shippingAddress.streetAddress")
        .trim()
        .notEmpty().withMessage("Street address is required"),
    body("shippingAddress.city")
        .trim()
        .notEmpty().withMessage("City is required"),
    body("shippingAddress.state")
        .trim()
        .notEmpty().withMessage("State is required"),
    body("shippingAddress.postalCode")
        .trim()
        .notEmpty().withMessage("Postal code is required"),
    body("shippingAddress.country")
        .optional()
        .trim(),
    body("paymentMethod")
        .optional()
        .isIn(["online", "cod", "direct"]).withMessage("Invalid payment method"),

    validateRequest,
];
