import {
    createUser,
    findUserByEmail,
    findUserByEmailOrPhone,
    updateRefreshToken,
    findUserByIdWithToken,
    findUserByGoogleId,
    createGoogleUser,
} from "../dao/user.dao.js";
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import AppError from "../utils/AppError.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateTokens.js";

export const registerUserService = async (userData) => {
    const { name, email, password, phone } = userData;

    const isUserExist = await findUserByEmailOrPhone(email, phone);

    if (isUserExist) {
        const message = isUserExist.email === email
            ? "This email is already registered."
            : "This phone number is already registered.";
        throw new AppError(message, 409);
    }

    const user = await createUser({
        name,
        email,
        password,
        phone,
        role: "buyer",
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await updateRefreshToken(user._id, refreshToken);

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    return { userResponse, accessToken, refreshToken };
};

export const loginService = async (userData) => {
    const { email, password } = userData;

    const user = await findUserByEmail(email);

    if (!user) {
        throw new AppError("Invalid credentials", 401);
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
        throw new AppError("Invalid credentials", 401);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await updateRefreshToken(user._id, refreshToken);

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    return { accessToken, refreshToken, userResponse };
};

export const refreshAccessTokenService = async (incomingRefreshToken) => {
    let decoded;
    try {
        decoded = jwt.verify(incomingRefreshToken, config.JWT_REFRESH_SECRET);
    } catch (error) {
        throw new AppError("Invalid or expired refresh token", 401);
    }

    const user = await findUserByIdWithToken(decoded.id);

    if (!user) {
        throw new AppError("Invalid refresh token", 401);
    }

    if (incomingRefreshToken !== user.refreshToken) {
        throw new AppError("Refresh token is expired or used", 401);
    }

    const newAccessToken = generateAccessToken(user);

    return newAccessToken;
};

export const googleLoginService = async (profile, state = "user") => {
    const { id, displayName, emails, photos } = profile;
    const email = emails?.[0]?.value;
    const profilePic = photos?.[0]?.value || "";

    if (!email) {
        throw new AppError("Google account does not provide an email address", 400);
    }

    let user = await findUserByGoogleId(id);

    if (!user) {
        user = await findUserByEmail(email);

        if (user) {
            user.googleId = id;
            user.profilePic = profilePic;
            await user.save();
        } else {
            if (state === "admin") {
                throw new AppError("No admin account found for this email.", 403);
            }

            user = await createGoogleUser({
                name: displayName,
                email,
                googleId: id,
                profilePic,
                role: "buyer",
            });
        }
    }

    if (state === "admin" && user.role !== "admin") {
        throw new AppError("Access Denied. You are not an admin.", 403);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await updateRefreshToken(user._id, refreshToken);

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    return { accessToken, refreshToken, userResponse };
};
