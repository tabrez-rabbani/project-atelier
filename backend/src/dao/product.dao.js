import productModel from "../models/product.model.js";

export const createProduct = async (productData) => {
    const newProduct = new productModel(productData);
    return await newProduct.save();
};

export const getAllProducts = async (filterQuery, sortOptions, skip, limit) => {
    return await productModel.find(filterQuery)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit);
};

export const getProductsCount = async (filterQuery) => {
    return await productModel.countDocuments(filterQuery);
};

export const removeProductById = async (id) => {
    return await productModel.findByIdAndDelete(id);
};

export const getProductBySlug = async (slug) => {
    return await productModel.findOne({ slug });
};

export const getProductById = async (id) => {
    return await productModel.findById(id);
};

export const updateProductById = async (id, updateData) => {
    return await productModel.findByIdAndUpdate(id, updateData, { returnDocument: "after" });
};

export const getDistinctColorsDao = async (category) => {
    const pipeline = [];
    if (category) {
        pipeline.push({
            $match: {
                category: { $regex: new RegExp(`^${category}$`, "i") }
            }
        });
    }
    pipeline.push(
        { $unwind: "$colors" },
        {
            $group: {
                _id: { $toLower: "$colors.name" },
                name: { $first: "$colors.name" },
                hex: { $first: "$colors.hex" }
            }
        },
        { $sort: { name: 1 } }
    );
    return await productModel.aggregate(pipeline);
};

/**
 * Search products using MongoDB text index (primary) with regex fallback.
 * Returns lightweight projections for instant search results.
 */
export const searchProductsDao = async (query, { limit = 8, skip = 0 } = {}) => {
    // Only return fields needed for search UI (lightweight payload)
    const projection = {
        title: 1,
        slug: 1,
        price: 1,
        originalPrice: 1,
        category: 1,
        colors: 1,
        sizes: 1,
        rating: 1,
        reviewCount: 1,
        inStock: 1,
        isNewIn: 1,
    };

    // Try $text search first (tokenized, scored, fast with index)
    const hasMultipleWords = query.trim().includes(" ");
    const textQuery = hasMultipleWords ? `"${query}"` : query;

    let results = await productModel
        .find(
            { $text: { $search: textQuery } },
            { ...projection, score: { $meta: "textScore" } }
        )
        .sort({ score: { $meta: "textScore" } })
        .skip(skip)
        .limit(limit)
        .lean();

    // If text search returns nothing, fallback to regex (partial match / autocomplete)
    if (results.length === 0) {
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escapedQuery, "i");

        results = await productModel
            .find({
                $or: [
                    { title: { $regex: regex } },
                    { category: { $regex: regex } },
                    { "colors.name": { $regex: regex } },
                ],
            })
            .select(projection)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
    }

    return results;
};

/**
 * Count total search results for pagination.
 */
export const searchProductsCountDao = async (query) => {
    const hasMultipleWords = query.trim().includes(" ");
    const textQuery = hasMultipleWords ? `"${query}"` : query;

    let count = await productModel.countDocuments({ $text: { $search: textQuery } });

    if (count === 0) {
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escapedQuery, "i");

        count = await productModel.countDocuments({
            $or: [
                { title: { $regex: regex } },
                { category: { $regex: regex } },
                { "colors.name": { $regex: regex } },
            ],
        });
    }

    return count;
};
