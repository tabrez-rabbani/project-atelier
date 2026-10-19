"use client";

import Image from "next/image";
import Link from "next/link";
import { X, Loader2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import styles from "./CartDrawer.module.css";

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalItems, subtotal, isLoading } = useCart();
  const { isAuthenticated } = useAuth();

  return (
    <>
      <div
        className={`${styles.overlay} ${isOpen ? styles["overlay--open"] : ""}`}
        onClick={closeCart}
        aria-hidden="true"
      />

      <aside
        className={`${styles.drawer} ${isOpen ? styles["drawer--open"] : ""}`}
        aria-label="Shopping cart"
        role="dialog"
      >
        <div className={styles.drawer__header}>
          <h2 className={styles.drawer__title}>
            Cart
            {totalItems > 0 && <span className={styles.drawer__count}>({totalItems})</span>}
          </h2>
          <button type="button" className={styles.drawer__close} onClick={closeCart} aria-label="Close cart">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {!isAuthenticated ? (
          <div className={styles.drawer__empty}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            <p className={styles.drawer__emptyText}>Sign in to view your bag</p>
            <Link href="/account/login" className={styles.drawer__shopBtn} onClick={closeCart}>
              Sign In to Account
            </Link>
          </div>
        ) : isLoading && items.length === 0 ? (
          <div className={styles.drawer__empty}>
            <Loader2 size={28} className={styles.drawer__loader} />
            <p className={styles.drawer__emptyText}>Loading bag...</p>
          </div>
        ) : items.length === 0 ? (
          <div className={styles.drawer__empty}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            <p className={styles.drawer__emptyText}>Your cart is empty</p>
            <button type="button" className={styles.drawer__shopBtn} onClick={closeCart}>
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <ul className={styles.drawer__items}>
              {items.map((item) => (
                <li key={`${item.id}-${item.color}-${item.size}`} className={styles.item}>
                  <button
                    type="button"
                    className={styles.item__remove}
                    onClick={() => {
                      removeItem(item.id, item.color, item.size);
                      toast.info("Item removed from cart");
                    }}
                    aria-label={`Remove ${item.title}`}
                  >
                    ×
                  </button>

                  <div className={styles.item__image}>
                    <Image src={item.image} alt={item.title} fill sizes="80px" />
                  </div>

                  <div className={styles.item__details}>
                    <p className={styles.item__title}>{item.title}</p>
                    <p className={styles.item__meta}>
                      {item.color} / {item.size}
                    </p>
                    <div className={styles.item__bottom}>
                      <div className={styles.item__qty}>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.color, item.size, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.color, item.size, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <span className={styles.item__price}>₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className={styles.drawer__footer}>
              <div className={styles.drawer__subtotal}>
                <span>Subtotal:</span>
                <span className={styles.drawer__subtotalPrice}>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>

              <Link href="/cart" className={styles.drawer__checkoutBtn} onClick={closeCart}>
                View Cart
              </Link>

              <p className={styles.drawer__shipping}>Free Shipping on All Orders Over ₹999!</p>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
