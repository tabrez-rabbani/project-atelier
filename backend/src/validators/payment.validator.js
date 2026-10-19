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

export const validateCreatePaymentOrder = [
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

    validateRequest,
];

export const validateVerifyPaymentOrder = [
    body("razorpay_order_id")
        .trim()
        .notEmpty().withMessage("Razorpay order ID is required"),
    body("razorpay_payment_id")
        .trim()
        .notEmpty().withMessage("Razorpay payment ID is required"),
    body("razorpay_signature")
        .trim()
        .notEmpty().withMessage("Razorpay signature is required"),

    validateRequest,
];
