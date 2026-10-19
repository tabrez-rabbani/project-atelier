import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { config } from "./config/config.js";
import ErrorHandler from "./middlewares/ErrorHandler.js";
import { apiLimiter } from "./middlewares/rateLimiter.js";
import authRouter from "./routes/auth.routes.js";
import productRouter from "./routes/product.routes.js";
import categoryRouter from "./routes/category.routes.js";
import cartRouter from "./routes/cart.routes.js";
import orderRouter from "./routes/order.routes.js";
import wishlistRouter from "./routes/wishlist.routes.js";
import heroRouter from "./routes/hero.routes.js";
import adminRouter from "./routes/admin.routes.js";

const app = express();

app.set("trust proxy", 1);

app.use(express.json({
    verify: (req, _res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(cookieParser());
app.use(morgan(config.NODE_ENV === "production" ? "combined" : "dev"));

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(cors({
    origin: config.CLIENT_URL,
    credentials: true,
}));

app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});

passport.use(new GoogleStrategy({
    clientID: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback",
}, (_accessToken, _refreshToken, profile, done) => {
    return done(null, profile);
}));
app.use(passport.initialize());

app.use("/api", apiLimiter);
app.use("/api/auth", authRouter);
app.use("/api/products", productRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", orderRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/hero", heroRouter);
app.use("/api/admin", adminRouter);

app.use(ErrorHandler);

export default app;