import { config } from "../config/config.js";

const isProduction = config.NODE_ENV === "production";

const ErrorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal server error";

    // 1. Handle Mongoose invalid ObjectId format (CastError)
    if (err.name === "CastError") {
        statusCode = 400;
        message = `Invalid ${err.path || "ID"} format: "${err.value}"`;
    }
    // 2. Handle MongoDB duplicate key error (E11000)
    else if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue || {})[0] || "field";
        message = `This ${field} "${err.keyValue?.[field]}" already exists. Please use a different ${field}.`;
    }
    // 3. Handle Mongoose schema validation error
    else if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors || {})
            .map((item) => item.message)
            .join(", ") || "Validation failed";
    }
    // 4. Handle JWT token errors (fallback)
    else if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid authentication token. Please log in again.";
    }
    else if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Authentication token expired. Please log in again.";
    }

    // 5. Server error logging & production sanitization
    if (statusCode >= 500) {
        console.error("Server Error:", err);
        if (isProduction) {
            message = "An unexpected server error occurred. Please try again later.";
        }
    }

    res.status(statusCode).json({
        success: false,
        message,
    });
};

export default ErrorHandler;