import { Router } from "express";
import { getMe, loginController, logOut, registerController, refreshTokenController, googleCallback, updateProfile } from "../controllers/auth.controller.js";
import { loginValidator, registerValidator } from "../validators/authValidator.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";
import { authLimiter } from "../middlewares/rateLimiter.js";
import passport from "passport";
import { config } from "../config/config.js";

const authRouter = Router();

authRouter.post("/register", authLimiter, registerValidator, registerController);
authRouter.post("/login", authLimiter, loginValidator, loginController);
authRouter.get("/get-me", authenticateUser, getMe);
authRouter.put("/profile", authenticateUser, updateProfile);
authRouter.get("/logout", authenticateUser, logOut);
authRouter.get("/refresh-token", refreshTokenController);

authRouter.get("/google", (req, res, next) => {
    const state = req.query.state || "user";
    passport.authenticate("google", {
        scope: ["profile", "email"],
        prompt: "select_account",
        state,
    })(req, res, next);
});

authRouter.get(
    "/google/callback",
    passport.authenticate("google", {
        session: false,
        failureRedirect: `${config.CLIENT_URL}/account/login?error=google_failed`,
    }),
    googleCallback,
);

export default authRouter;