import Razorpay from "razorpay";
import crypto from "crypto";
import { config } from "../config/config.js";

const razorpay = new Razorpay({
    key_id: config.RAZORPAY_KEY_ID,
    key_secret: config.RAZORPAY_KEY_SECRET
});

export const createRazorpayOrder = async ({ amount, currency = "INR", receipt }) => {
    const options = {
        amount: Math.round(amount * 100),
        currency,
        receipt: receipt || `rcpt_${Date.now()}`
    };

    return await razorpay.orders.create(options);
};

export const verifyRazorpaySignature = ({ order_id, payment_id, signature }) => {
    if (
        typeof order_id !== "string" ||
        typeof payment_id !== "string" ||
        typeof signature !== "string" ||
        !order_id ||
        !payment_id ||
        !signature
    ) {
        return false;
    }

    const expectedSignature = crypto
        .createHmac("sha256", config.RAZORPAY_KEY_SECRET)
        .update(`${order_id}|${payment_id}`)
        .digest("hex");

    if (expectedSignature.length !== signature.length) {
        return false;
    }

    return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature)
    );
};

export const verifyWebhookSignature = ({ body, signature, secret }) => {
    if (!signature || !body) {
        return false;
    }

    const webhookSecret = secret || config.RAZORPAY_WEBHOOK_SECRET || config.RAZORPAY_KEY_SECRET;
    if (!webhookSecret) {
        return false;
    }

    const payload = Buffer.isBuffer(body) ? body : (typeof body === "string" ? body : JSON.stringify(body));
    const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(payload)
        .digest("hex");

    if (expectedSignature.length !== signature.length) {
        return false;
    }

    return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature)
    );
};

