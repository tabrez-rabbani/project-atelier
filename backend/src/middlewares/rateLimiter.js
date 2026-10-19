import rateLimit from "express-rate-limit";

// General limiter — applies to all API routes
// 500 requests per 15 minutes per IP (normal browsing, pagination, etc.)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests, please try again after 15 minutes.",
    },
});

// Strict limiter — only for login and register
// 15 attempts per 15 minutes per IP (prevents brute-force & credential stuffing)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many login/register attempts, please try again after 15 minutes.",
    },
});

export { apiLimiter, authLimiter };
