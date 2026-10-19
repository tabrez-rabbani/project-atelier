"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Header, Footer } from "@/components";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import authApiInstance from "@/lib/axios";
import { toast } from "sonner";
import {
  Home,
  User as UserIcon,
  ShoppingBag,
  LogOut,
  Pencil,
  ShoppingCart,
  ClipboardList,
  Eye,
  EyeOff,
  XCircle,
  Package,
  Truck,
  CheckCircle2,
} from "lucide-react";
import styles from "./account.module.css";

interface OrderItem {
  product: string;
  title: string;
  image?: string;
  color?: string;
  size?: string;
  quantity: number;
  price: {
    amount: number;
    currency: string;
  };
}

interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface Order {
  _id: string;
  createdAt: string;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  currency: string;
  items: OrderItem[];
  shippingAddress?: ShippingAddress;
}

interface ProfilePayload {
  name: string;
  phone: string;
  streetAddress: string;
  city: string;
  postalCode: string;
  state: string;
  country: string;
  password?: string;
}

const ORDERS_CACHE_KEY = "atelier_orders_cache";

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout, setUser } = useAuth();
  const { totalItems } = useCart();

  const [activeTab, setActiveTab] = useState<"dashboard" | "userinfo" | "orders">("dashboard");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    document.title = "My Account | MAISONÉ";
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/account/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "orders" || tab === "userinfo" || tab === "dashboard") {
        setActiveTab(tab);
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setStreetAddress(user.streetAddress || "");
      setCity(user.city || "");
      setPostalCode(user.postalCode || "");
      setState(user.state || "");
      setCountry(user.country || "India");
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let hasCached = false;
    try {
      const cached = sessionStorage.getItem(ORDERS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setOrders(parsed);
          setOrdersLoading(false);
          hasCached = true;
        }
      }
    } catch {}

    const fetchOrders = async () => {
      try {
        if (!hasCached) {
          setOrdersLoading(true);
        }
        const res = await authApiInstance.get("/orders/my-orders");
        if (res.data?.success && Array.isArray(res.data.orders)) {
          setOrders(res.data.orders);
          try {
            sessionStorage.setItem(ORDERS_CACHE_KEY, JSON.stringify(res.data.orders));
          } catch {}
        }
      } catch (err) {
        console.error("Failed to load orders", err);
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated]);

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem(ORDERS_CACHE_KEY);
    } catch {}
    await logout();
    router.push("/account/login");
  };

  const toggleOrder = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const handleCancelOrder = (orderId: string) => {
    toast("Cancel this order?", {
      description: "This action cannot be undone. Your order will be cancelled.",
      duration: 10000,
      action: {
        label: "Yes, Cancel",
        onClick: async () => {
          setCancellingOrderId(orderId);
          try {
            const res = await authApiInstance.patch(`/orders/${orderId}/cancel`);
            if (res.data?.success) {
              setOrders((prev) =>
                prev.map((o) =>
                  o._id === orderId ? { ...o, orderStatus: "cancelled" } : o
                )
              );
              try {
                sessionStorage.removeItem(ORDERS_CACHE_KEY);
              } catch {}
              toast.success("Order cancelled successfully");
            }
          } catch (err: unknown) {
            const errObj = err as { response?: { data?: { message?: string } } };
            toast.error(errObj.response?.data?.message || "Failed to cancel order");
          } finally {
            setCancellingOrderId(null);
          }
        },
      },
      cancel: {
        label: "No, Keep It",
        onClick: () => {},
      },
    });
  };

  const TRACKING_STEPS = ["placed", "processing", "shipped", "delivered"] as const;

  const getTrackingStepIndex = (status?: string) => {
    const normalized = (status || "").toLowerCase().trim();
    const idx = TRACKING_STEPS.indexOf(normalized as (typeof TRACKING_STEPS)[number]);
    return idx >= 0 ? idx : 0;
  };

  const getStepIcon = (step: string, isActive: boolean, isCompleted: boolean) => {
    const size = 18;
    const color = isCompleted || isActive ? "#02a9f7" : "#94a3b8";
    switch (step) {
      case "placed": return <ClipboardList size={size} color={color} />;
      case "processing": return <Package size={size} color={color} />;
      case "shipped": return <Truck size={size} color={color} />;
      case "delivered": return <CheckCircle2 size={size} color={color} />;
      default: return null;
    }
  };

  const handleProfileSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (password && password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setIsSaving(true);
      const payload: ProfilePayload = {
        name,
        phone,
        streetAddress,
        city,
        postalCode,
        state,
        country,
      };

      if (password && password.trim() !== "") {
        payload.password = password;
      }

      const res = await authApiInstance.put("/auth/profile", payload);

      if (res.data?.success) {
        setUser(res.data.user);
        toast.success("Profile updated successfully!");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string } } };
      const msg = errObj.response?.data?.message || "Failed to update profile.";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const getUserInitial = () => {
    return user?.name ? user.name.charAt(0).toUpperCase() : "U";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Recently";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return styles.statusDelivered;
      case "processing":
      case "shipped":
        return styles.statusProcessing;
      case "cancelled":
        return styles.statusCancelled;
      case "placed":
      default:
        return styles.statusPlaced;
    }
  };

  if (isLoading || !isAuthenticated || !user) {
    return (
      <>
        <Header />
        <main className={styles.accountPageWrapper}>
          <div className={styles.accountContainer}>
            <div className={styles.accountLayout}>
              <aside className={styles.accountSidebar}>
                <div className={styles.skeletonCover} />
                <div className={styles.sidebarProfileInfo}>
                  <div className={styles.skeletonAvatar} />
                  <div className={`${styles.skeletonLine} ${styles.skeletonName}`} />
                  <div className={`${styles.skeletonLine} ${styles.skeletonEmail}`} />
                </div>
                <div className={styles.skeletonNavGroup}>
                  <div className={`${styles.skeletonLine} ${styles.skeletonNavItem}`} />
                  <div className={`${styles.skeletonLine} ${styles.skeletonNavItem}`} />
                  <div className={`${styles.skeletonLine} ${styles.skeletonNavItem}`} />
                </div>
                <div className={styles.sidebarLogoutArea}>
                  <div className={`${styles.skeletonLine} ${styles.skeletonLogout}`} />
                </div>
              </aside>

              <section className={styles.mainContent}>
                <div className={`${styles.skeletonLine} ${styles.skeletonPageTitle}`} />

                <div className={styles.skeletonGreetingWrap}>
                  <div className={`${styles.skeletonLine} ${styles.skeletonGreetingTitle}`} />
                  <div className={`${styles.skeletonLine} ${styles.skeletonGreetingText}`} />
                  <div className={`${styles.skeletonLine} ${styles.skeletonGreetingSubtext}`} />
                </div>

                <div className={styles.statsGrid}>
                  <div className={styles.statBox}>
                    <div className={`${styles.skeletonIconBox} ${styles.skeletonStatIcon}`} />
                    <div className={styles.skeletonStatInfo}>
                      <div className={`${styles.skeletonLine} ${styles.skeletonStatLabel}`} />
                      <div className={`${styles.skeletonLine} ${styles.skeletonStatValue}`} />
                    </div>
                  </div>
                  <div className={styles.statBox}>
                    <div className={`${styles.skeletonIconBox} ${styles.skeletonStatIcon}`} />
                    <div className={styles.skeletonStatInfo}>
                      <div className={`${styles.skeletonLine} ${styles.skeletonStatLabel}`} />
                      <div className={`${styles.skeletonLine} ${styles.skeletonStatValue}`} />
                    </div>
                  </div>
                </div>

                <div className={styles.dashInfoCard}>
                  <div className={`${styles.skeletonLine} ${styles.skeletonCardTitle}`} />
                  <div className={styles.skeletonCardList}>
                    <div className={`${styles.skeletonLine} ${styles.skeletonLine60}`} />
                    <div className={`${styles.skeletonLine} ${styles.skeletonLine50}`} />
                    <div className={`${styles.skeletonLine} ${styles.skeletonLine75}`} />
                  </div>
                </div>

                <div className={`${styles.dashInfoCard} ${styles.dashInfoCardMt}`}>
                  <div className={`${styles.skeletonLine} ${styles.skeletonCardTitleSm}`} />
                  <div className={styles.skeletonCardList}>
                    <div className={`${styles.skeletonLine} ${styles.skeletonLine65}`} />
                    <div className={`${styles.skeletonLine} ${styles.skeletonLine45}`} />
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className={styles.accountPageWrapper}>
        <div className={styles.accountContainer}>
          <div className={styles.accountLayout}>
            <aside className={styles.accountSidebar}>
              <div className={styles.sidebarCover}>
                <Image
                  src="/images/account/cover-img.jpg"
                  alt="Cover Background"
                  fill
                  sizes="(max-width: 900px) 100vw, 380px"
                  className={styles.sidebarCoverImg}
                  priority
                />
              </div>

              <div className={styles.sidebarProfileInfo}>
                <div className={styles.sidebarAvatarWrapper}>
                  <span className={styles.sidebarAvatarInitial}>{getUserInitial()}</span>
                </div>
                <h3 className={styles.sidebarUserName}>{user.name}</h3>
                <p className={styles.sidebarUserEmail}>{user.email}</p>
              </div>

              <nav className={styles.sidebarNav}>
                <ul className={styles.sidebarNavList}>
                  <li className={styles.sidebarNavItem}>
                    <button
                      type="button"
                      className={`${styles.sidebarNavLink} ${
                        activeTab === "dashboard" ? styles.sidebarNavLinkActive : ""
                      }`}
                      onClick={() => setActiveTab("dashboard")}
                    >
                      <Home size={18} />
                      <span>Dashboard</span>
                    </button>
                  </li>

                  <li className={styles.sidebarNavItem}>
                    <button
                      type="button"
                      className={`${styles.sidebarNavLink} ${
                        activeTab === "userinfo" ? styles.sidebarNavLinkActive : ""
                      }`}
                      onClick={() => setActiveTab("userinfo")}
                    >
                      <UserIcon size={18} />
                      <span>User Info</span>
                    </button>
                  </li>

                  <li className={styles.sidebarNavItem}>
                    <button
                      type="button"
                      className={`${styles.sidebarNavLink} ${
                        activeTab === "orders" ? styles.sidebarNavLinkActive : ""
                      }`}
                      onClick={() => setActiveTab("orders")}
                    >
                      <ShoppingBag size={18} />
                      <span>My Orders</span>
                    </button>
                  </li>
                </ul>
              </nav>

              <div className={styles.sidebarLogoutArea}>
                <button type="button" className={styles.sidebarLogoutBtn} onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </aside>

            <section className={styles.mainContent}>
              {activeTab === "dashboard" && (
                <div>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionHeaderTitle}>My Dashboard</h2>
                  </div>

                  <div className={styles.dashboardGreeting}>
                    <h4>
                      Hello, <span>{user.name}</span>
                    </h4>
                    <p className={styles.dashboardGreetingDesc}>
                      Welcome to your personalized My Account Dashboard. Here, you have the power to
                      manage your entire e-commerce experience in one place. Whether you&apos;re exploring the
                      latest products, checking your cart items, or updating your profile, everything is at
                      your fingertips.
                    </p>
                  </div>

                  <div className={styles.statsGrid}>
                    <div className={styles.statBox}>
                      <div className={`${styles.statIconWrapper} ${styles.cartStatIcon}`}>
                        <ShoppingCart size={28} />
                      </div>
                      <div className={styles.statInfo}>
                        <h4>Cart items</h4>
                        <h3>{totalItems}</h3>
                      </div>
                    </div>

                    <div className={styles.statBox}>
                      <div className={`${styles.statIconWrapper} ${styles.orderStatIcon}`}>
                        <ClipboardList size={28} />
                      </div>
                      <div className={styles.statInfo}>
                        <h4>My Orders</h4>
                        <h3>{orders.length}</h3>
                      </div>
                    </div>
                  </div>

                  <div className={styles.dashInfoCard}>
                    <h3 className={styles.dashInfoCardTitle}>Profile Information</h3>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Name:</span>
                      <span className={styles.infoValue}>{user.name}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Phone:</span>
                      <span className={styles.infoValue}>{user.phone || "Phone not provided"}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Address:</span>
                      <span className={styles.infoValue}>
                        {user.streetAddress
                          ? `${user.streetAddress}, ${user.city || ""}`
                          : "Address not provided"}
                      </span>
                      <button
                        type="button"
                        className={styles.editBtnIcon}
                        onClick={() => setActiveTab("userinfo")}
                        title="Edit Profile"
                      >
                        <Pencil size={15} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.dashInfoCard}>
                    <h3 className={styles.dashInfoCardTitle}>Login Details</h3>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Email:</span>
                      <span className={styles.infoValue}>{user.email}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>UserName:</span>
                      <span className={styles.infoValue}>{user.name}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "userinfo" && (
                <div>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionHeaderTitle}>Profile Info Update:</h2>
                  </div>
                  <p className={styles.sectionSubtitle}>Manage your profile settings.</p>

                  <form className={styles.userInfoForm} onSubmit={handleProfileSubmit}>
                    <h4 className={styles.formSectionHeading}>Personal Info:</h4>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                    <input
                      type="email"
                      className={styles.formInput}
                      placeholder="Your email"
                      value={email}
                      disabled
                      title="Email cannot be changed"
                    />
                    <input
                      type="tel"
                      className={styles.formInput}
                      placeholder="Mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />

                    <h4 className={styles.formSectionHeading}>Address Info:</h4>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="Street address"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                    />
                    <div className={styles.formGrid2}>
                      <input
                        type="text"
                        className={styles.formInput}
                        placeholder="Your city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                      <input
                        type="text"
                        className={styles.formInput}
                        placeholder="Your postal code"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                      />
                    </div>
                    <div className={styles.formGrid2}>
                      <input
                        type="text"
                        className={styles.formInput}
                        placeholder="Your state"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                      />
                      <input
                        type="text"
                        className={styles.formInput}
                        placeholder="Your Country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                      />
                    </div>

                    <h4 className={styles.formSectionHeading}>Change Password (Optional):</h4>
                    <div className={styles.passwordInputWrapper}>
                      <input
                        type={showPassword ? "text" : "password"}
                        className={styles.formInput}
                        placeholder="New Password (leave empty to keep current)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className={styles.eyeToggleBtn}
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Toggle password view"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {password && (
                      <input
                        type="password"
                        className={styles.formInput}
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required={Boolean(password)}
                      />
                    )}

                    <button type="submit" className={styles.saveInfoBtn} disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save Info"}
                    </button>
                  </form>
                </div>
              )}

              {activeTab === "orders" && (
                <div>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionHeaderTitle}>My Orders</h2>
                  </div>

                  <div className={styles.ordersTableWrapper}>
                    <table className={styles.ordersTable}>
                      <thead>
                        <tr>
                          <th>No</th>
                          <th>Order Number</th>
                          <th>Date</th>
                          <th>Amount</th>
                          <th>Order status</th>
                          <th>View</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ordersLoading ? (
                          [1, 2, 3, 4].map((i) => (
                            <tr key={i} className={styles.skeletonTableRow}>
                              <td>
                                <div className={`${styles.skeletonLine} ${styles.skeletonCellNo}`} />
                              </td>
                              <td>
                                <div className={`${styles.skeletonLine} ${styles.skeletonCellOrder}`} />
                              </td>
                              <td>
                                <div className={`${styles.skeletonLine} ${styles.skeletonCellDate}`} />
                              </td>
                              <td>
                                <div className={`${styles.skeletonLine} ${styles.skeletonCellAmount}`} />
                              </td>
                              <td>
                                <div className={`${styles.skeletonLine} ${styles.skeletonCellStatus}`} />
                              </td>
                              <td>
                                <div className={`${styles.skeletonLine} ${styles.skeletonCellAction}`} />
                              </td>
                            </tr>
                          ))
                        ) : orders.length === 0 ? (
                          <tr>
                            <td colSpan={6} className={styles.noOrdersMessage}>
                              No Order Found
                            </td>
                          </tr>
                        ) : (
                          orders.map((order, index) => {
                            const isExpanded = expandedOrderId === order._id;
                            return (
                              <tr key={order._id}>
                                <td>{index + 1}</td>
                                <td>
                                  <strong>#{order._id.slice(-8).toUpperCase()}</strong>
                                </td>
                                <td>{formatDate(order.createdAt)}</td>
                                <td>
                                  <strong>
                                    ₹{order.totalAmount?.toLocaleString("en-IN") || 0}
                                  </strong>
                                </td>
                                <td>
                                  <span
                                    className={`${styles.orderStatusBadge} ${getStatusBadgeClass(
                                      order.orderStatus
                                    )}`}
                                  >
                                    {order.orderStatus || "Placed"}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className={styles.viewOrderBtn}
                                    onClick={() => toggleOrder(order._id)}
                                  >
                                    {isExpanded ? "Hide" : "View"}
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {expandedOrderId && (
                    <div className={styles.orderDetailCard}>
                      {(() => {
                        const selectedOrder = orders.find((o) => o._id === expandedOrderId);
                        if (!selectedOrder) return null;
                        const normalizedStatus = (selectedOrder.orderStatus || "").toLowerCase().trim();
                        const isCancelled = normalizedStatus === "cancelled";
                        const currentStepIdx = getTrackingStepIndex(normalizedStatus);
                        const canCancel = ["placed", "processing"].includes(normalizedStatus);
                        const isCancelling = cancellingOrderId === selectedOrder._id;
                        return (
                          <div>
                            <div className={styles.orderDetailTop}>
                              <h4 className={styles.orderDetailHeading}>
                                Order #{selectedOrder._id.slice(-8).toUpperCase()}
                              </h4>
                              <span className={styles.orderDetailDate}>
                                {formatDate(selectedOrder.createdAt)}
                              </span>
                            </div>

                            {isCancelled ? (
                              <div className={styles.cancelledBanner}>
                                <XCircle size={20} />
                                <span>This order has been cancelled</span>
                              </div>
                            ) : (
                              <div className={styles.trackingTimeline}>
                                {TRACKING_STEPS.map((step, idx) => {
                                  const isCompleted = idx < currentStepIdx;
                                  const isActive = idx === currentStepIdx;
                                  return (
                                    <div
                                      key={step}
                                      className={`${styles.trackingStep} ${isCompleted ? styles.trackingStepCompleted : ""} ${isActive ? styles.trackingStepActive : ""}`}
                                    >
                                      <div className={styles.trackingDot}>
                                        {getStepIcon(step, isActive, isCompleted)}
                                      </div>
                                      {idx < TRACKING_STEPS.length - 1 && (
                                        <div className={`${styles.trackingLine} ${isCompleted ? styles.trackingLineCompleted : ""}`} />
                                      )}
                                      <span className={styles.trackingLabel}>{step}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            <div className={styles.orderSummaryRow}>
                              <div className={styles.orderSummaryItem}>
                                <span className={styles.orderSummaryLabel}>Payment</span>
                                <span className={styles.orderSummaryValue} style={{ textTransform: "uppercase" }}>
                                  {selectedOrder.paymentMethod}
                                </span>
                              </div>
                              <div className={styles.orderSummaryItem}>
                                <span className={styles.orderSummaryLabel}>Subtotal</span>
                                <span className={styles.orderSummaryValue}>
                                  ₹{selectedOrder.subtotal?.toLocaleString("en-IN")}
                                </span>
                              </div>
                              <div className={styles.orderSummaryItem}>
                                <span className={styles.orderSummaryLabel}>Delivery</span>
                                <span className={styles.orderSummaryValue}>
                                  {selectedOrder.deliveryCharge === 0 ? "Free" : `₹${selectedOrder.deliveryCharge}`}
                                </span>
                              </div>
                              <div className={styles.orderSummaryItem}>
                                <span className={styles.orderSummaryLabel}>Total</span>
                                <span className={`${styles.orderSummaryValue} ${styles.orderSummaryTotal}`}>
                                  ₹{selectedOrder.totalAmount?.toLocaleString("en-IN")}
                                </span>
                              </div>
                            </div>

                            <div className={styles.orderItemsList}>
                              {selectedOrder.items?.map((item, idx) => (
                                <div key={idx} className={styles.orderItemRow}>
                                  <div className={styles.orderItemThumb}>
                                    {item.image ? (
                                      <Image
                                        src={item.image}
                                        alt={item.title || "Product"}
                                        fill
                                        sizes="50px"
                                        className={styles.orderItemThumbImg}
                                      />
                                    ) : null}
                                  </div>
                                  <div className={styles.orderItemInfo}>
                                    <div className={styles.orderItemTitle}>{item.title}</div>
                                    <div className={styles.orderItemMeta}>
                                      {item.color && `Color: ${item.color}`}
                                      {item.size && ` · Size: ${item.size}`}
                                      {` · Qty: ${item.quantity}`}
                                    </div>
                                  </div>
                                  <div className={styles.orderItemTotal}>
                                    ₹{((item.price?.amount || 0) * item.quantity).toLocaleString("en-IN")}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {selectedOrder.shippingAddress && (
                              <div className={styles.orderDetailShipping}>
                                <strong>Shipping Address:</strong> {selectedOrder.shippingAddress.fullName},{" "}
                                {selectedOrder.shippingAddress.streetAddress},{" "}
                                {selectedOrder.shippingAddress.city},{" "}
                                {selectedOrder.shippingAddress.state} -{" "}
                                {selectedOrder.shippingAddress.postalCode} | Phone:{" "}
                                {selectedOrder.shippingAddress.phone}
                              </div>
                            )}

                            {canCancel && (
                              <div className={styles.cancelOrderArea}>
                                <button
                                  type="button"
                                  className={styles.cancelOrderBtn}
                                  onClick={() => handleCancelOrder(selectedOrder._id)}
                                  disabled={isCancelling}
                                >
                                  <XCircle size={16} />
                                  <span>{isCancelling ? "Cancelling..." : "Cancel Order"}</span>
                                </button>
                                <p className={styles.cancelOrderHint}>
                                  You can cancel this order as it has not been shipped yet.
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
