"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import authApiInstance from "@/lib/axios";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import styles from "./Products.module.css";
import type { Product } from "@/types";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await authApiInstance.get("/products?limit=100");
      if (response.data.success) {
        setProducts(response.data.products);
        setFilteredProducts(response.data.products);
      }
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      setFilteredProducts(products.filter(p => p.title.toLowerCase().includes(lowerQuery)));
    }
  }, [searchQuery, products]);

  const handleDeleteProduct = (id: string, title?: string) => {
    toast(`Delete "${title || "this product"}"?`, {
      description: "This product will be permanently removed.",
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            const response = await authApiInstance.delete(`/products/${id}`);
            if (response.data.success) {
              setProducts((prev) => prev.filter((p) => p._id !== id));
              toast.success("Product deleted successfully");
            }
          } catch (error: any) {
            toast.error("Failed to delete product");
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.titleWrapper}>
            <div className={styles.titleLine}></div>
            <h2 className={styles.title}>Products List</h2>
          </div>
          <Link href="/admin/products/create" className={styles.addBtn}>
            <Plus size={18} strokeWidth={2.5} />
            <span>Add Product</span>
          </Link>
        </div>

        <div className={styles.searchRow}>
          <label className={styles.searchLabel}>Search Name:</label>
          <input 
            type="text" 
            className={styles.searchInput} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name..."
          />
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product Image</th>
                <th>Product Name</th>
                <th>Brand</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock Info</th>
                <th>Option</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>Loading products...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>
                    {searchQuery ? "No products match your search." : "No products found. Add one above."}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const firstColor = product.colors[0];
                  const img = firstColor?.images?.[0];
                  
                  return (
                    <tr key={product._id}>
                      <td>
                        <div className={styles.productImageWrapper}>
                          {img ? (
                            <img src={img} alt={product.title} className={styles.productImage} />
                          ) : (
                            <div className={styles.productImagePlaceholder}>No Img</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <h3 className={styles.productTitle}>{product.title}</h3>
                      </td>
                      <td><span className={styles.textMuted}>No Brand</span></td>
                      <td className={styles.categoryCell}>{product.category}</td>
                      <td>
                        <span className={styles.price}>₹{product.price.amount}</span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${product.inStock ? styles.badgeStock : styles.badgeOut}`}>
                          {product.inStock ? "In Stock" : "Out Of Stock"}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <Link href={`/admin/products/edit/${product._id}`} className={styles.iconBtnEdit}>
                            <Pencil size={16} />
                          </Link>
                          <button 
                            className={styles.iconBtnDelete}
                            onClick={() => handleDeleteProduct(product._id, product.title)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
