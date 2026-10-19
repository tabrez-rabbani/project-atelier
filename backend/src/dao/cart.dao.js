import cartModel from "../models/cart.model.js";
import mongoose from "mongoose";

export async function getCartDetails(userId) {
    const [cart] = await cartModel.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(String(userId)) } },
        { $unwind: { path: "$items", preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: "products",
                localField: "items.product",
                foreignField: "_id",
                as: "productData",
            },
        },
        { $unwind: { path: "$productData", preserveNullAndEmptyArrays: true } },
        {
            $addFields: {
                "items.product": "$productData",
                "items.itemPrice": {
                    $multiply: [
                        { $ifNull: ["$items.quantity", 0] },
                        { $ifNull: ["$productData.price.amount", 0] },
                    ],
                },
            },
        },
        {
            $group: {
                _id: "$_id",
                totalPrice: { $sum: { $ifNull: ["$items.itemPrice", 0] } },
                currency: {
                    $first: { $ifNull: ["$productData.price.currency", "INR"] },
                },
                items: {
                    $push: {
                        $cond: [
                            { $ne: ["$productData", null] },
                            "$items",
                            null,
                        ],
                    },
                },
            },
        },
        {
            $project: {
                totalPrice: 1,
                currency: 1,
                items: {
                    $filter: {
                        input: "$items",
                        as: "item",
                        cond: { $ne: ["$$item", null] },
                    },
                },
            },
        },
    ]);

    return cart;
}