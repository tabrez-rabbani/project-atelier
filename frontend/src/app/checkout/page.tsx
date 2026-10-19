"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { Check, Lock } from "lucide-react";
import { Header, Footer } from "@/components";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import authApiInstance from "@/lib/axios";
import { toast } from "sonner";
import styles from "./checkout.module.css";

interface RazorpayPaymentSuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayPaymentFailure {
  error?: {
    description?: string;
  };
}

interface PlacedOrder {
  _id?: string;
  paymentMethod?: string;
  totalAmount?: number;
}

const loadRazorpayScript = () => {
  return new Promise<boolean>((resolve) => {
    if (typeof window !== "undefined" && (window as unknown as { Razorpay?: unknown }).Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      setTimeout(() => {
        resolve(Boolean((window as unknown as { Razorpay?: unknown }).Razorpay));
      }, 800);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart, isLoading } = useCart();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/account/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    email: "",
    phone: "",
    streetAddress: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });

  const [isEditingAddress, setIsEditingAddress] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<PlacedOrder | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");

  const deliveryCharge = subtotal >= 999 ? 0 : 99;
  const total = subtotal + deliveryCharge;

  useEffect(() => {
    let savedAddr: Partial<typeof shippingAddress> = {};
    try {
      const stored = localStorage.getItem("atelier_shipping_address");
      if (stored) {
        savedAddr = JSON.parse(stored);
      }
    } catch {}

    setShippingAddress((prev) => ({
      ...prev,
      ...savedAddr,
      fullName: savedAddr.fullName || prev.fullName || user?.name || "",
      email: savedAddr.email || prev.email || user?.email || "",
      phone: savedAddr.phone || prev.phone || user?.phone || "",
    }));

    if (savedAddr.streetAddress && savedAddr.city && savedAddr.postalCode) {
      setIsEditingAddress(false);
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!shippingAddress.fullName.trim()) errors.fullName = "Name is required";
    if (!shippingAddress.email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(shippingAddress.email)) errors.email = "Enter a valid email";

    if (!shippingAddress.phone.trim()) errors.phone = "Phone number is required";
    else if (shippingAddress.phone.trim().length < 10) errors.phone = "Enter a valid 10-digit number";

    if (!shippingAddress.streetAddress.trim()) errors.streetAddress = "Street address is required";
    if (!shippingAddress.city.trim()) errors.city = "City is required";
    if (!shippingAddress.state.trim()) errors.state = "State is required";
    if (!shippingAddress.postalCode.trim()) errors.postalCode = "Postal code is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveAddress = () => {
    if (validateForm()) {
      setIsEditingAddress(false);
      try {
        localStorage.setItem("atelier_shipping_address", JSON.stringify(shippingAddress));
      } catch (err) {
        console.error("Failed to save address to localStorage", err);
      }
    }
  };

  const handlePlaceOrder = async () => {
    setServerError("");
    if (!validateForm()) {
      setIsEditingAddress(true);
      return;
    }

    try {
      localStorage.setItem("atelier_shipping_address", JSON.stringify(shippingAddress));
    } catch {}

    if (!isAuthenticated) {
      setServerError("Please login to complete your order.");
      router.push("/account/login");
      return;
    }

    try {
      setIsPlacingOrder(true);

      if (paymentMethod === "online") {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error("Unable to load payment gateway. Please check your internet connection.");
        }

        const createRes = await authApiInstance.post("/cart/payment/create/order", {
          shippingAddress,
        });

        const { order, keyId } = createRes.data;

        const options = {
          key: keyId,
          amount: order.amount,
          currency: order.currency || "INR",
          name: "MAISONÉ",
          description: "Purchase Payment",
          order_id: order.id,
          prefill: {
            name: shippingAddress.fullName,
            email: shippingAddress.email,
            contact: shippingAddress.phone,
          },
          theme: {
            color: "#18181b",
          },
          handler: async (response: RazorpayPaymentSuccess) => {
            try {
              const verifyRes = await authApiInstance.post("/cart/payment/verify/order", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                shippingAddress,
              });

              if (verifyRes.data.success) {
                const confirmedOrder = verifyRes.data.order || { _id: verifyRes.data.orderId, paymentMethod: "online" };
                setOrderSuccess({ ...confirmedOrder, paymentMethod: confirmedOrder.paymentMethod || "online" });
                clearCart();
              }
            } catch (vErr: unknown) {
              const errObj = vErr as { response?: { data?: { message?: string } } };
              const msg =
                errObj.response?.data?.message ||
                "Payment verification failed. If money was deducted, it will be refunded or please contact support.";
              setServerError(msg);
            } finally {
              setIsPlacingOrder(false);
            }
          },
          modal: {
            ondismiss: () => {
              setIsPlacingOrder(false);
            },
          },
        };

        const RazorpayClass = (window as unknown as { Razorpay: new (opts: typeof options) => { on: (event: string, cb: (res: RazorpayPaymentFailure) => void) => void; open: () => void } }).Razorpay;
        const razorpayInstance = new RazorpayClass(options);
        razorpayInstance.on("payment.failed", (response: RazorpayPaymentFailure) => {
          setIsPlacingOrder(false);
          setServerError(response.error?.description || "Payment failed. Please try again.");
        });
        razorpayInstance.open();
        return;
      }

      const response = await authApiInstance.post("/orders/place", {
        shippingAddress,
        paymentMethod,
      });

      if (response.data.success) {
        setOrderSuccess(response.data.order);
        clearCart();
        toast.success("Order placed successfully!");
      }
      setIsPlacingOrder(false);
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string; errors?: Array<{ msg?: string }> } }; message?: string };
      const msg = errObj.response?.data?.message || errObj.response?.data?.errors?.[0]?.msg || errObj.message || "Failed to place order. Please try again.";
      setServerError(msg);
      toast.error(msg);
      setIsPlacingOrder(false);
    }
  };

  if (authLoading || !isAuthenticated) return null;

  if (orderSuccess) {
    const isCod = orderSuccess.paymentMethod === "cod";
    const isDirect = orderSuccess.paymentMethod === "direct";

    return (
      <>
        <Header />
        <main>
          <div className={styles.container}>
            <div className={styles.successCard}>
              <div className={styles.successIcon}>
                <Check size={36} strokeWidth={2.5} />
              </div>
              <h1 className={styles.successTitle}>
                {isDirect ? "Order Request Received!" : "Order Placed Successfully!"}
              </h1>
              <p className={styles.successSubtitle}>
                {isCod
                  ? "Thank you for your order! Your Cash on Delivery request is confirmed. Please keep cash ready when the delivery arrives at your doorstep."
                  : isDirect
                  ? "Thank you for your order request! Our concierge team will reach out directly to your phone/WhatsApp to coordinate payment & delivery."
                  : "Thank you for your purchase! We have verified your online payment with Razorpay and are preparing your order for shipment."}
              </p>
              <div className={styles.orderBadge}>
                Order ID: #{orderSuccess._id?.slice(-8).toUpperCase()}
                {isCod && " • [ Cash on Delivery ]"}
                {isDirect && " • [ Direct Contact ]"}
                {!isCod && !isDirect && " • [ Online Paid ]"}
              </div>
              <div className={styles.successActions}>
                <Link href="/account?tab=orders" className={styles.viewOrdersBtn}>
                  Track Order
                </Link>
                <Link href="/collection" className={styles.continueShoppingBtn}>
                  Continue Shopping
                </Link>
              </div>
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
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <main>
        <div className={styles.container}>
          <div className={styles.checkoutHeader}>
            <Link href="/cart" className={styles.backLink}>
              ← Return to Cart
            </Link>
            <h1 className={styles.checkoutTitle}>Checkout</h1>
          </div>

          {isLoading && items.length === 0 ? (
            <div className={styles.checkoutSkeletonLayout}>
              <div className={styles.mainColumn}>
                <div className={styles.skeletonCard}>
                  <div className={styles.skeletonHeader} />
                  <div className={styles.skeletonGrid}>
                    <div className={styles.skeletonField} />
                    <div className={styles.skeletonField} />
                    <div className={styles.skeletonField} />
                    <div className={styles.skeletonField} />
                  </div>
                </div>
                <div className={styles.skeletonCard}>
                  <div className={styles.skeletonHeader} />
                  <div className={`${styles.skeletonField} ${styles["skeletonField--mb"]}`} />
                  <div className={styles.skeletonField} />
                </div>
              </div>
              <div className={styles.summarySidebar}>
                <div className={styles.skeletonSummaryCard}>
                  <div className={styles.skeletonHeader} />
                  <div className={styles.skeletonItem} />
                  <div className={styles.skeletonItem} />
                  <div className={styles.skeletonLine} />
                  <div className={styles.skeletonButton} />
                </div>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className={styles.emptyState}>
              <h2 className={styles.emptyTitle}>Your cart is empty</h2>
              <p className={styles.emptyText}>Add some items to your bag before proceeding to checkout.</p>
              <Link href="/collection" className={styles.emptyBtn}>
                Explore Collection
              </Link>
            </div>
          ) : (
            <div className={styles.checkoutLayout}>
              <div className={styles.mainColumn}>
                <div className={styles.addressCard}>
                  <div className={styles.addressHeader}>
                    <h2 className={styles.addressTitle}>Order Address :</h2>
                    <button
                      type="button"
                      className={styles.editBtn}
                      onClick={() => setIsEditingAddress(!isEditingAddress)}
                    >
                      {isEditingAddress ? "Done" : "Edit"}
                    </button>
                  </div>

                  {!isEditingAddress ? (
                    <div className={styles.savedAddressPreview}>
                      <div className={styles.savedAddressName}>{shippingAddress.fullName}</div>
                      <div>{shippingAddress.streetAddress}</div>
                      <div>{shippingAddress.city}, {shippingAddress.state} - {shippingAddress.postalCode}</div>
                      <div>{shippingAddress.country}</div>
                      <div className={styles.savedAddressMeta}>
                        Phone: {shippingAddress.phone} | Email: {shippingAddress.email}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={styles.formGrid}>
                        <div className={styles.inputGroup}>
                          <input
                            type="text"
                            name="fullName"
                            placeholder="Enter your name"
                            value={shippingAddress.fullName}
                            onChange={handleInputChange}
                            className={styles.inputField}
                          />
                          {formErrors.fullName && <span className={styles.fieldError}>{formErrors.fullName}</span>}
                        </div>

                        <div className={styles.inputGroup}>
                          <input
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            value={shippingAddress.email}
                            onChange={handleInputChange}
                            className={styles.inputField}
                          />
                          {formErrors.email && <span className={styles.fieldError}>{formErrors.email}</span>}
                        </div>

                        <div className={styles.inputGroup}>
                          <input
                            type="tel"
                            name="phone"
                            placeholder="Enter your phone number"
                            value={shippingAddress.phone}
                            onChange={handleInputChange}
                            className={styles.inputField}
                          />
                          {formErrors.phone && <span className={styles.fieldError}>{formErrors.phone}</span>}
                        </div>

                        <div className={styles.inputGroup}>
                          <input
                            type="text"
                            name="streetAddress"
                            placeholder="Enter your streetAddress"
                            value={shippingAddress.streetAddress}
                            onChange={handleInputChange}
                            className={styles.inputField}
                          />
                          {formErrors.streetAddress && <span className={styles.fieldError}>{formErrors.streetAddress}</span>}
                        </div>

                        <div className={styles.inputGroup}>
                          <input
                            type="text"
                            name="postalCode"
                            placeholder="Enter your postalcode"
                            value={shippingAddress.postalCode}
                            onChange={handleInputChange}
                            className={styles.inputField}
                          />
                          {formErrors.postalCode && <span className={styles.fieldError}>{formErrors.postalCode}</span>}
                        </div>

                        <div className={styles.inputGroup}>
                          <input
                            type="text"
                            name="city"
                            placeholder="Enter your city name"
                            value={shippingAddress.city}
                            onChange={handleInputChange}
                            className={styles.inputField}
                          />
                          {formErrors.city && <span className={styles.fieldError}>{formErrors.city}</span>}
                        </div>

                        <div className={styles.inputGroup}>
                          <input
                            type="text"
                            name="state"
                            placeholder="Enter your state"
                            value={shippingAddress.state}
                            onChange={handleInputChange}
                            className={styles.inputField}
                          />
                          {formErrors.state && <span className={styles.fieldError}>{formErrors.state}</span>}
                        </div>

                        <div className={styles.inputGroup}>
                          <input
                            type="text"
                            name="country"
                            placeholder="Enter your country name"
                            value={shippingAddress.country}
                            onChange={handleInputChange}
                            className={styles.inputField}
                          />
                        </div>
                      </div>

                      <div className={styles.addressSaveBar}>
                        <button
                          type="button"
                          className={styles.saveAddressBtn}
                          onClick={handleSaveAddress}
                        >
                          Save & Continue
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className={styles.paymentCard}>
                  <h3 className={styles.paymentTitle}>
                    <span className={styles.titleAccent} />
                    Payment Method
                  </h3>
                  <div className={styles.paymentOptions}>
                    {[
                      {
                        value: "online",
                        label: "Online Payment",
                        desc: "UPI, Debit/Credit Card, Net Banking",
                      },
                      {
                        value: "cod",
                        label: "Cash on Delivery (COD)",
                        desc: "Pay in cash when order arrives at your doorstep",
                      },
                      {
                        value: "direct",
                        label: "By Direct Contact",
                        desc: "Direct coordination with our concierge team",
                      },
                    ].map((opt) => (
                      <label key={opt.value} className={styles.paymentOption}>
                        <input
                          type="radio"
                          name="payment"
                          value={opt.value}
                          checked={paymentMethod === opt.value}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        <span className={styles.paymentRadio} />
                        <div className={styles.paymentLabelWrap}>
                          <span className={styles.paymentLabel}>{opt.label}</span>
                          <span className={styles.paymentDesc}>{opt.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.summarySidebar}>
                <div className={styles.summaryCard}>
                  <h3 className={styles.summaryTitle}>Order Summary</h3>

                  <div className={styles.itemsList}>
                    {items.map((item) => (
                      <div key={`${item.id}-${item.color}-${item.size}`} className={styles.itemRow}>
                        <div className={styles.itemImageWrap}>
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            sizes="60px"
                          />
                        </div>
                        <div className={styles.itemDetails}>
                          <p className={styles.itemTitle}>{item.title}</p>
                          <p className={styles.itemMeta}>
                            {item.color} / {item.size} × {item.quantity}
                          </p>
                        </div>
                        <span className={styles.itemPrice}>
                          ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className={styles.costTable}>
                    <div className={styles.costRow}>
                      <span>Subtotal</span>
                      <span>₹{subtotal.toLocaleString("en-IN")}</span>
                    </div>
                    <div className={styles.costRow}>
                      <span>Delivery Charges</span>
                      <span>
                        {deliveryCharge === 0 ? (
                          <span className={styles.freeTag}>FREE</span>
                        ) : (
                          `₹${deliveryCharge}`
                        )}
                      </span>
                    </div>
                    <div className={styles.totalRow}>
                      <span>Total Amount</span>
                      <span>₹{total.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  {serverError && (
                    <div className={styles.serverError}>
                      {serverError}
                    </div>
                  )}

                  <button
                    type="button"
                    className={styles.placeOrderBtn}
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder}
                  >
                    {isPlacingOrder
                      ? "Processing..."
                      : paymentMethod === "online"
                      ? `Proceed to Pay (₹${total.toLocaleString("en-IN")})`
                      : "Place Order"}
                  </button>

                  <div className={styles.securityNote}>
                    <Lock size={14} strokeWidth={2} />
                    <span>100% Secure Checkout Guarantee</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
