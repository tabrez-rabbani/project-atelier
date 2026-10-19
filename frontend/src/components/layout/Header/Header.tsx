"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks } from "@/lib/data";
import { Search, ChevronDown, X, Heart, User, ShoppingCart, LogOut, Package, LayoutDashboard } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import SearchModal from "@/components/layout/SearchModal/SearchModal";
import styles from "./Header.module.css";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { openCart, totalItems } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const { wishlistIds } = useWishlist();

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };


  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);


  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setExpandedSection(null);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await logout();
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const toggleSection = (label: string) => {
    setExpandedSection((prev) => (prev === label ? null : label));
  };

  return (
    <header className={styles.header} id="site-header">
      <div className={`container ${styles.header__inner}`}>
        <Link href="/" className={styles.header__logo} aria-label="MAISON home" onClick={handleLogoClick}>
          MAISON
        </Link>

        <nav className={styles.header__nav} aria-label="Main navigation">
          {navLinks.map((link) =>
            link.children ? (
              <div key={link.label} className={styles.header__navItem}>
                <span>{link.label}</span>
                <ChevronDown className={styles.header__navChevron} strokeWidth={2.5} />
                <div className={styles.header__dropdown}>
                  {link.children.map((child) => (
                    <Link key={child.label} href={child.href} className={styles.header__dropdownLink}>
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link key={link.label} href={link.href} className={styles.header__navItem}>
                {link.label}
              </Link>
            )
          )}
        </nav>

        <div className={styles.header__actions}>
          <button
            type="button"
            className={styles.header__search}
            onClick={() => setIsSearchOpen(true)}
            aria-label="Open search"
          >
            <Search className={styles.header__searchIcon} strokeWidth={2} />
            <span className={styles.header__searchPlaceholder}>Search for dresses, tops...</span>
          </button>

          <button
            type="button"
            className={styles.header__searchBtn}
            onClick={() => setIsSearchOpen(true)}
            aria-label="Search"
          >
            <Search size={20} strokeWidth={2} />
          </button>

          <Link
            href="/wishlist"
            className={`${styles.header__iconLink} ${styles.header__wishlistBtn}`}
            aria-label="Wishlist"
          >
            <Heart size={20} strokeWidth={2} />
            {wishlistIds.size > 0 && (
              <span className={styles.header__wishlistBadge}>{wishlistIds.size}</span>
            )}
          </Link>


          {isAuthenticated ? (
            <div
              ref={profileRef}
              className={`${styles.header__profileWrapper} ${isProfileOpen ? styles["header__profileWrapper--open"] : ""}`}
            >
              <button
                type="button"
                className={`${styles.header__iconLink} ${styles.header__profileBtn}`}
                aria-label="My Account"
                aria-expanded={isProfileOpen}
                onClick={() => setIsProfileOpen((p) => !p)}
              >
                <User size={20} strokeWidth={2} />
              </button>

              <div className={styles.header__profileDropdown}>
                {user?.role === "admin" ? (
                  <Link href="/admin" className={styles.header__profileLink} onClick={() => setIsProfileOpen(false)}>
                    <LayoutDashboard size={15} />
                    <span>Admin Panel</span>
                  </Link>
                ) : (
                  <>
                    <Link href="/account" className={styles.header__profileLink} onClick={() => setIsProfileOpen(false)}>
                      <User size={15} />
                      <span>My Account</span>
                    </Link>
                    <Link href="/account?tab=orders" className={styles.header__profileLink} onClick={() => setIsProfileOpen(false)}>
                      <Package size={15} />
                      <span>Orders</span>
                    </Link>
                    <Link href="/wishlist" className={styles.header__profileLink} onClick={() => setIsProfileOpen(false)}>
                      <Heart size={15} />
                      <span>Wishlist</span>
                    </Link>
                  </>
                )}
                <button
                  type="button"
                  className={`${styles.header__profileLink} ${styles.header__profileLogout}`}
                  onClick={handleLogout}
                >
                  <LogOut size={15} />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/account/login"
              className={styles.header__iconLink}
              aria-label="Sign In"
              title="Sign In"
            >
              <User size={20} strokeWidth={2} />
            </Link>
          )}

          <button
            type="button"
            className={`${styles.header__iconLink} ${styles.header__cartBtn}`}
            aria-label="Shopping cart"
            onClick={openCart}
          >
            <ShoppingCart size={20} strokeWidth={2} />
            <span className={styles.header__cartBadge}>
              {totalItems > 0 && totalItems}
            </span>
          </button>


          <button
            className={`${styles.header__menuBtn} ${isMobileMenuOpen ? styles["header__menuBtn--active"] : ""}`}
            type="button"
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          >
            <span className={styles.hamburger}>
              <span className={styles.hamburgerLine} />
              <span className={styles.hamburgerLine} />
              <span className={styles.hamburgerLine} />
            </span>
          </button>
        </div>
      </div>


      <div
        className={`${styles.mobileMenu__overlay} ${isMobileMenuOpen ? styles["mobileMenu__overlay--open"] : ""}`}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />


      <aside
        className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles["mobileMenu--open"] : ""}`}
        aria-label="Mobile navigation"
        aria-hidden={!isMobileMenuOpen}
      >

        <div className={styles.mobileMenu__header}>
          <Link href="/" className={styles.mobileMenu__brand} onClick={closeMobileMenu}>
            MAISON
          </Link>
          <button
            type="button"
            className={styles.mobileMenu__closeBtn}
            onClick={closeMobileMenu}
            aria-label="Close menu"
          >
            <X size={22} strokeWidth={2} />
          </button>
        </div>


        <nav className={styles.mobileMenu__nav} aria-label="Mobile navigation links">
          {navLinks.map((link, idx) => (
            <div
              key={link.label}
              className={styles.mobileMenu__item}
              style={{ "--item-index": idx } as React.CSSProperties}
            >
              {link.children ? (
                <>
                  <button
                    type="button"
                    className={`${styles.mobileMenu__accordionBtn} ${expandedSection === link.label ? styles["mobileMenu__accordionBtn--open"] : ""}`}
                    onClick={() => toggleSection(link.label)}
                    aria-expanded={expandedSection === link.label}
                  >
                    <span>{link.label}</span>
                    <ChevronDown
                      size={18}
                      className={`${styles.mobileMenu__accordionChevron} ${expandedSection === link.label ? styles["mobileMenu__accordionChevron--open"] : ""}`}
                      strokeWidth={2}
                    />
                  </button>
                  <div
                    className={`${styles.mobileMenu__subnav} ${expandedSection === link.label ? styles["mobileMenu__subnav--open"] : ""}`}
                  >
                    {link.children.map((child) => (
                      <Link
                        key={child.label}
                        href={child.href}
                        className={styles.mobileMenu__sublink}
                        onClick={closeMobileMenu}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <Link
                  href={link.href}
                  className={styles.mobileMenu__link}
                  onClick={closeMobileMenu}
                >
                  {link.label}
                </Link>
              )}
            </div>
          ))}
        </nav>


        <div className={styles.mobileMenu__footer}>
          <Link
            href="/wishlist"
            className={styles.mobileMenu__footerLink}
            onClick={closeMobileMenu}
          >
            <Heart size={17} strokeWidth={2} />
            <span>Wishlist</span>
            {wishlistIds.size > 0 && (
              <span className={styles.mobileMenu__badge}>{wishlistIds.size}</span>
            )}
          </Link>

          <button
            type="button"
            className={styles.mobileMenu__footerLink}
            onClick={() => { closeMobileMenu(); openCart(); }}
          >
            <ShoppingCart size={17} strokeWidth={2} />
            <span>Cart</span>
            {totalItems > 0 && (
              <span className={styles.mobileMenu__badge}>{totalItems}</span>
            )}
          </button>

          <Link
            href={isAuthenticated ? "/account" : "/account/login"}
            className={styles.mobileMenu__footerLink}
            onClick={closeMobileMenu}
          >
            <User size={17} strokeWidth={2} />
            <span>{isAuthenticated ? (user?.name ?? "My Account") : "Sign In / Register"}</span>
          </Link>

          {isAuthenticated && user?.role === "admin" && (
            <Link
              href="/admin"
              className={styles.mobileMenu__footerLink}
              onClick={closeMobileMenu}
            >
              <LayoutDashboard size={17} strokeWidth={2} />
              <span>Admin Panel</span>
            </Link>
          )}

          {isAuthenticated && (
            <button
              type="button"
              className={`${styles.mobileMenu__footerLink} ${styles.mobileMenu__footerLogout}`}
              onClick={() => { closeMobileMenu(); handleLogout(); }}
            >
              <LogOut size={17} strokeWidth={2} />
              <span>Log out</span>
            </button>
          )}
        </div>
      </aside>


      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
}
