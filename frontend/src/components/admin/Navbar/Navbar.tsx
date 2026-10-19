"use client";

import { Search, Maximize, Sun, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { user } = useAuth();
  const { isSidebarOpen, toggleSidebar, isMobile } = useAdminSidebar();

  const toggleFullscreen = () => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  return (
    <header className={styles.navbar}>
      <div className={styles.navbar__left}>
        {(!isSidebarOpen || isMobile) && (
          <button
            type="button"
            className={styles.navbar__toggleBtn}
            onClick={toggleSidebar}
            aria-label="Open Sidebar"
            title="Open Sidebar"
          >
            <span className={styles.hamburger}>
              <span className={styles.hamburgerLine} />
              <span className={styles.hamburgerLine} />
              <span className={styles.hamburgerLine} />
            </span>
          </button>
        )}

        <div className={styles.navbar__search}>
          <div className={styles.navbar__searchWrapper}>
            <input 
              type="text" 
              placeholder="Search..." 
              className={styles.navbar__searchInput}
            />
            <button className={styles.navbar__searchBtn} aria-label="Search">
              <Search size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className={styles.navbar__actions}>
        <button
          type="button"
          className={styles.navbar__iconBtn}
          aria-label="Fullscreen"
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
        >
          <Maximize size={20} />
        </button>
        <button
          type="button"
          className={styles.navbar__iconBtn}
          aria-label="Theme"
          title="Theme"
        >
          <Sun size={20} />
        </button>
        
        <div className={styles.navbar__profile}>
          <div className={styles.navbar__avatar}>
            <User size={20} />
          </div>
          <div className={styles.navbar__userInfo}>
            <span className={styles.navbar__userName}>{user?.name || "Admin"}</span>
            <span className={styles.navbar__userRole}>Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}
