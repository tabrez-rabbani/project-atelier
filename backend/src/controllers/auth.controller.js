import { loginService, registerUserService, refreshAccessTokenService, googleLoginService } from "../services/auth.service.js";
import { updateRefreshToken } from "../dao/user.dao.js";
import userModel from "../models/user.model.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import { config } from "../config/config.js";

const isProduction = config.NODE_ENV === "production";

const accessCookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: 15 * 60 * 1000, // 15 minutes
};

const refreshCookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const clearCookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
};

const formatUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    role: user.role,
    createdAt: user.createdAt,
    streetAddress: user.streetAddress || "",
    city: user.city || "",
    state: user.state || "",
    postalCode: user.postalCode || "",
    country: user.country || "",
});

export const registerController = asyncHandler(async (req, res) => {
    const { userResponse, accessToken, refreshToken } = await registerUserService(req.body);

    res.cookie("accessToken", accessToken, accessCookieOptions);
    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    res.status(201).json({
        success: true,
        message: "User registered successfully",
        user: userResponse,
    });
});

export const loginController = asyncHandler(async (req, res) => {
    const { accessToken, refreshToken, userResponse } = await loginService(req.body);

    res.cookie("accessToken", accessToken, accessCookieOptions);
    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    res.status(200).json({
        success: true,
        message: "User logged in successfully",
        user: userResponse,
    });
});

export const getMe = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        message: "User fetched successfully",
        user: formatUser(req.user),
    });
});

export const updateProfile = asyncHandler(async (req, res) => {
    const { name, phone, streetAddress, city, state, postalCode, country, password } = req.body;

    const user = await userModel.findById(req.user._id);
    if (!user) throw new AppError("User not found", 404);

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (streetAddress !== undefined) user.streetAddress = streetAddress;
    if (city !== undefined) user.city = city;
    if (state !== undefined) user.state = state;
    if (postalCode !== undefined) user.postalCode = postalCode;
    if (country !== undefined) user.country = country;
    if (password && password.trim()) user.password = password;

    await user.save();

    res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: formatUser(user),
    });
});

export const logOut = asyncHandler(async (req, res) => {
    await updateRefreshToken(req.user._id, "");

    res.clearCookie("accessToken", clearCookieOptions);
    res.clearCookie("refreshToken", clearCookieOptions);

    res.status(200).json({
        success: true,
        message: "User logged out successfully",
    });
});

export const googleCallback = asyncHandler(async (req, res) => {
    const state = req.query.state || "user";
    const frontendUrl = config.CLIENT_URL;

    try {
        const { accessToken, refreshToken } = await googleLoginService(req.user, state);

        res.cookie("accessToken", accessToken, accessCookieOptions);
        res.cookie("refreshToken", refreshToken, refreshCookieOptions);

        const redirectPath = state === "admin" ? "/admin?auth=google_success" : "/?auth=google_success";
        res.redirect(`${frontendUrl}${redirectPath}`);
    } catch {
        const errorPath = state === "admin" ? "/admin-login?error=unauthorized" : "/account/login?error=unauthorized";
        res.redirect(`${frontendUrl}${errorPath}`);
    }
});

export const refreshTokenController = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken;
    if (!incomingRefreshToken) throw new AppError("Unauthorized access", 401);

    const accessToken = await refreshAccessTokenService(incomingRefreshToken);
    res.cookie("accessToken", accessToken, accessCookieOptions);

    res.status(200).json({
        success: true,
        message: "Access token refreshed successfully",
    });
});