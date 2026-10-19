import {
    createProduct as createProductDao,
    getAllProducts as getAllProductsDao,
    getProductsCount,
    getProductBySlug,
    removeProductById,
    updateProductById,
    getDistinctColorsDao,
    searchProductsDao,
    searchProductsCountDao,
} from "../dao/product.dao.js";
import AppError from "../utils/AppError.js";
import { uploadFile } from "./storage.service.js";

// Color family synonyms for fuzzy search and filter matching
const COLOR_FAMILY_SYNONYMS = {
    beige: ["beige", "cream", "sand", "tan", "ecru", "nude", "ivory", "oatmeal"],
    black: ["black", "noir", "onyx", "jet"],
    blue: ["blue", "navy", "denim", "indigo", "cobalt", "cyan", "sky", "azure"],
    bronze: ["bronze", "copper", "metallic"],
    brown: ["brown", "chocolate", "mocha", "latte", "camel", "coffee", "chestnut", "tortoiseshell"],
    "gold-coloured": ["gold", "golden", "champagne"],
    green: ["green", "olive", "sage", "emerald", "mint", "khaki", "lime", "forest"],
    grey: ["grey", "gray", "silver", "charcoal", "slate", "ash"],
    multi: ["multi", "multicolor", "multicolour", "print", "pattern", "floral", "stripe"],
    orange: ["orange", "rust", "coral", "peach", "apricot", "terracotta"],
    pink: ["pink", "rose", "blush", "magenta", "fuchsia", "salmon", "powder"],
    purple: ["purple", "violet", "lavender", "lilac", "plum", "mauve"],
    red: ["red", "maroon", "burgundy", "crimson", "wine", "ruby"],
    turquoise: ["turquoise", "teal", "aqua"],
    white: ["white", "snow", "pearl", "off-white"],
    yellow: ["yellow", "mustard", "lemon", "canary"],
};

// Helper to safely parse stringified or already-parsed arrays
const parseArrayField = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        } catch {
            return [];
        }
    }
    return [];
};

export const deleteProduct = async (id) => {
    const product = await removeProductById(id);
    if (!product) {
        throw new AppError("Product not found", 404);
    }
    return product;
};

export const createProduct = async (bodyData, files, adminId) => {
    const {
        title,
        description,
        priceAmount,
        priceCurrency,
        originalPriceAmount,
        category,
        material,
        deliveryInfo,
        colors,
        sizes,
        inStock,
        isNewIn,
    } = bodyData;

    const parsedColors = parseArrayField(colors);
    const parsedSizes = parseArrayField(sizes);

    if (files && files.length > 0) {
        const uploadPromises = files.map(async (file) => {
            const cleanName = file.originalname ? file.originalname.replace(/\s+/g, "-") : "product.jpg";
            const result = await uploadFile({
                buffer: file.buffer,
                fileName: `${Date.now()}-${cleanName}`,
                folder: "maisone/products",
            });
            return {
                url: result.url,
                colorIndex: file.fieldname.startsWith("images_") ? parseInt(file.fieldname.split("_")[1], 10) : 0,
            };
        });

        const uploadedImages = await Promise.all(uploadPromises);

        // Assign uploaded images to their corresponding colors
        uploadedImages.forEach((img) => {
            if (parsedColors[img.colorIndex]) {
                if (!parsedColors[img.colorIndex].images) {
                    parsedColors[img.colorIndex].images = [];
                }
                parsedColors[img.colorIndex].images.push(img.url);
            }
        });
    }

    const price = {
        amount: Number(priceAmount),
        currency: priceCurrency || "INR",
    };

    let originalPrice = undefined;
    if (originalPriceAmount) {
        originalPrice = {
            amount: Number(originalPriceAmount),
            currency: priceCurrency || "INR",
        };
    }

    let slug = title.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
    const existingProduct = await getProductBySlug(slug);
    if (existingProduct) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const productData = {
        title,
        slug,
        description,
        price,
        originalPrice,
        category,
        material,
        deliveryInfo,
        colors: parsedColors,
        sizes: parsedSizes,
        inStock: inStock === "false" ? false : true,
        isNewIn: isNewIn === "true" ? true : false,
        admin: adminId,
    };

    return await createProductDao(productData);
};

export const updateProduct = async (id, bodyData, files) => {
    const {
        title,
        description,
        priceAmount,
        priceCurrency,
        originalPriceAmount,
        category,
        material,
        deliveryInfo,
        colors,
        sizes,
        inStock,
        isNewIn,
    } = bodyData;

    const parsedColors = parseArrayField(colors);
    const parsedSizes = parseArrayField(sizes);

    if (files && files.length > 0) {
        const uploadPromises = files.map(async (file) => {
            const cleanName = file.originalname ? file.originalname.replace(/\s+/g, "-") : "product.jpg";
            const result = await uploadFile({
                buffer: file.buffer,
                fileName: `${Date.now()}-${cleanName}`,
                folder: "maisone/products",
            });
            return {
                url: result.url,
                colorIndex: file.fieldname.startsWith("images_") ? parseInt(file.fieldname.split("_")[1], 10) : 0,
            };
        });

        const uploadedImages = await Promise.all(uploadPromises);

        uploadedImages.forEach((img) => {
            if (parsedColors[img.colorIndex]) {
                if (!parsedColors[img.colorIndex].images) {
                    parsedColors[img.colorIndex].images = [];
                }
                parsedColors[img.colorIndex].images.push(img.url);
            }
        });
    }

    const price = {
        amount: Number(priceAmount),
        currency: priceCurrency || "INR",
    };

    let originalPrice = undefined;
    if (originalPriceAmount) {
        originalPrice = {
            amount: Number(originalPriceAmount),
            currency: priceCurrency || "INR",
        };
    }

    let slug = title.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
    const existingProduct = await getProductBySlug(slug);
    if (existingProduct && existingProduct._id.toString() !== id) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const updateData = {
        title,
        slug,
        description,
        price,
        originalPrice,
        category,
        material,
        deliveryInfo,
        colors: parsedColors,
        sizes: parsedSizes,
        inStock: inStock === "false" ? false : true,
        isNewIn: isNewIn === "true" ? true : false,
    };

    const updatedProduct = await updateProductById(id, updateData);
    if (!updatedProduct) {
        throw new AppError("Product not found", 404);
    }

    return updatedProduct;
};

export const getAllProducts = async (queryParams) => {
    const {
        category,
        color,
        colors,
        size,
        sizes,
        minPrice,
        maxPrice,
        inStock,
        isNewIn,
        sort,
        page = 1,
        limit = 12,
    } = queryParams;

    const filterQuery = {};

    if (category) {
        filterQuery.category = { $regex: new RegExp(`^${category}$`, "i") };
    }

    // Support single or multiple comma-separated colors with color-family awareness
    const rawColors = colors || color;
    if (rawColors) {
        const colorList = (Array.isArray(rawColors) ? rawColors.flatMap((c) => String(c).split(",")) : String(rawColors).split(","))
            .map((c) => c.trim())
            .filter(Boolean);

        const regexList = colorList.map((rawName) => {
            const key = rawName.toLowerCase();
            const synonyms = COLOR_FAMILY_SYNONYMS[key];
            if (synonyms && synonyms.length > 0) {
                return new RegExp(synonyms.join("|"), "i");
            }
            return new RegExp(rawName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        });

        if (regexList.length === 1) {
            filterQuery["colors.name"] = { $regex: regexList[0] };
        } else if (regexList.length > 1) {
            filterQuery["colors.name"] = { $in: regexList };
        }
    }

    // Support single or multiple comma-separated sizes
    const rawSizes = sizes || size;
    if (rawSizes) {
        const sizeList = (Array.isArray(rawSizes) ? rawSizes.flatMap((s) => String(s).split(",")) : String(rawSizes).split(","))
            .map((s) => s.trim())
            .filter(Boolean);

        if (sizeList.length === 1) {
            filterQuery.sizes = { $regex: new RegExp(`^${sizeList[0]}$`, "i") };
        } else if (sizeList.length > 1) {
            filterQuery.sizes = { $in: sizeList.map((s) => new RegExp(`^${s}$`, "i")) };
        }
    }

    // In-stock availability filter
    if (inStock !== undefined && inStock !== "") {
        filterQuery.inStock = inStock === "true" || inStock === true;
    }

    // New In homepage section filter
    if (isNewIn !== undefined && isNewIn !== "") {
        const isTrue = isNewIn === "true" || isNewIn === true;
        filterQuery.isNewIn = isTrue ? true : { $ne: true };
    }

    // Price range filter
    if (minPrice || maxPrice) {
        filterQuery["price.amount"] = {};
        if (minPrice) filterQuery["price.amount"].$gte = Number(minPrice);
        if (maxPrice) filterQuery["price.amount"].$lte = Number(maxPrice);
    }

    // Sorting options
    const sortOptions = {};
    if (sort === "price_asc") sortOptions["price.amount"] = 1;
    else if (sort === "price_desc") sortOptions["price.amount"] = -1;
    else sortOptions.createdAt = -1;

    const skip = (Number(page) - 1) * Number(limit);

    const products = await getAllProductsDao(filterQuery, sortOptions, skip, Number(limit));
    const totalProducts = await getProductsCount(filterQuery);
    const totalPages = Math.ceil(totalProducts / Number(limit));

    return {
        products,
        pagination: {
            currentPage: Number(page),
            totalPages,
            totalProducts,
            hasNextPage: Number(page) < totalPages,
            hasPrevPage: Number(page) > 1,
        },
    };
};

export const getProductDetails = async (slug) => {
    const product = await getProductBySlug(slug);
    if (!product) {
        throw new AppError("Product not found", 404);
    }
    return product;
};

export const getAvailableColors = async (category) => {
    return await getDistinctColorsDao(category);
};

export const searchProducts = async ({ q, page = 1, limit = 8 }) => {
    const query = (q || "").trim();
    if (!query) {
        return { products: [], totalResults: 0 };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [products, totalResults] = await Promise.all([
        searchProductsDao(query, { limit: Number(limit), skip }),
        searchProductsCountDao(query),
    ]);

    const totalPages = Math.ceil(totalResults / Number(limit));

    return {
        products,
        totalResults,
        pagination: {
            currentPage: Number(page),
            totalPages,
            totalResults,
            hasNextPage: Number(page) < totalPages,
            hasPrevPage: Number(page) > 1,
        },
    };
};
