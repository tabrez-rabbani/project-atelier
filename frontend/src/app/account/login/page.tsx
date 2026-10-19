"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Header, Footer } from "@/components";
import authApiInstance, { API_URL } from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import styles from "./login.module.css";

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    document.title = "Sign In | MAISONÉ";
  }, []);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "unauthorized") {
      toast.error("Google login failed. Your account may not be authorized.");
      setError("Google login failed. Please try again or use email login.");
    } else if (errorParam === "google_failed") {
      toast.error("Google authentication failed. Please try again.");
      setError("Google authentication failed. Please try again.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (user?.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  const handleLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      const response = await authApiInstance.post("/auth/login", { email, password });

      if (response.data.success) {
        const loggedInUser = response.data.user;
        setUser(loggedInUser);
        toast.success(`Welcome back, ${loggedInUser?.name || "Customer"}!`);
        if (loggedInUser?.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/");
        }
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Invalid email or password";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.brandPanel}>
            <Image
              src="/images/login/login.png"
              alt="MAISONÉ Fashion"
              fill
              priority
              sizes="450px"
              className={styles.brandPanel__image}
            />
          </div>

          <div className={styles.formPanel}>
            <h2 className={styles.formPanel__title}>Sign in to your account</h2>

            <form className={styles.form} onSubmit={handleLogin}>
              {error && <div className={styles.errorMessage}>{error}</div>}

              <div className={styles.field}>
                <input
                  type="email"
                  id="login-email"
                  placeholder=" "
                  required
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || googleLoading}
                />
                <label htmlFor="login-email" className={styles.label}>Email address</label>
              </div>

              <div className={styles.field}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="login-password"
                  placeholder=" "
                  required
                  className={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || googleLoading}
                />
                <label htmlFor="login-password" className={styles.label}>Password</label>
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={loading || googleLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className={styles.formRow}>
                <button type="submit" className={styles.submitBtn} disabled={loading || googleLoading}>
                  {loading ? "Signing In..." : "Sign In"}
                </button>
              </div>
            </form>

            <div className={styles.divider}>
              <span>or</span>
            </div>

            <button
              type="button"
              className={styles.googleBtn}
              onClick={handleGoogleLogin}
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
              No account? <Link href="/account/signup" className={styles.switchLink}>Sign up</Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className={styles.suspenseFallback} />}>
      <LoginForm />
    </Suspense>
  );
}
