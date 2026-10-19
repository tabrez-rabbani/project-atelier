"use client";

import { useState, useEffect, useCallback } from "react";
import authApiInstance from "@/lib/axios";
import { Users as UsersIcon, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import styles from "./Users.module.css";

interface UserItem {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await authApiInstance.get(`/admin/users?${params.toString()}`);
      if (res.data?.success) {
        setUsers(res.data.users);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch {
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDeleteUser = (user: UserItem) => {
    toast(`Delete user account?`, {
      description: `Are you sure you want to delete ${user.name} (${user.email})?`,
      duration: 10000,
      action: {
        label: "Yes, Delete",
        onClick: async () => {
          setDeletingId(user._id);
          try {
            const res = await authApiInstance.delete(`/admin/users/${user._id}`);
            if (res.data?.success) {
              setUsers((prev) => prev.filter((u) => u._id !== user._id));
              setTotal((prev) => Math.max(0, prev - 1));
              toast.success("User deleted successfully");
            }
          } catch (err: unknown) {
            const errObj = err as { response?: { data?: { message?: string } } };
            toast.error(errObj.response?.data?.message || "Failed to delete user");
          } finally {
            setDeletingId(null);
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      return `${day}-${month}-${year} ${hours}:${minutes}${ampm}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.titleWrapper}>
            <div className={styles.titleLine}></div>
            <h2 className={styles.title}>All Users List</h2>
          </div>
          <div className={styles.headerStat}>
            <div className={styles.statIcon}>
              <UsersIcon size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Total Users</span>
              <span className={styles.statValue}>{total}</span>
            </div>
          </div>
        </div>

        <div className={styles.filterRow}>
          <div className={styles.searchGroup}>
            <label className={styles.searchLabel}>Search Name:</label>
            <input
              type="text"
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, email or phone..."
            />
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User Name</th>
                <th>Phone Number</th>
                <th>Email Address</th>
                <th>Date</th>
                <th>Option</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>
                    Loading users list...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <span className={styles.userName}>{u.name || "Customer"}</span>
                    </td>
                    <td>
                      <span className={styles.userPhone}>
                        {u.phone && u.phone.trim() ? u.phone : "-"}
                      </span>
                    </td>
                    <td>
                      <span className={styles.userEmail}>{u.email}</span>
                    </td>
                    <td>
                      <span className={styles.userDate}>{formatDate(u.createdAt)}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteUser(u)}
                        disabled={deletingId === u._id}
                        title="Delete User"
                        aria-label="Delete User"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ""}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
