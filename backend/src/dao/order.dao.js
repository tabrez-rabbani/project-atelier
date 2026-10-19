import orderModel from "../models/order.model.js";

export async function createOrder(orderData) {
    return await orderModel.create(orderData);
}

export async function getOrdersByUserId(userId) {
    return await orderModel.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate("items.product", "title slug");
}

export async function getOrderById(orderId, userId) {
    const query = { _id: orderId };
    if (userId) query.user = userId;

    return await orderModel.findOne(query)
        .populate("items.product", "title slug");
}

export async function getAllOrders({ page = 1, limit = 20, status, search }) {
    const query = {};
    if (status) query.orderStatus = status;
    if (search) {
        query["shippingAddress.fullName"] = { $regex: search, $options: "i" };
    }

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
        orderModel.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("user", "name email")
            .populate("items.product", "title slug"),
        orderModel.countDocuments(query),
    ]);

    return { orders, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getCancelledOrders({ page = 1, limit = 20, search }) {
    return getAllOrders({ page, limit, status: "cancelled", search });
}

export async function updateOrderStatus(orderId, status) {
    return await orderModel.findByIdAndUpdate(
        orderId,
        { orderStatus: status },
        { new: true, runValidators: true }
    );
}
