"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, X, ArrowLeft, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Header, Footer } from "@/components";
import { toast } from "sonner";
import styles from "./cart.module.css";

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { items, removeItem, updateQuantity, clearCart, subtotal, totalItems, isLoading } = useCart();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/account/login");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) return null;

  const deliveryCharge = subtotal >= 999 ? 0 : 99;
  const total = subtotal + deliveryCharge;

  const handleRemoveItem = (id: string, color: string, size: string, title: string) => {
    removeItem(id, color, size);
    toast.info(`${title} removed from cart`);
  };

  const handleClearCart = () => {
    if (items.length === 0) return;
    clearCart();
    toast.info("Cart cleared");
  };

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={`container ${styles.content}`}>
          {isLoading && items.length === 0 ? (
            <div className={styles.cartLoading}>
              <div className={styles.cartLoadingSpinner} />
              <p className={styles.empty__text}>Loading your cart...</p>
            </div>
          ) : items.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.empty__icon} aria-hidden="true">
                <ShoppingBag size={48} strokeWidth={1.2} />
              </div>
              <h2 className={styles.empty__title}>Your cart is currently empty</h2>
              <p className={styles.empty__text}>Discover our curated luxury wardrobe and discover timeless pieces.</p>
              <Link href="/collection" className={styles.empty__btn}>
                Explore Collection
              </Link>
            </div>
          ) : (
            <>
              <div className={styles.cartItemsSection}>
                <div className={styles.cartHeader}>
                  <h1 className={styles.cartTitle}>Shopping Bag</h1>
                  <span className={styles.cartCount}>
                    ({totalItems} {totalItems === 1 ? "item" : "items"})
                  </span>
                </div>

                <div className={styles.tableHead}>
                  <span className={styles.tableHead__img}></span>
                  <span className={styles.tableHead__product}>Product</span>
                  <span className={styles.tableHead__price}>Price</span>
                  <span className={styles.tableHead__qty}>Quantity</span>
                  <span className={styles.tableHead__total}>Total</span>
                  <span className={styles.tableHead__action}></span>
                </div>

                <div className={styles.itemsList}>
                  {items.map((item) => (
                    <div key={`${item.id}-${item.color}-${item.size}`} className={styles.cartRow}>
                      <div className={styles.cartRow__image}>
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          sizes="(max-width: 768px) 72px, 84px"
                        />
                      </div>

                      <div className={styles.cartRow__info}>
                        <p className={styles.cartRow__title}>{item.title}</p>
                        <p className={styles.cartRow__meta}>
                          <span>{item.color}</span>
                          <span className={styles.cartRow__metaSep}>/</span>
                          <span>{item.size}</span>
                          <span className={styles.cartRow__mobileUnitPrice}> • ₹{item.price.toLocaleString("en-IN")}</span>
                        </p>
                      </div>

                      <div className={styles.cartRow__price}>
                        ₹{item.price.toLocaleString("en-IN")}
                      </div>

                      <div className={styles.cartRow__qty}>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.color, item.size, item.quantity - 1)}
                          aria-label="Decrease quantity"
                          className={styles.cartRow__qtyBtn}
                        >
                          −
                        </button>
                        <span className={styles.cartRow__qtyValue}>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.color, item.size, item.quantity + 1)}
                          aria-label="Increase quantity"
                          className={styles.cartRow__qtyBtn}
                        >
                          +
                        </button>
                      </div>

                      <div className={styles.cartRow__total}>
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </div>

                      <button
                        type="button"
                        className={styles.cartRow__remove}
                        onClick={() => handleRemoveItem(item.id, item.color, item.size, item.title)}
                        aria-label={`Remove ${item.title}`}
                      >
                        <X size={15} strokeWidth={2} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className={styles.cartActions}>
                  <Link href="/collection" className={styles.cartActions__continue}>
                    <ArrowLeft size={14} strokeWidth={2} />
                    <span>Continue Shopping</span>
                  </Link>

                  <button type="button" className={styles.cartActions__clear} onClick={handleClearCart}>
                    <Trash2 size={13} strokeWidth={2} />
                    <span>Clear Cart</span>
                  </button>
                </div>
              </div>

              <div className={styles.sidebar}>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryHeader}>
                    <h2 className={styles.summaryTitle}>Cart Totals</h2>
                    <span className={styles.summaryItemCount}>{totalItems} {totalItems === 1 ? "item" : "items"}</span>
                  </div>

                  <div className={styles.summaryTable}>
                    <div className={styles.summaryTableRow}>
                      <span className={styles.summaryTableLabel}>Subtotal</span>
                      <span className={styles.summaryTableValue}>₹{subtotal.toLocaleString("en-IN")}</span>
                    </div>

                    <div className={styles.summaryTableRow}>
                      <span className={styles.summaryTableLabel}>Delivery Charges</span>
                      <span className={deliveryCharge === 0 ? styles.summaryTableFree : styles.summaryTableValue}>
                        {deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}`}
                      </span>
                    </div>

                    <div className={`${styles.summaryTableRow} ${styles.summaryTableRowTotal}`}>
                      <span className={styles.summaryTableTotalLabel}>Total</span>
                      <span className={styles.summaryTableTotalValue}>₹{total.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  <Link href="/checkout" className={styles.checkoutBtn}>
                    <span>Proceed to Checkout</span>
                    <ArrowRight size={15} strokeWidth={2} />
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
