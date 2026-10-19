import mongoose from "mongoose";
import priceSchema from "./shared/price.schema.js";

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
        unique: true,
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "product",
                required: true,
            },
            color: {
                type: String,
                required: true,
            },
            size: {
                type: String,
                required: true,
            },
            quantity: {
                type: Number,
                default: 1,
            },
            price: {
                type: priceSchema,
                required: true,
            },
        },
    ],
}, { timestamps: true });

const cartModel = mongoose.model("cart", cartSchema);

export default cartModel;