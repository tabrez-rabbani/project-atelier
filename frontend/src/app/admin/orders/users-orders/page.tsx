"use client";

import { useState, useEffect, useCallback } from "react";
import authApiInstance from "@/lib/axios";
import { Package, Truck, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import styles from "../Orders.module.css";

interface OrderItem {
  product: { _id: string; title: string; slug: string } | null;
  title: string;
  image: string;
  color: string;
  size: string;
  quantity: number;
  price: { amount: number; currency: string };
}

interface Order {
  _id: string;
  user: { _id: string; name: string; email: string } | null;
  items: OrderItem[];
  shippingAddress: {
    fullName: string;
    email: string;
    phone: string;
    city: string;
    state: string;
  };
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
}

const STATUS_BADGE_MAP: Record<string, string> = {
  placed: styles.badgePlaced,
  processing: styles.badgeProcessing,
  shipped: styles.badgeShipped,
  delivered: styles.badgeDelivered,
  cancelled: styles.badgeCancelled,
};

const PAYMENT_BADGE_MAP: Record<string, string> = {
  pending: styles.badgePending,
  completed: styles.badgeCompleted,
  failed: styles.badgeFailed,
};

export default function UsersOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (statusFilter) params.set("status", statusFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const response = await authApiInstance.get(`/admin/orders?${params.toString()}`);
      if (response.data.success) {
        setOrders(response.data.orders);
        setTotalPages(response.data.totalPages);
        setTotal(response.data.total);
      }
    } catch {
      toast.error("Failed to fetch orders");
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, searchQuery]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const response = await authApiInstance.patch(`/admin/orders/${orderId}/status`, {
        status: newStatus,
      });
      if (response.data.success) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, orderStatus: newStatus } : o))
        );
        toast.success(`Order status updated to "${newStatus}"`);
      }
    } catch {
      toast.error("Failed to update order status");
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return currency === "INR" ? `₹${amount.toLocaleString("en-IN")}` : `${currency} ${amount}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.titleWrapper}>
            <div className={styles.titleLine}></div>
            <h2 className={styles.title}>Users Orders</h2>
          </div>
          <div className={styles.headerStat}>
            <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
              <Package size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Total Orders</span>
              <span className={styles.statValue}>{total}</span>
            </div>
          </div>
        </div>

        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Status:</label>
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Orders</option>
              <option value="placed">Placed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <input
            type="text"
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search by customer name..."
          />
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className={styles.emptyState}>Loading orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.emptyState}>No orders found.</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <span className={styles.orderId}>
                        #{order._id.slice(-8).toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className={styles.customerInfo}>
                        <span className={styles.customerName}>
                          {order.shippingAddress.fullName}
                        </span>
                        <span className={styles.customerEmail}>
                          {order.shippingAddress.email}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.itemCount}>
                        {order.items.length} {order.items.length === 1 ? "item" : "items"}
                      </span>
                    </td>
                    <td>
                      <span className={styles.price}>
                        {formatCurrency(order.totalAmount, order.currency)}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${PAYMENT_BADGE_MAP[order.paymentStatus] || ""}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${STATUS_BADGE_MAP[order.orderStatus] || ""}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td>
                      <span className={styles.dateText}>{formatDate(order.createdAt)}</span>
                    </td>
                    <td>
                      <select
                        className={styles.statusSelect}
                        value={order.orderStatus}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        disabled={updatingId === order._id || order.orderStatus === "delivered" || order.orderStatus === "cancelled"}
                      >
                        <option value="placed">Placed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <span className={styles.pageInfo}>
              Page {page} of {totalPages}
            </span>
            <button
              className={styles.pageBtn}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
