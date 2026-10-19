"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import authApiInstance from "@/lib/axios";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Upload, 
  Image as ImageIcon, 
  Loader2, 
  X 
} from "lucide-react";
import { toast } from "sonner";
import styles from "./HeroAdmin.module.css";

interface HeroSlide {
  _id: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
  desktopImage: string;
  mobileImage?: string;
  ratingText?: string;
  showSocialProof: boolean;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export default function AdminHeroPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [eyebrow, setEyebrow] = useState("New Collection");
  const [description, setDescription] = useState("Fashion for a Brighter You. Premium quality. Everyday confidence.");
  const [ctaText, setCtaText] = useState("Shop New Collection");
  const [ctaLink, setCtaLink] = useState("/collection");
  const [ratingText, setRatingText] = useState("10K+ Happy Customer");
  const [showSocialProof, setShowSocialProof] = useState(true);
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [desktopFile, setDesktopFile] = useState<File | null>(null);
  const [desktopPreview, setDesktopPreview] = useState<string | null>(null);
  const [currentDesktopUrl, setCurrentDesktopUrl] = useState<string>("");

  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [mobilePreview, setMobilePreview] = useState<string | null>(null);
  const [currentMobileUrl, setCurrentMobileUrl] = useState<string>("");

  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const fetchSlides = async () => {
    try {
      setLoading(true);
      const res = await authApiInstance.get("/hero/admin/all");
      if (res.data?.success) {
        setSlides(res.data.slides);
      }
    } catch (err: any) {
      console.error("Failed to fetch hero banners", err);
      toast.error(err.response?.data?.message || "Failed to load hero banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  useEffect(() => {
    return () => {
      if (desktopPreview && desktopPreview.startsWith("blob:")) {
        URL.revokeObjectURL(desktopPreview);
      }
      if (mobilePreview && mobilePreview.startsWith("blob:")) {
        URL.revokeObjectURL(mobilePreview);
      }
    };
  }, [desktopPreview, mobilePreview]);

  const resetForm = () => {
    if (desktopPreview && desktopPreview.startsWith("blob:")) {
      URL.revokeObjectURL(desktopPreview);
    }
    if (mobilePreview && mobilePreview.startsWith("blob:")) {
      URL.revokeObjectURL(mobilePreview);
    }

    setEditingId(null);
    setTitle("");
    setEyebrow("New Collection");
    setDescription("Fashion for a Brighter You. Premium quality. Everyday confidence.");
    setCtaText("Shop New Collection");
    setCtaLink("/collection");
    setRatingText("10K+ Happy Customer");
    setShowSocialProof(true);
    setOrder(0);
    setIsActive(true);

    setDesktopFile(null);
    setDesktopPreview(null);
    setCurrentDesktopUrl("");

    setMobileFile(null);
    setMobilePreview(null);
    setCurrentMobileUrl("");

    if (desktopInputRef.current) desktopInputRef.current.value = "";
    if (mobileInputRef.current) mobileInputRef.current.value = "";
    setIsFormOpen(false);
  };

  const handleEditClick = (slide: HeroSlide) => {
    if (desktopPreview && desktopPreview.startsWith("blob:")) {
      URL.revokeObjectURL(desktopPreview);
    }
    if (mobilePreview && mobilePreview.startsWith("blob:")) {
      URL.revokeObjectURL(mobilePreview);
    }

    setEditingId(slide._id);
    setTitle(slide.title);
    setEyebrow(slide.eyebrow || "New Collection");
    setDescription(slide.description || "");
    setCtaText(slide.ctaText || "Shop New Collection");
    setCtaLink(slide.ctaLink || "/collection");
    setRatingText(slide.ratingText || "10K+ Happy Customer");
    setShowSocialProof(slide.showSocialProof ?? true);
    setOrder(slide.order || 0);
    setIsActive(slide.isActive ?? true);

    setDesktopFile(null);
    setDesktopPreview(null);
    setCurrentDesktopUrl(slide.desktopImage || "");

    setMobileFile(null);
    setMobilePreview(null);
    setCurrentMobileUrl(slide.mobileImage || "");

    setIsFormOpen(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleDesktopFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (desktopPreview && desktopPreview.startsWith("blob:")) {
        URL.revokeObjectURL(desktopPreview);
      }
      setDesktopFile(file);
      setDesktopPreview(URL.createObjectURL(file));
    }
  };

  const handleMobileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (mobilePreview && mobilePreview.startsWith("blob:")) {
        URL.revokeObjectURL(mobilePreview);
      }
      setMobileFile(file);
      setMobilePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.warning("Please enter a title for the hero banner");
      return;
    }

    if (!editingId && !desktopFile) {
      toast.warning("Please upload a desktop banner image");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("eyebrow", eyebrow.trim());
      formData.append("description", description.trim());
      formData.append("ctaText", ctaText.trim());
      formData.append("ctaLink", ctaLink.trim());
      formData.append("ratingText", ratingText.trim());
      formData.append("showSocialProof", String(showSocialProof));
      formData.append("order", String(order));
      formData.append("isActive", String(isActive));

      if (desktopFile) {
        formData.append("desktopImage", desktopFile);
      } else if (currentDesktopUrl) {
        formData.append("desktopImage", currentDesktopUrl);
      }

      if (mobileFile) {
        formData.append("mobileImage", mobileFile);
      } else if (currentMobileUrl) {
        formData.append("mobileImage", currentMobileUrl);
      }

      let res;
      if (editingId) {
        res = await authApiInstance.put(`/hero/${editingId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Hero banner updated successfully!");
      } else {
        res = await authApiInstance.post("/hero", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("New Hero banner created successfully!");
      }

      if (res.data?.success) {
        resetForm();
        fetchSlides();
      }
    } catch (err: any) {
      console.error("Save hero error", err);
      toast.error(err.response?.data?.message || "Failed to save hero banner");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setSlides((prev) =>
      prev.map((s) => (s._id === id ? { ...s, isActive: !currentStatus } : s))
    );

    try {
      const res = await authApiInstance.patch(`/hero/${id}/toggle`);
      if (res.data?.success) {
        toast.success(res.data.message);
      }
    } catch (err: any) {
      setSlides((prev) =>
        prev.map((s) => (s._id === id ? { ...s, isActive: currentStatus } : s))
      );
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async (id: string, slideTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete banner "${slideTitle}"?`)) {
      return;
    }

    try {
      const res = await authApiInstance.delete(`/hero/${id}`);
      if (res.data?.success) {
        setSlides((prev) => prev.filter((s) => s._id !== id));
        toast.success("Hero banner deleted successfully!");
        if (editingId === id) resetForm();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete hero banner");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <div className={styles.titleLine} />
          <div>
            <h1 className={styles.title}>Hero Section Banners</h1>
            <p className={styles.subtitle}>
              Manage dynamic homepage hero banners, typography, slides, and call-to-actions.
            </p>
          </div>
        </div>

        {!isFormOpen && (
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => {
              resetForm();
              setIsFormOpen(true);
            }}
          >
            <Plus size={18} />
            <span>Add Hero Banner</span>
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className={styles.formCard} ref={formRef}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>
              {editingId ? "Edit Hero Banner" : "Add New Hero Banner"}
            </h2>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={resetForm}
              aria-label="Close form"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Eyebrow Badge</label>
                <input
                  type="text"
                  className={styles.input}
                  value={eyebrow}
                  onChange={(e) => setEyebrow(e.target.value)}
                  placeholder="e.g. New Collection, Summer 2026"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Main Title <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.input}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Modern Fashion"
                  required
                />
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Description</label>
                <textarea
                  className={styles.textarea}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short engaging description for the campaign banner"
                  rows={2}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Button Text</label>
                <input
                  type="text"
                  className={styles.input}
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="e.g. Shop New Collection"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Button Link</label>
                <input
                  type="text"
                  className={styles.input}
                  value={ctaLink}
                  onChange={(e) => setCtaLink(e.target.value)}
                  placeholder="e.g. /collection or /collection/dresses"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Display Order (Priority)</label>
                <input
                  type="number"
                  className={styles.input}
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                  placeholder="0, 1, 2..."
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Social Proof Rating Text</label>
                <input
                  type="text"
                  className={styles.input}
                  value={ratingText}
                  onChange={(e) => setRatingText(e.target.value)}
                  placeholder="e.g. 10K+ Happy Customers"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Desktop Image (16:9 / Full HD) <span className={styles.required}>*</span>
                </label>
                <input
                  type="file"
                  ref={desktopInputRef}
                  onChange={handleDesktopFileChange}
                  accept="image/*"
                  className={styles.hiddenInput}
                />

                {desktopPreview || currentDesktopUrl ? (
                  <div className={styles.previewWrapper}>
                    <Image
                      src={desktopPreview || currentDesktopUrl}
                      alt="Desktop Preview"
                      fill
                      className={styles.previewImg}
                    />
                    <button
                      type="button"
                      className={styles.removeImgBtn}
                      onClick={() => {
                        if (desktopPreview && desktopPreview.startsWith("blob:")) {
                          URL.revokeObjectURL(desktopPreview);
                        }
                        setDesktopFile(null);
                        setDesktopPreview(null);
                        setCurrentDesktopUrl("");
                        if (desktopInputRef.current) desktopInputRef.current.value = "";
                      }}
                      title="Remove image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div
                    className={styles.dropzone}
                    onClick={() => desktopInputRef.current?.click()}
                  >
                    <Upload size={22} className={styles.dropzoneIcon} />
                    <span className={styles.dropzoneText}>Upload Desktop Banner Image</span>
                    <span className={styles.dropzoneSubtext}>Recommended: 1920x1080 (PNG/JPG/WEBP)</span>
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Mobile Image (Optional Vertical/Square)</label>
                <input
                  type="file"
                  ref={mobileInputRef}
                  onChange={handleMobileFileChange}
                  accept="image/*"
                  className={styles.hiddenInput}
                />

                {mobilePreview || currentMobileUrl ? (
                  <div className={styles.previewWrapperMobile}>
                    <Image
                      src={mobilePreview || currentMobileUrl}
                      alt="Mobile Preview"
                      fill
                      className={styles.previewImgMobile}
                    />
                    <button
                      type="button"
                      className={styles.removeImgBtn}
                      onClick={() => {
                        if (mobilePreview && mobilePreview.startsWith("blob:")) {
                          URL.revokeObjectURL(mobilePreview);
                        }
                        setMobileFile(null);
                        setMobilePreview(null);
                        setCurrentMobileUrl("");
                        if (mobileInputRef.current) mobileInputRef.current.value = "";
                      }}
                      title="Remove image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div
                    className={styles.dropzoneMobile}
                    onClick={() => mobileInputRef.current?.click()}
                  >
                    <Upload size={22} className={styles.dropzoneIconSecondary} />
                    <span className={styles.dropzoneText}>Upload Mobile Banner Image</span>
                    <span className={styles.dropzoneSubtext}>Recommended: 750x1000 (Optional)</span>
                  </div>
                )}
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <div className={styles.checkboxGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={showSocialProof}
                      onChange={(e) => setShowSocialProof(e.target.checked)}
                    />
                    <span>Show Social Proof (Customer Avatars & Rating)</span>
                  </label>

                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                    <span>Banner Active (Visible on Home Page)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={resetForm}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className={styles.spinner} />
                    <span>Saving Banner...</span>
                  </>
                ) : (
                  <span>{editingId ? "Update Banner" : "Publish Banner"}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.card}>
        {loading ? (
          <div className={styles.emptyState}>
            <Loader2 size={32} className={styles.spinner} />
            <p>Loading hero banners...</p>
          </div>
        ) : slides.length === 0 ? (
          <div className={styles.emptyState}>
            <ImageIcon size={44} className={styles.emptyIcon} />
            <p>No custom hero banners found. The homepage is currently using default luxury hero assets.</p>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => setIsFormOpen(true)}
            >
              <Plus size={16} />
              <span>Create First Hero Banner</span>
            </button>
          </div>
        ) : (
          <div className={styles.slidesGrid}>
            {slides.map((slide) => (
              <div
                key={slide._id}
                className={`${styles.slideCard} ${!slide.isActive ? styles["slideCard--inactive"] : ""}`}
              >
                <div className={styles.slideBanner}>
                  <Image
                    src={slide.desktopImage}
                    alt={slide.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className={styles.slideImg}
                  />
                  <div className={styles.slideBadges}>
                    {slide.isActive ? (
                      <span className={styles.badgeActive}>Active</span>
                    ) : (
                      <span className={styles.badgeInactive}>Draft</span>
                    )}
                    <span className={styles.badgeOrder}>Order #{slide.order}</span>
                  </div>
                </div>

                <div className={styles.slideContent}>
                  {slide.eyebrow && (
                    <span className={styles.slideEyebrow}>{slide.eyebrow}</span>
                  )}
                  <h3 className={styles.slideTitle}>{slide.title}</h3>
                  {slide.description && (
                    <p className={styles.slideDesc}>{slide.description}</p>
                  )}

                  <div className={styles.slideMeta}>
                    <div className={styles.metaRow}>
                      <span className={styles.metaLabel}>Button CTA</span>
                      <span className={styles.metaValue}>{slide.ctaText || "Shop"}</span>
                    </div>
                    <div className={styles.metaRow}>
                      <span className={styles.metaLabel}>Target Link</span>
                      <span className={styles.metaLink}>{slide.ctaLink || "/collection"}</span>
                    </div>
                    {slide.ratingText && (
                      <div className={styles.metaRow}>
                        <span className={styles.metaLabel}>Social Proof</span>
                        <span className={styles.metaValue}>{slide.ratingText}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.slideFooter}>
                  <label className={styles.toggleSwitch} title="Toggle active status">
                    <input
                      type="checkbox"
                      checked={slide.isActive}
                      onChange={() => handleToggleStatus(slide._id, slide.isActive)}
                      className={styles.checkbox}
                    />
                    <span>{slide.isActive ? "Visible" : "Hidden"}</span>
                  </label>

                  <div className={styles.actionBtns}>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => handleEditClick(slide)}
                      title="Edit banner"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      type="button"
                      className={`${styles.iconBtn} ${styles.deleteBtn}`}
                      onClick={() => handleDelete(slide._id, slide.title)}
                      title="Delete banner"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
