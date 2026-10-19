import mongoose from "mongoose";
import priceSchema from "./shared/price.schema.js";

const productColorSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    hex: { 
        type: String, 
        required: true 
    },
    images: [
        { 
            type: String, 
            required: true
         }
        ]
}, { _id: false });

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Product title is required'],
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    description: {
        type: String
    },
    material: {
        type: String
    },
    deliveryInfo: {
        type: String
    },
    price: {
        type: priceSchema,
        required: [true, 'Product price is required']
    },
    originalPrice: {
        type: priceSchema
    },
    category: {
        type: String,
        required: [true, 'Product category is required'],
        index: true
    },
    colors: [productColorSchema],
    sizes: [{
        type: String
    }],
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviewCount: {
        type: Number,
        default: 0
    },
    inStock: {
        type: Boolean,
        default: true
    },
    isNewIn: {
        type: Boolean,
        default: false,
        index: true
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    }
}, { timestamps: true });

// Text index for full-text search (title weighted highest)
productSchema.index(
    { title: "text", category: "text", description: "text" },
    { weights: { title: 10, category: 5, description: 1 }, name: "product_search_idx" }
);

// Compound index for regex-based autocomplete on title
productSchema.index({ title: 1 });

// Compound index for category listings sorted by recency (avoids in-memory sorting)
productSchema.index({ category: 1, createdAt: -1 });

// Compound index for homepage "New In" section
productSchema.index({ isNewIn: 1, createdAt: -1 });

// Index for price filtering and sorting
productSchema.index({ "price.amount": 1 });
productSchema.index({ createdAt: -1 });

const productModel = mongoose.model("product", productSchema);

export default productModel;