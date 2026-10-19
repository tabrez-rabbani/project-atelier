"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import authApiInstance from "@/lib/axios";
import { Trash2, Upload, Image as ImageIcon, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import styles from "./Categories.module.css";

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  createdAt: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingCategoryId, setUpdatingCategoryId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await authApiInstance.get("/categories");
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error("Failed to fetch categories", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("name", newCategoryName.trim());
      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      const response = await authApiInstance.post("/categories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        setNewCategoryName("");
        handleClearImage();
        fetchCategories();
        toast.success("Category added successfully!");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRowImageUpload = async (categoryId: string, file: File) => {
    try {
      setUpdatingCategoryId(categoryId);
      const formData = new FormData();
      formData.append("image", file);

      const response = await authApiInstance.put(`/categories/${categoryId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        setCategories((prev) =>
          prev.map((c) =>
            c._id === categoryId ? { ...c, image: response.data.category.image } : c
          )
        );
        toast.success("Category image updated!");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update category image");
    } finally {
      setUpdatingCategoryId(null);
    }
  };

  const handleDeleteCategory = (id: string, name?: string) => {
    toast(`Delete category "${name || "this category"}"?`, {
      description: "This category will be permanently removed.",
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            const response = await authApiInstance.delete(`/categories/${id}`);
            if (response.data.success) {
              setCategories((prev) => prev.filter((c) => c._id !== id));
              toast.success("Category deleted successfully");
            }
          } catch (error: any) {
            toast.error("Failed to delete category");
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
            <h2 className={styles.title}>Categories</h2>
          </div>
        </div>

        {/* Add Category Form */}
        <form className={styles.addForm} onSubmit={handleAddCategory}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Category Name</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. Dresses, Tops, Bags"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Category Thumbnail (Optional)</label>
              <div className={styles.imageUploadBox}>
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className={styles.imagePreview}
                  />
                ) : (
                  <div className={styles.imagePlaceholder}>
                    <ImageIcon size={22} />
                  </div>
                )}

                <div className={styles.fileInputWrapper}>
                  <button type="button" className={styles.chooseFileBtn}>
                    <Upload size={14} />
                    {selectedFile ? "Change Image" : "Upload Image"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className={styles.fileInput}
                    onChange={handleFileChange}
                  />
                </div>

                {imagePreview && (
                  <button
                    type="button"
                    className={styles.removeImageBtn}
                    onClick={handleClearImage}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.addBtn}
              disabled={isSubmitting || !newCategoryName.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Adding...
                </>
              ) : (
                "+ Add Category"
              )}
            </button>
          </div>
        </form>

        {/* Categories Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thImage}>Image</th>
                <th>Name</th>
                <th>Slug</th>
                <th className={styles.thActions}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className={styles.emptyState}>
                    Loading categories...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.emptyState}>
                    No categories found. Add one above.
                  </td>
                </tr>
              ) : (
                categories.map((category) => {
                  const isUpdatingThis = updatingCategoryId === category._id;

                  return (
                    <tr key={category._id}>
                      {/* Category Avatar */}
                      <td>
                        <div className={styles.categoryAvatarWrapper}>
                          {category.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={category.image}
                              alt={category.name}
                              className={styles.categoryAvatar}
                            />
                          ) : (
                            <div className={styles.categoryAvatarMissing} title="No image uploaded">
                              <ImageIcon size={18} />
                            </div>
                          )}
                        </div>
                      </td>

                      <td className={styles.categoryNameCell}>{category.name}</td>
                      <td className={styles.categorySlugCell}>{category.slug}</td>

                      {/* Actions */}
                      <td>
                        <div className={styles.rowActionsEnd}>
                          {/* Quick upload / change image */}
                          <label className={styles.uploadRowBtn} title="Upload or change image">
                            {isUpdatingThis ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Upload size={13} />
                            )}
                            {category.image ? "Change" : "Add Image"}
                            <input
                              type="file"
                              accept="image/*"
                              className={styles.uploadRowInput}
                              disabled={isUpdatingThis}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleRowImageUpload(category._id, file);
                                }
                              }}
                            />
                          </label>

                          {/* Delete Button */}
                          <button
                            className={styles.iconBtnDelete}
                            onClick={() => handleDeleteCategory(category._id, category.name)}
                            title="Delete category"
                          >
                            <Trash2 size={18} />
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
