import asyncHandler from "../middlewares/asyncHandler.js";
import productModel from "../models/product.model.js";
import orderModel from "../models/order.model.js";
import userModel from "../models/user.model.js";
import { getAllOrders, getCancelledOrders, updateOrderStatus } from "../dao/order.dao.js";
import { getAllUsers, deleteUserById } from "../dao/user.dao.js";
import AppError from "../utils/AppError.js";

export const getDashboardStats = asyncHandler(async (_req, res) => {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);

    const [
        totalProducts,
        totalOrders,
        totalUsers,
        revenueData,
        monthlyOrders,
        recentProducts,
        recentOrders,
        bestSellingProducts,
    ] = await Promise.all([
        productModel.countDocuments(),
        orderModel.countDocuments(),
        userModel.countDocuments({ role: "buyer" }),
        orderModel.aggregate([
            { $match: { paymentStatus: "completed" } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]),
        orderModel.aggregate([
            { $match: { createdAt: { $gte: startOfYear } } },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    count: { $sum: 1 },
                    revenue: { $sum: "$totalAmount" },
                },
            },
            { $sort: { "_id": 1 } },
        ]),
        productModel.find()
            .sort({ createdAt: -1 })
            .limit(4)
            .select("title slug price category colors inStock createdAt")
            .lean(),
        orderModel.find()
            .sort({ createdAt: -1 })
            .limit(4)
            .select("_id totalAmount orderStatus paymentStatus createdAt")
            .lean(),
        orderModel.aggregate([
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.product",
                    title: { $first: "$items.title" },
                    image: { $first: "$items.image" },
                    price: { $first: "$items.price.amount" },
                    orderCount: { $sum: 1 },
                    quantity: { $sum: "$items.quantity" },
                    totalEarn: { $sum: { $multiply: ["$items.price.amount", "$items.quantity"] } },
                },
            },
            { $sort: { quantity: -1 } },
            { $limit: 4 },
        ]),
    ]);

    const totalRevenue = revenueData[0]?.total || 0;

    res.status(200).json({
        success: true,
        stats: {
            totalContacts: 0,
            totalOrders,
            totalProducts,
            totalUsers,
            totalRevenue,
            monthlyOrders,
            recentProducts,
            recentOrders,
            bestSellingProducts,
        },
    });
});

export const getAdminOrders = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, search } = req.query;
    const data = await getAllOrders({
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        search,
    });

    res.status(200).json({ success: true, ...data });
});

export const getAdminCancelledOrders = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search } = req.query;
    const data = await getCancelledOrders({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
    });

    res.status(200).json({ success: true, ...data });
});

export const updateAdminOrderStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["placed", "processing", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
        throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(", ")}`, 400);
    }

    const order = await updateOrderStatus(id, status);
    if (!order) throw new AppError("Order not found", 404);

    res.status(200).json({
        success: true,
        message: `Order status updated to "${status}"`,
        order,
    });
});

export const getAdminUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search } = req.query;
    const data = await getAllUsers({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
    });

    res.status(200).json({ success: true, ...data });
});

export const deleteAdminUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const userToDelete = await userModel.findById(id);
    if (!userToDelete) {
        throw new AppError("User not found", 404);
    }

    if (userToDelete.role === "admin") {
        throw new AppError("Admin accounts cannot be deleted", 400);
    }

    await deleteUserById(id);

    res.status(200).json({
        success: true,
        message: "User deleted successfully",
    });
});

