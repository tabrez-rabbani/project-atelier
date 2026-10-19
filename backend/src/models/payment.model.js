import mongoose from "mongoose";
import priceSchema from "./shared/price.schema.js";

const paymentSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending"
    },
    price: {
        type: priceSchema,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    razorpay: {
        orderId: {
            type: String,
            required: true,
            index: true
        },
        paymentId: String,
        signature: String
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "order"
    },
    orderItems: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "product"
            },
            title: String,
            color: String,
            size: String,
            quantity: Number,
            image: String,
            price: priceSchema
        }
    ],
    shippingAddress: {
        fullName: String,
        email: String,
        phone: String,
        streetAddress: String,
        city: String,
        state: String,
        postalCode: String,
        country: String
    }
}, { timestamps: true });

const paymentModel = mongoose.model("payment", paymentSchema);

export default paymentModel;
