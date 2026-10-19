import Link from "next/link";
import styles from "./Footer.module.css";

const shopLinks = [
  { label: "New In", href: "/collection/new-in" },
  { label: "Dresses", href: "/collection/dresses" },
  { label: "Tops", href: "/collection/tops" },
  { label: "Bottoms", href: "/collection/bottoms" },
  { label: "Accessories", href: "/collection/accessories" },
  { label: "Sale", href: "/collection/sale" },
];

const helpLinks = [
  { label: "Track Order", href: "/track-order" },
  { label: "Returns & Exchanges", href: "/returns" },
  { label: "Shipping Info", href: "/shipping" },
  { label: "Size Guide", href: "/size-guide" },
  { label: "FAQs", href: "/faqs" },
  { label: "Contact Us", href: "/contact" },
];

const companyLinks = [
  { label: "About Us", href: "/about" },
  { label: "Our Story", href: "/our-story" },
  { label: "Sustainability", href: "/sustainability" },
  { label: "Careers", href: "/careers" },
  { label: "Press", href: "/press" },
  { label: "Privacy Policy", href: "/privacy-policy" },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.footer__inner}`}>
        <div className={styles.footer__grid}>
          <div className={styles.footer__brandCol}>
            <Link href="/" className={styles.footer__logo} aria-label="MAISON home">
              MAISON
            </Link>
            <p className={styles.footer__tagline}>Fashion for a Brighter You.</p>
            <div className={styles.footer__socials}>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 7.1C2.1 8.4 2 10.2 2 12s.1 3.6.5 4.9c.5 1.7 1.8 3 3.5 3.5 1.3.4 3.1.5 6 .5s4.7-.1 6-.5c1.7-.5 3-1.8 3.5-3.5.4-1.3.5-3.1.5-4.9s-.1-3.6-.5-4.9C21 5.4 19.7 4.1 18 3.6 16.7 3.2 14.9 3.1 12 3.1s-4.7.1-6 .5C4.3 4.1 3 5.4 2.5 7.1z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>
              </a>
            </div>
          </div>

          <div className={styles.footer__linksCol}>
            <h4 className={styles.footer__title}>SHOP</h4>
            <ul className={styles.footer__list}>
              {shopLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.footer__linksCol}>
            <h4 className={styles.footer__title}>HELP</h4>
            <ul className={styles.footer__list}>
              {helpLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.footer__linksCol}>
            <h4 className={styles.footer__title}>COMPANY</h4>
            <ul className={styles.footer__list}>
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.footer__appCol}>
            <h4 className={styles.footer__title}>DOWNLOAD OUR APP</h4>
            <p className={styles.footer__appText}>Shop Anytime, Anywhere.</p>
            <div className={styles.footer__appButtons}>
              <a
                href="#"
                className={styles.footer__appBtn}
                aria-label="Download on App Store"
              >
                <div className={styles.footer__appBtnText}>
                  <small>DOWNLOAD ON</small>
                  <strong>App Store</strong>
                </div>
              </a>
              <a
                href="#"
                className={styles.footer__appBtn}
                aria-label="Get it on Google Play"
              >
                <div className={styles.footer__appBtnText}>
                  <small>GET IT ON</small>
                  <strong>Google Play</strong>
                </div>
              </a>
            </div>
          </div>
        </div>

        <div className={styles.footer__bottom}>
          <p className={styles.footer__copyright}>
            © {new Date().getFullYear()} Maisoné. All rights reserved.
          </p>
          <div className={styles.footer__payments}>
            <span className={styles.footer__paymentIcon}>VISA</span>
            <span className={styles.footer__paymentIcon}>MASTERCARD</span>
            <span className={styles.footer__paymentIcon}>PAYPAL</span>
            <span className={styles.footer__paymentIcon}>G PAY</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
