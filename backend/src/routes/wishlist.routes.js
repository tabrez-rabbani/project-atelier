import { Router } from "express";
import { getWishlist, getWishlistIds, toggleWishlist, removeFromWishlist, moveToCart, clearWishlist } from "../controllers/wishlist.controller.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";

const wishlistRouter = Router();

wishlistRouter.use(authenticateUser);

wishlistRouter.get("/", getWishlist);
wishlistRouter.get("/ids", getWishlistIds);
wishlistRouter.post("/toggle/:productId", toggleWishlist);
wishlistRouter.post("/move-to-bag/:productId", moveToCart);
wishlistRouter.delete("/clear/all", clearWishlist);
wishlistRouter.delete("/:productId", removeFromWishlist);

export default wishlistRouter;
