"use client";

import { useState, useEffect, useCallback } from "react";
import authApiInstance from "@/lib/axios";
import { XCircle } from "lucide-react";
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

export default function CancelOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCancelledOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const response = await authApiInstance.get(`/admin/orders/cancelled?${params.toString()}`);
      if (response.data.success) {
        setOrders(response.data.orders);
        setTotalPages(response.data.totalPages);
        setTotal(response.data.total);
      }
    } catch {
      toast.error("Failed to fetch cancelled orders");
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    fetchCancelledOrders();
  }, [fetchCancelledOrders]);

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
            <h2 className={styles.title}>Cancelled Orders</h2>
          </div>
          <div className={styles.headerStat}>
            <div className={`${styles.statIcon} ${styles.statIconRed}`}>
              <XCircle size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Total Cancelled</span>
              <span className={styles.statValue}>{total}</span>
            </div>
          </div>
        </div>

        <div className={styles.filterRow}>
          <div></div>
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
                <th>Payment Method</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>Loading cancelled orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>No cancelled orders found.</td>
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
                      <span className={`${styles.badge} ${
                        order.paymentStatus === "completed" ? styles.badgeCompleted :
                        order.paymentStatus === "failed" ? styles.badgeFailed :
                        styles.badgePending
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className={styles.uppercaseCell}>
                      {order.paymentMethod}
                    </td>
                    <td>
                      <span className={styles.dateText}>{formatDate(order.createdAt)}</span>
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
