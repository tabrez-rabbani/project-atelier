import userModel from "../models/user.model.js";

export const findUserByEmailOrPhone = async (email, phone) => {
    if (!phone) {
        return await userModel.findOne({ email });
    }
    return await userModel.findOne({
        $or: [
            { email },
            { phone },
        ],
    });
};

export const findUserByEmail = async (email) => {
    return await userModel.findOne({ email });
};

export const findUserById = async (id) => {
    return await userModel.findById(id).select("-password -refreshToken");
};

// Returns user with refreshToken field for token comparison during refresh
export const findUserByIdWithToken = async (id) => {
    return await userModel.findById(id).select("refreshToken role");
};

export const createUser = async (user) => {
    return await userModel.create(user);
};

export const updateRefreshToken = async (userId, refreshToken) => {
    return await userModel.findByIdAndUpdate(userId, { refreshToken }, { returnDocument: "after" });
};

export const findUserByGoogleId = async (googleId) => {
    return await userModel.findOne({ googleId });
};

export const createGoogleUser = async (userData) => {
    return await userModel.create(userData);
};

export const getAllUsers = async ({ page = 1, limit = 20, search }) => {
    const query = { role: "buyer" };
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
        ];
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
        userModel.find(query)
            .select("-password -refreshToken")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        userModel.countDocuments(query),
    ]);

    return { users, total, page, totalPages: Math.ceil(total / limit) };
};

export const deleteUserById = async (userId) => {
    return await userModel.findByIdAndDelete(userId);
};