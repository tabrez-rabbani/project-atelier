"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Header, Footer } from "@/components";
import authApiInstance, { API_URL } from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import styles from "./signup.module.css";

export default function SignupPage() {
  const router = useRouter();
  const { setUser, isAuthenticated, isLoading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    document.title = "Create Account | MAISONÉ";
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSignup = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      toast.warning("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const response = await authApiInstance.post("/auth/register", {
        name,
        email,
        phone,
        password,
      });

      if (response.data.success) {
        setUser(response.data.user);
        toast.success("Account created successfully! Welcome to MAISONÉ.");
        router.push("/");
      }
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string } } };
      const msg = errObj.response?.data?.message || "An error occurred during registration";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    setGoogleLoading(true);
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.formPanel}>
            <h2 className={styles.formPanel__title}>Create Account</h2>
            <p className={styles.formPanel__subtitle}>Join MAISONÉ for an elevated shopping experience.</p>

            <form className={styles.form} onSubmit={handleSignup}>
              {error && <div className={styles.errorMessage}>{error}</div>}
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <input
                    type="text"
                    id="signup-name"
                    placeholder=" "
                    required
                    className={styles.input}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <label htmlFor="signup-name" className={styles.label}>Full Name</label>
                </div>
                <div className={styles.field}>
                  <input
                    type="email"
                    id="signup-email"
                    placeholder=" "
                    required
                    className={styles.input}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <label htmlFor="signup-email" className={styles.label}>Email</label>
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <input
                    type="tel"
                    id="signup-phone"
                    placeholder=" "
                    required
                    className={styles.input}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <label htmlFor="signup-phone" className={styles.label}>Phone</label>
                </div>
                <div className={styles.field}>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="signup-password"
                    placeholder=" "
                    required
                    className={styles.input}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <label htmlFor="signup-password" className={styles.label}>Password</label>
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className={styles.field}>
                <input
                  type={showConfirm ? "text" : "password"}
                  id="signup-confirm"
                  placeholder=" "
                  required
                  className={styles.input}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <label htmlFor="signup-confirm" className={styles.label}>Confirm Password</label>
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading || googleLoading}>
                {loading ? "Creating Account..." : "Sign Up"}
              </button>
            </form>

            <div className={styles.divider}>
              <span>or</span>
            </div>

            <button
              type="button"
              className={styles.googleBtn}
              onClick={handleGoogleSignup}
              disabled={loading || googleLoading}
            >
              {googleLoading ? (
                <>
                  <div className={styles.googleSpinner} />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <p className={styles.switchText}>
              Already have an account? <Link href="/account/login" className={styles.switchLink}>Login</Link>
            </p>
          </div>

          <div className={styles.imagePanel}>
            <div className={styles.imagePanel__top}>
              <span className={styles.imagePanel__question}>Already have an account?</span>
              <Link href="/account/login" className={styles.imagePanel__loginBtn}>LOGIN</Link>
            </div>
            <div className={styles.imagePanel__img}>
              <Image
                src="/images/login/signup.png"
                alt="MAISONÉ Fashion"
                fill
                priority
                sizes="500px"
                className={styles.imagePanel__imgElement}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
