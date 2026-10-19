import jwt from "jsonwebtoken";
import AppError from "../utils/AppError.js";
import asyncHandler from "./asyncHandler.js";
import { config } from "../config/config.js";
import { findUserById } from "../dao/user.dao.js";

export const authenticateUser = asyncHandler(async (req, res, next) => {
    const token = req.cookies.accessToken;

    if (!token) {
        throw new AppError("Unauthorized", 401);
    }

    try {
        const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);
        const user = await findUserById(decoded.id);

        if (!user) {
            throw new AppError("User not found or deleted", 401);
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.statusCode) {
            return next(error);
        }
        if (error.name === "TokenExpiredError") {
            return next(new AppError("Token Expired", 401));
        }
        return next(new AppError("Invalid or Unauthorized Token", 401));
    }
});

export const authenticateSeller = asyncHandler(async (req, res, next) => {
    const token = req.cookies.accessToken;

    if (!token) {
        throw new AppError("Unauthorized", 401);
    }

    try {
        const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);
        const user = await findUserById(decoded.id);

        if (!user) {
            throw new AppError("User not found or deleted", 401);
        }

        if (user.role !== "admin") {
            throw new AppError("Forbidden: Admin access required", 403);
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.statusCode) {
            return next(error);
        }
        if (error.name === "TokenExpiredError") {
            return next(new AppError("Token Expired", 401));
        }
        return next(new AppError("Invalid or Unauthorized Token", 401));
    }
});