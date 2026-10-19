import mongoose from "mongoose";

const heroSchema = new mongoose.Schema({
    eyebrow: {
        type: String,
        trim: true,
        default: "New Collection"
    },
    title: {
        type: String,
        required: [true, "Hero title is required"],
        trim: true
    },
    subtitle: {
        type: String,
        trim: true,
        default: ""
    },
    description: {
        type: String,
        trim: true,
        default: "Fashion for a Brighter You. Premium quality. Everyday confidence."
    },
    ctaText: {
        type: String,
        trim: true,
        default: "Shop New Collection"
    },
    ctaLink: {
        type: String,
        trim: true,
        default: "/collection"
    },
    desktopImage: {
        type: String,
        required: [true, "Desktop banner image is required"],
        trim: true
    },
    mobileImage: {
        type: String,
        trim: true,
        default: ""
    },
    ratingText: {
        type: String,
        trim: true,
        default: "10K+ Happy Customer"
    },
    showSocialProof: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Optimized index for fast retrieval of active banners
heroSchema.index({ isActive: 1, order: 1, createdAt: -1 });

const heroModel = mongoose.model("hero", heroSchema);

export default heroModel;
