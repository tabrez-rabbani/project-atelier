import { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminLayoutContent from "@/components/admin/AdminLayoutContent";
import { AdminSidebarProvider } from "@/context/AdminSidebarContext";
import styles from "./AdminLayout.module.css";

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-admin",
});

export const metadata: Metadata = {
  title: "Admin Dashboard | MAISONÉ",
  description: "Admin panel for managing products, orders, and users.",
  robots: "noindex, nofollow",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <AdminSidebarProvider>
        <AdminLayoutContent
          className={`${styles.adminLayout} ${publicSans.variable} ${publicSans.className}`}
        >
          {children}
        </AdminLayoutContent>
      </AdminSidebarProvider>
    </AdminGuard>
  );
}
