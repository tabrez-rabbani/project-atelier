import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    image: {
        type: String,
        default: ""
    }
}, { timestamps: true });

const categoryModel = mongoose.model("category", categorySchema);

export default categoryModel;
