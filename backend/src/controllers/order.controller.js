import asyncHandler from "../middlewares/asyncHandler.js";
import cartModel from "../models/cart.model.js";
import AppError from "../utils/AppError.js";
import { createOrder, getOrdersByUserId, getOrderById as fetchOrderById } from "../dao/order.dao.js";
import { getCartDetails } from "../dao/cart.dao.js";

export const placeOrder = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { shippingAddress, paymentMethod = "cod" } = req.body;

    if (paymentMethod === "online") {
        throw new AppError("Online orders must be completed through the payment gateway", 400);
    }

    const cartData = await getCartDetails(userId);
    if (!cartData?.items?.length) {
        throw new AppError("Your cart is empty. Add products to place an order.", 400);
    }

    const orderItems = [];
    let calculatedSubtotal = 0;

    for (const item of cartData.items) {
        const product = item.product;
        if (!product) throw new AppError("One or more products in your cart are no longer available.", 400);
        if (!product.inStock) throw new AppError(`Product "${product.title}" is out of stock.`, 400);

        const matchedColor = product.colors?.find((c) => c.name?.toLowerCase() === item.color?.toLowerCase());
        const selectedImage = matchedColor?.images?.[0] || product.colors?.[0]?.images?.[0] || "";

        const itemTotal = (product.price?.amount || 0) * item.quantity;
        calculatedSubtotal += itemTotal;

        orderItems.push({
            product: product._id,
            title: product.title,
            image: selectedImage,
            color: item.color,
            size: item.size,
            quantity: item.quantity,
            price: {
                amount: product.price?.amount || 0,
                currency: product.price?.currency || "INR",
            },
        });
    }

    const deliveryCharge = calculatedSubtotal >= 999 ? 0 : 99;
    const totalAmount = calculatedSubtotal + deliveryCharge;

    const newOrder = await createOrder({
        user: userId,
        items: orderItems,
        shippingAddress: {
            fullName: shippingAddress.fullName,
            email: shippingAddress.email,
            phone: shippingAddress.phone,
            streetAddress: shippingAddress.streetAddress,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postalCode: shippingAddress.postalCode,
            country: shippingAddress.country || "India",
        },
        paymentMethod,
        paymentStatus: "pending",
        orderStatus: "placed",
        subtotal: calculatedSubtotal,
        deliveryCharge,
        totalAmount,
        currency: cartData.currency || "INR",
    });

    await cartModel.findOneAndUpdate({ user: userId }, { $set: { items: [] } });

    return res.status(201).json({
        success: true,
        message: "Order placed successfully",
        order: newOrder,
    });
});

export const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await getOrdersByUserId(req.user._id);

    return res.status(200).json({
        success: true,
        message: "Orders retrieved successfully",
        orders,
    });
});

export const getOrderDetails = asyncHandler(async (req, res) => {
    const order = await fetchOrderById(req.params.id, req.user._id);
    if (!order) throw new AppError("Order not found", 404);

    return res.status(200).json({
        success: true,
        message: "Order retrieved successfully",
        order,
    });
});

export const cancelMyOrder = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const orderId = req.params.id;

    const order = await fetchOrderById(orderId, userId);
    if (!order) throw new AppError("Order not found", 404);

    const cancellableStatuses = ["placed", "processing"];
    if (!cancellableStatuses.includes(order.orderStatus)) {
        throw new AppError(
            `Cannot cancel order. Order is already "${order.orderStatus}".`,
            400
        );
    }

    order.orderStatus = "cancelled";
    await order.save();

    return res.status(200).json({
        success: true,
        message: "Order cancelled successfully",
        order,
    });
});
