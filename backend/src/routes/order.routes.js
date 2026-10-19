import { Router } from "express";
import { authenticateUser } from "../middlewares/authMiddleware.js";
import { validatePlaceOrder } from "../validators/order.validator.js";
import { placeOrder, getMyOrders, getOrderDetails, cancelMyOrder } from "../controllers/order.controller.js";

const orderRouter = Router();

orderRouter.post("/place", authenticateUser, validatePlaceOrder, placeOrder);
orderRouter.get("/my-orders", authenticateUser, getMyOrders);
orderRouter.patch("/:id/cancel", authenticateUser, cancelMyOrder);
orderRouter.get("/:id", authenticateUser, getOrderDetails);

export default orderRouter;
