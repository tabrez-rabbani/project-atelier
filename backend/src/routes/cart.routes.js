import { Router } from "express";
import { authenticateUser } from "../middlewares/authMiddleware.js";
import { validateAddToCart, validateIncrementCartItemQuantity } from "../validators/cart.validator.js";
import { validateCreatePaymentOrder, validateVerifyPaymentOrder } from "../validators/payment.validator.js";
import { addToCart, getCart, incrementCartItemQuantity, decrementCartItemQuantity, removeCartItem } from "../controllers/cart.controller.js";
import { createOrderController, verifyOrderController, razorpayWebhookController } from "../controllers/payment.controller.js";

const cartRouter = Router();

cartRouter.post("/add/:productId", authenticateUser, validateAddToCart, addToCart);
cartRouter.get("/", authenticateUser, getCart);
cartRouter.patch("/quantity/increment/:productId", authenticateUser, validateIncrementCartItemQuantity, incrementCartItemQuantity);
cartRouter.patch("/quantity/decrement/:productId", authenticateUser, validateIncrementCartItemQuantity, decrementCartItemQuantity);
cartRouter.delete("/remove/:productId", authenticateUser, validateIncrementCartItemQuantity, removeCartItem);
cartRouter.post("/payment/create/order", authenticateUser, validateCreatePaymentOrder, createOrderController);
cartRouter.post("/payment/verify/order", authenticateUser, validateVerifyPaymentOrder, verifyOrderController);
cartRouter.post("/payment/webhook", razorpayWebhookController);

export default cartRouter;