"use client";

import { useAdminSidebar } from "@/context/AdminSidebarContext";
import Sidebar from "@/components/admin/Sidebar/Sidebar";
import Navbar from "@/components/admin/Navbar/Navbar";
import styles from "@/app/admin/AdminLayout.module.css";

export default function AdminLayoutContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  const { isSidebarOpen, closeSidebar, isMobile } = useAdminSidebar();

  return (
    <div className={className}>
      {/* Mobile-only backdrop overlay (NEVER on desktop) */}
      {isMobile && isSidebarOpen && (
        <div
          className={`${styles.sidebarOverlay} ${styles.sidebarOverlayVisible}`}
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Left) */}
      <Sidebar />

      {/* Main Content Area (Right) */}
      <div
        className={`${styles.adminMain} ${!isSidebarOpen ? styles.adminMainExpanded : ""}`}
      >
        {/* Top Navbar */}
        <Navbar />

        {/* Page Content */}
        <div className={styles.adminContent}>{children}</div>
      </div>
    </div>
  );
}
