import asyncHandler from "../middlewares/asyncHandler.js";
import AppError from "../utils/AppError.js";
import { config } from "../config/config.js";
import { getCartDetails } from "../dao/cart.dao.js";
import cartModel from "../models/cart.model.js";
import paymentModel from "../models/payment.model.js";
import orderModel from "../models/order.model.js";
import {
    createRazorpayOrder,
    verifyRazorpaySignature,
    verifyWebhookSignature,
} from "../services/payment.service.js";

// Delivery charge rules
const FREE_DELIVERY_THRESHOLD = 999;
const STANDARD_DELIVERY_FEE = 99;

/**
 * Helper to create an order once payment is verified.
 * Used by both client verification (verifyOrderController) and Razorpay webhook.
 */
const createPaidOrder = async ({ payment, shippingAddress, user }) => {
    
    if (payment.order) {
        const existingOrder = await orderModel.findById(payment.order);
        if (existingOrder) {
            return existingOrder;
        }
    }

    const finalAddress = (shippingAddress && shippingAddress.streetAddress)
        ? shippingAddress
        : (payment.shippingAddress || {});

    const subtotal = payment.orderItems.reduce(
        (acc, item) => acc + ((item.price?.amount || 0) * item.quantity),
        0
    );
    const deliveryCharge = Math.max(0, (payment.price?.amount || 0) - subtotal);

    const newOrder = await orderModel.create({
        user: payment.user || user?._id,
        items: payment.orderItems,
        shippingAddress: {
            fullName: finalAddress.fullName || user?.name || "Customer",
            email: finalAddress.email || user?.email || "",
            phone: finalAddress.phone || user?.phone || "",
            streetAddress: finalAddress.streetAddress || "",
            city: finalAddress.city || "",
            state: finalAddress.state || "",
            postalCode: finalAddress.postalCode || "",
            country: finalAddress.country || "India",
        },
        paymentMethod: "online",
        paymentStatus: "completed",
        orderStatus: "placed",
        subtotal,
        deliveryCharge,
        totalAmount: payment.price?.amount || (subtotal + deliveryCharge),
        currency: payment.price?.currency || "INR",
    });

    // Link created order with payment document
    payment.order = newOrder._id;
    payment.status = "paid";
    await payment.save();

    // Clear user cart once order is confirmed
    await cartModel.findOneAndUpdate(
        { user: payment.user || user?._id },
        { $set: { items: [] } }
    );

    return newOrder;
};

/**
 * Initiates Razorpay checkout order for the current user cart.
 */
export const createOrderController = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const cart = await getCartDetails(userId);

    if (!cart || !cart.items || cart.items.length === 0) {
        throw new AppError("Your cart is empty. Add products to place an order.", 400);
    }

    // Verify stock availability for all cart items
    for (const item of cart.items) {
        if (!item.product) {
            throw new AppError("One or more products in your cart are no longer available", 400);
        }
        if (!item.product.inStock) {
            throw new AppError(`Product "${item.product.title}" is out of stock`, 400);
        }
    }

    const subtotal = cart.totalPrice || 0;
    const deliveryCharge = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;
    const totalAmount = subtotal + deliveryCharge;
    const currency = cart.currency || "INR";

    // Create order on Razorpay
    const razorpayOrder = await createRazorpayOrder({
        amount: totalAmount,
        currency,
    });

    // Prepare snapshot of order items for audit trail
    const orderItems = cart.items.map((item) => {
        const product = item.product;
        const matchedColor = product?.colors?.find(
            (c) => c.name?.toLowerCase() === item.color?.toLowerCase()
        );
        const image = matchedColor?.images?.[0] || product?.colors?.[0]?.images?.[0] || "";

        return {
            product: product?._id,
            title: product?.title || "",
            color: item.color,
            size: item.size,
            quantity: item.quantity,
            image,
            price: {
                amount: product?.price?.amount || 0,
                currency: product?.price?.currency || currency,
            },
        };
    });

    // Record pending payment in database
    await paymentModel.create({
        user: userId,
        status: "pending",
        razorpay: {
            orderId: razorpayOrder.id,
        },
        price: {
            amount: totalAmount,
            currency,
        },
        orderItems,
        shippingAddress: req.body.shippingAddress || {},
    });

    return res.status(200).json({
        success: true,
        message: "Payment order created successfully",
        order: razorpayOrder,
        keyId: config.RAZORPAY_KEY_ID,
        amount: totalAmount,
        currency,
    });
});

/**
 * Verifies Razorpay payment signature from client checkout modal.
 */
export const verifyOrderController = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, shippingAddress } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new AppError("Invalid payment verification payload", 400);
    }

    const payment = await paymentModel.findOne({
        "razorpay.orderId": razorpay_order_id,
        user: req.user._id,
    });

    if (!payment) {
        throw new AppError("Payment record not found", 404);
    }

    // Idempotency check: if already verified (e.g. by webhook or page refresh), return existing order
    if (payment.status === "paid") {
        const existingOrder = payment.order
            ? await orderModel.findById(payment.order)
            : null;

        // Ensure user cart is cleared on retry if not already cleared
        await cartModel.findOneAndUpdate(
            { user: req.user._id },
            { $set: { items: [] } }
        );

        return res.status(200).json({
            success: true,
            message: "Payment already verified",
            order: existingOrder,
            orderId: payment.order || existingOrder?._id,
        });
    }

    // Verify cryptographic signature from Razorpay
    const isValid = verifyRazorpaySignature({
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        signature: razorpay_signature,
    });

    if (!isValid) {
        payment.status = "failed";
        await payment.save();
        throw new AppError("Payment verification failed", 400);
    }

    // Update payment record with gateway confirmation details
    payment.status = "paid";
    payment.razorpay.paymentId = razorpay_payment_id;
    payment.razorpay.signature = razorpay_signature;
    await payment.save();

    // Create the order and clear the cart
    const newOrder = await createPaidOrder({
        payment,
        shippingAddress,
        user: req.user,
    });

    return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        order: newOrder,
    });
});

/**
 * Handles incoming Razorpay webhook notifications.
 */
export const razorpayWebhookController = asyncHandler(async (req, res) => {
    const signature = req.headers["x-razorpay-signature"];

    if (!signature) {
        throw new AppError("Missing Razorpay signature header", 400);
    }

    const rawPayload = req.rawBody || req.body;
    const isValid = verifyWebhookSignature({
        body: rawPayload,
        signature,
        secret: config.RAZORPAY_WEBHOOK_SECRET,
    });

    if (!isValid) {
        throw new AppError("Invalid webhook signature", 400);
    }

    const event = req.body?.event;
    const payload = req.body?.payload;

    // Handle payment capture / order paid events
    if (event === "payment.captured" || event === "order.paid") {
        const paymentEntity = payload?.payment?.entity;
        const razorpayOrderId = paymentEntity?.order_id || payload?.order?.entity?.id;
        const razorpayPaymentId = paymentEntity?.id;

        if (!razorpayOrderId) {
            return res.status(200).json({ status: "ignored_missing_order_id" });
        }

        const payment = await paymentModel.findOne({
            "razorpay.orderId": razorpayOrderId,
        });

        if (!payment) {
            // Acknowledge unrecognized order to stop redundant webhook retries
            return res.status(200).json({ status: "ignored_unknown_payment" });
        }

        // Idempotency check: already processed by client verification or previous webhook
        if (payment.status === "paid") {
            return res.status(200).json({
                status: "already_processed",
                orderId: payment.order,
            });
        }

        payment.status = "paid";
        if (razorpayPaymentId) {
            payment.razorpay.paymentId = razorpayPaymentId;
        }
        if (signature) {
            payment.razorpay.signature = signature;
        }
        await payment.save();

        const newOrder = await createPaidOrder({
            payment,
            shippingAddress: payment.shippingAddress,
        });

        return res.status(200).json({
            status: "success",
            message: "Order created successfully via webhook",
            orderId: newOrder._id,
        });
    }

    // Handle payment failure event
    if (event === "payment.failed") {
        const paymentEntity = payload?.payment?.entity;
        const razorpayOrderId = paymentEntity?.order_id;

        if (razorpayOrderId) {
            const payment = await paymentModel.findOne({ "razorpay.orderId": razorpayOrderId });
            if (payment && payment.status === "pending") {
                payment.status = "failed";
                await payment.save();
            }
        }

        return res.status(200).json({ status: "payment_failed_recorded" });
    }

    return res.status(200).json({ status: "ignored_event" });
});
