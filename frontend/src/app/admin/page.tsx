"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, ShoppingBasket, ShoppingCart, UserPlus, Loader2 } from "lucide-react";
import authApiInstance from "@/lib/axios";
import styles from "./Dashboard.module.css";

interface MonthlyOrderItem {
  _id: number;
  count: number;
  revenue: number;
}

interface RecentProduct {
  _id: string;
  title: string;
  slug?: string;
  price: { amount: number; currency?: string } | number;
  category?: string;
  colors?: { name: string; hex: string; images: string[] }[];
  inStock?: boolean;
  createdAt: string;
}

interface RecentOrder {
  _id: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
}

interface BestSellingProduct {
  _id: string;
  title: string;
  image?: string;
  price: number;
  orderCount: number;
  quantity: number;
  totalEarn: number;
}

interface DashboardStats {
  totalContacts: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  totalRevenue: number;
  monthlyOrders: MonthlyOrderItem[];
  recentProducts: RecentProduct[];
  recentOrders: RecentOrder[];
  bestSellingProducts: BestSellingProduct[];
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "June",
  "July",
  "Aug",
  "Sept",
  "Oct",
  "Nov",
  "Dec",
];

const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%' height='100%' fill='%231f2228'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-size='11' font-family='sans-serif'>No Image</text></svg>";

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalContacts: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    totalRevenue: 0,
    monthlyOrders: [],
    recentProducts: [],
    recentOrders: [],
    bestSellingProducts: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        const res = await authApiInstance.get("/admin/dashboard-stats");
        if (isMounted && res.data?.stats) {
          setStats(res.data.stats);
        }
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const getProductPrice = (price: { amount: number } | number | undefined) => {
    if (!price) return 0;
    if (typeof price === "object") return price.amount || 0;
    return price;
  };

  const monthlyCounts = MONTH_NAMES.map((_, index) => {
    const item = stats.monthlyOrders?.find((m) => m._id === index + 1);
    return item ? item.count : 0;
  });
  const maxOrderCount = Math.max(...monthlyCounts, 5);
  const totalOrdersThisYear = monthlyCounts.reduce((acc, c) => acc + c, 0);

  return (
    <div className={styles.dashboard}>
      <div className={styles.dashboard__statsGrid}>
        <div className={styles.dashboard__statCard}>
          <div
            className={`${styles.dashboard__statBorder} ${styles.dashboard__borderBlue}`}
          />
          <div className={styles.dashboard__statContent}>
            <div>
              <p className={styles.dashboard__statLabel}>Total Contacts</p>
              <h3 className={styles.dashboard__statValue}>
                {loading ? "..." : stats.totalContacts}
              </h3>
            </div>
            <div
              className={`${styles.dashboard__statIconWrapper} ${styles.dashboard__iconBlue}`}
            >
              <Mail size={22} />
            </div>
          </div>
        </div>

        <div className={styles.dashboard__statCard}>
          <div
            className={`${styles.dashboard__statBorder} ${styles.dashboard__borderRed}`}
          />
          <div className={styles.dashboard__statContent}>
            <div>
              <p className={styles.dashboard__statLabel}>Total User Orders</p>
              <h3 className={styles.dashboard__statValue}>
                {loading ? "..." : stats.totalOrders}
              </h3>
            </div>
            <div
              className={`${styles.dashboard__statIconWrapper} ${styles.dashboard__iconRed}`}
            >
              <ShoppingBasket size={22} />
            </div>
          </div>
        </div>

        <div className={styles.dashboard__statCard}>
          <div
            className={`${styles.dashboard__statBorder} ${styles.dashboard__borderGold}`}
          />
          <div className={styles.dashboard__statContent}>
            <div>
              <p className={styles.dashboard__statLabel}>Total Products</p>
              <div className={styles.dashboard__statValueWrap}>
                <h3 className={styles.dashboard__statValue}>
                  {loading ? "..." : stats.totalProducts}
                </h3>
                <Link
                  href="/admin/products/create"
                  className={styles.dashboard__addNewLink}
                >
                  ADD NEW
                </Link>
              </div>
            </div>
            <div
              className={`${styles.dashboard__statIconWrapper} ${styles.dashboard__iconGold}`}
            >
              <ShoppingCart size={22} />
            </div>
          </div>
        </div>

        <div className={styles.dashboard__statCard}>
          <div
            className={`${styles.dashboard__statBorder} ${styles.dashboard__borderPurple}`}
          />
          <div className={styles.dashboard__statContent}>
            <div>
              <p className={styles.dashboard__statLabel}>Total Users</p>
              <h3 className={styles.dashboard__statValue}>
                {loading ? "..." : stats.totalUsers}
              </h3>
            </div>
            <div
              className={`${styles.dashboard__statIconWrapper} ${styles.dashboard__iconPurple}`}
            >
              <UserPlus size={22} />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.dashboard__showcaseGrid}>
        <div className={styles.dashboard__sectionCard}>
          <div className={styles.dashboard__sectionHeader}>
            <h2 className={styles.dashboard__sectionTitle}>
              Total Orders This Year
            </h2>
          </div>
          <p className={styles.dashboard__sectionSubtitle}>
            Orders Created Monthly by Year
          </p>

          <div className={styles.dashboard__chartBox}>
            <div className={styles.dashboard__chartBarsWrapper}>
              <svg
                className={styles.dashboard__chartSvg}
                viewBox="0 0 600 170"
                preserveAspectRatio="none"
              >
                {MONTH_NAMES.map((monthName, index) => {
                  const count = monthlyCounts[index];
                  const barHeight =
                    count > 0
                      ? Math.max(Math.round((count / maxOrderCount) * 140), 10)
                      : 4;
                  const x = index * 50 + 13;
                  const y = 170 - barHeight;

                  return (
                    <rect
                      key={monthName}
                      x={x}
                      y={y}
                      width={24}
                      height={barHeight}
                      rx={4}
                      className={styles.dashboard__barRect}
                    >
                      <title>{`${monthName}: ${count} orders`}</title>
                    </rect>
                  );
                })}
              </svg>
            </div>
            <div className={styles.dashboard__chartLabelsWrapper}>
              {MONTH_NAMES.map((monthName) => (
                <span
                  key={monthName}
                  className={styles.dashboard__chartMonthLabel}
                >
                  {monthName}
                </span>
              ))}
            </div>
            {!loading && totalOrdersThisYear === 0 && (
              <p className={styles.dashboard__chartEmptyNote}>
                No order trends available yet
              </p>
            )}
          </div>
        </div>

        <div className={styles.dashboard__sectionCard}>
          <div className={styles.dashboard__sectionHeader}>
            <h2 className={styles.dashboard__sectionTitle}>
              Best Selling Product
            </h2>
            <Link
              href="/admin/products/create"
              className={styles.dashboard__actionBtn}
            >
              Add Product
            </Link>
          </div>

          {loading ? (
            <div className={styles.dashboard__emptyState}>
              <Loader2 className={styles.dashboard__spinner} size={24} />
            </div>
          ) : stats.bestSellingProducts && stats.bestSellingProducts.length > 0 ? (
            <div className={styles.dashboard__listContainer}>
              {stats.bestSellingProducts.map((item) => (
                <div key={item._id} className={styles.dashboard__listItem}>
                  <img
                    src={item.image || FALLBACK_IMAGE}
                    alt={item.title || "Product"}
                    className={styles.dashboard__itemThumbnail}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        FALLBACK_IMAGE;
                    }}
                  />
                  <div className={styles.dashboard__infoCol}>
                    <p className={styles.dashboard__fieldLabel}>Price</p>
                    <p className={styles.dashboard__fieldValue}>₹ {item.price}</p>
                  </div>
                  <div className={styles.dashboard__infoCol}>
                    <p className={styles.dashboard__fieldLabel}>Orders</p>
                    <p className={styles.dashboard__fieldValue}>
                      {item.orderCount}
                    </p>
                  </div>
                  <div className={styles.dashboard__infoCol}>
                    <p className={styles.dashboard__fieldLabel}>Total Earn</p>
                    <p className={styles.dashboard__fieldValue}>
                      ₹ {item.totalEarn}
                    </p>
                  </div>
                  <div className={styles.dashboard__infoCol}>
                    <p className={styles.dashboard__fieldLabel}>Total Sold</p>
                    <p className={styles.dashboard__fieldValue}>
                      {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.dashboard__emptyState}>
              No sales data recorded yet
            </div>
          )}
        </div>
      </div>

      <div className={styles.dashboard__showcaseGrid}>
        <div className={styles.dashboard__sectionCard}>
          <div className={styles.dashboard__sectionHeader}>
            <h2 className={styles.dashboard__sectionTitle}>
              Recent Added Products
            </h2>
            <Link
              href="/admin/products/create"
              className={styles.dashboard__actionBtn}
            >
              Add Product
            </Link>
          </div>

          {loading ? (
            <div className={styles.dashboard__emptyState}>
              <Loader2 className={styles.dashboard__spinner} size={24} />
            </div>
          ) : stats.recentProducts && stats.recentProducts.length > 0 ? (
            <div className={styles.dashboard__listContainer}>
              {stats.recentProducts.map((pro) => {
                const img =
                  pro.colors?.[0]?.images?.[0] || FALLBACK_IMAGE;
                const isInStock = pro.inStock !== false;

                return (
                  <div key={pro._id} className={styles.dashboard__listItem}>
                    <img
                      src={img}
                      alt={pro.title}
                      className={styles.dashboard__itemThumbnail}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          FALLBACK_IMAGE;
                      }}
                    />

                    <div
                      className={`${styles.dashboard__infoCol} ${styles.dashboard__titleCol}`}
                    >
                      <h3
                        className={styles.dashboard__itemTitle}
                        title={pro.title}
                      >
                        {pro.title}
                      </h3>
                      <p className={styles.dashboard__itemDate}>
                        {formatDate(pro.createdAt)}
                      </p>
                    </div>

                    <div className={styles.dashboard__infoCol}>
                      <p className={styles.dashboard__fieldLabel}>Price</p>
                      <p className={styles.dashboard__fieldValue}>
                        ₹ {getProductPrice(pro.price)}
                      </p>
                    </div>

                    <div className={styles.dashboard__infoCol}>
                      <p className={styles.dashboard__fieldLabel}>Stock</p>
                      <p
                        className={`${styles.dashboard__fieldValue} ${
                          isInStock
                            ? styles.dashboard__statusInStock
                            : styles.dashboard__statusOutOfStock
                        }`}
                      >
                        {isInStock ? "In Stock" : "Out Of Stock"}
                      </p>
                    </div>

                    <div className={styles.dashboard__infoCol}>
                      <p className={styles.dashboard__fieldLabel}>Category</p>
                      <p className={styles.dashboard__fieldValue}>
                        {pro.category || "General"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.dashboard__emptyState}>
              No products added yet
            </div>
          )}
        </div>

        <div className={styles.dashboard__sectionCard}>
          <div className={styles.dashboard__sectionHeader}>
            <h2 className={styles.dashboard__sectionTitle}>Recent Orders</h2>
          </div>

          {loading ? (
            <div className={styles.dashboard__emptyState}>
              <Loader2 className={styles.dashboard__spinner} size={24} />
            </div>
          ) : stats.recentOrders && stats.recentOrders.length > 0 ? (
            <div className={styles.dashboard__listContainer}>
              {stats.recentOrders.map((ord) => {
                const isPaid =
                  ord.paymentStatus === "completed" ||
                  ord.paymentStatus === "Paid";
                const statusClass =
                  ord.orderStatus === "delivered"
                    ? styles.dashboard__statusDelivered
                    : ord.orderStatus === "shipped"
                    ? styles.dashboard__statusShipped
                    : ord.orderStatus === "processing"
                    ? styles.dashboard__statusProcessing
                    : ord.orderStatus === "cancelled"
                    ? styles.dashboard__statusCancelled
                    : styles.dashboard__statusPlaced;

                return (
                  <div key={ord._id} className={styles.dashboard__listItem}>
                    <div className={styles.dashboard__infoCol}>
                      <p className={styles.dashboard__fieldLabel}>Order ID</p>
                      <p
                        className={styles.dashboard__fieldValue}
                        title={ord._id}
                      >
                        #{ord._id.slice(-6).toUpperCase()}
                      </p>
                    </div>

                    <div className={styles.dashboard__infoCol}>
                      <p className={styles.dashboard__fieldLabel}>Order Date</p>
                      <p className={styles.dashboard__fieldValue}>
                        {formatDate(ord.createdAt)}
                      </p>
                    </div>

                    <div className={styles.dashboard__infoCol}>
                      <p className={styles.dashboard__fieldLabel}>
                        Total Amount
                      </p>
                      <p className={styles.dashboard__fieldValue}>
                        ₹ {ord.totalAmount}
                      </p>
                    </div>

                    <div className={styles.dashboard__infoCol}>
                      <p className={styles.dashboard__fieldLabel}>
                        Order Status
                      </p>
                      <p
                        className={`${styles.dashboard__fieldValue} ${statusClass}`}
                      >
                        {ord.orderStatus
                          ? ord.orderStatus.charAt(0).toUpperCase() +
                            ord.orderStatus.slice(1)
                          : "Placed"}
                      </p>
                    </div>

                    <div className={styles.dashboard__infoCol}>
                      <p className={styles.dashboard__fieldLabel}>Payment</p>
                      <p
                        className={`${styles.dashboard__fieldValue} ${
                          isPaid
                            ? styles.dashboard__statusPaid
                            : styles.dashboard__statusUnpaid
                        }`}
                      >
                        {isPaid ? "Paid" : "Unpaid"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.dashboard__emptyState}>
              No recent orders yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
