import React from "react";
import Link from "next/link";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "dark" | "outline" | "outlineWhite";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  showArrow?: boolean;
  arrowIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
  href?: string;
  target?: string;
  rel?: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export default function Button({
  type = "button",
  variant = "primary",
  size = "md",
  showArrow = false,
  arrowIcon,
  leftIcon,
  fullWidth = false,
  loading = false,
  href,
  target,
  rel,
  children,
  className = "",
  disabled = false,
  ...props
}: ButtonProps) {
  const classNames = [
    styles.btn,
    styles[`btn--${variant}`],
    styles[`btn--${size}`],
    fullWidth ? styles["btn--fullWidth"] : "",
    disabled || loading ? styles["btn--disabled"] : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {loading && <span className={styles.btn__spinner} aria-hidden="true" />}
      {!loading && leftIcon && <span className={styles.btn__icon} aria-hidden="true">{leftIcon}</span>}
      <span>{children}</span>
      {showArrow && !loading && (
        <span className={styles.btn__arrow} aria-hidden="true">
          {arrowIcon || "→"}
        </span>
      )}
    </>
  );

  if (href && !disabled && !loading) {
    return (
      <Link href={href} className={classNames} target={target} rel={rel} aria-busy={loading ? "true" : undefined}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classNames}
      disabled={disabled || loading}
      aria-busy={loading ? "true" : undefined}
      {...props}
    >
      {content}
    </button>
  );
}
