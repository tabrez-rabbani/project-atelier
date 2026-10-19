"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Save, CloudUpload, X, ArrowLeft } from "lucide-react";
import styles from "../../create/CreateProduct.module.css";
import authApiInstance from "@/lib/axios";
import Link from "next/link";
import { FILTER_COLORS } from "@/constants/collectionFilters";
import { toast } from "sonner";

function ImageFilePreview({ file, alt, className }: { file: File; alt: string; className?: string }) {
  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  if (!previewUrl) return null;

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={previewUrl} alt={alt} className={className} />;
}

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priceAmount: "",
    originalPriceAmount: "",
    category: "",
    material: "",
    deliveryInfo: "",
    inStock: "true",
    isNewIn: "false"
  });

  const [sizes, setSizes] = useState<string[]>([]);
  const [sizeInput, setSizeInput] = useState("");
  
  // Curated standard brand base colors
  const availableColors = FILTER_COLORS;
  const [colors, setColors] = useState<{name: string, hex: string}[]>([]);
  const [showCustomColor, setShowCustomColor] = useState(false);
  const [customColorName, setCustomColorName] = useState("");
  const [customColorHex, setCustomColorHex] = useState("#ffffff");

  const [existingImages, setExistingImages] = useState<Record<string, string[]>>({});
  const [newColorImages, setNewColorImages] = useState<Record<string, File[]>>({});
  
  const [categoriesList, setCategoriesList] = useState<{name: string, slug: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await authApiInstance.get("/categories");
        if (response.data.success) {
          setCategoriesList(response.data.categories);
        }
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const response = await authApiInstance.get(`/products/admin/${id}`);
        if (response.data.success) {
          const product = response.data.product;
          
          setFormData({
            title: product.title || "",
            description: product.description || "",
            priceAmount: product.price?.amount?.toString() || "",
            originalPriceAmount: product.originalPrice?.amount?.toString() || "",
            category: product.category || "",
            material: product.material || "",
            deliveryInfo: product.deliveryInfo || "",
            inStock: product.inStock ? "true" : "false",
            isNewIn: product.isNewIn ? "true" : "false"
          });

          setSizes(product.sizes || []);
          
          const loadedColors: {name: string, hex: string}[] = [];
          const loadedExistingImages: Record<string, string[]> = {};
          
          product.colors?.forEach((c: any) => {
            loadedColors.push({ name: c.name, hex: c.hex });
            loadedExistingImages[c.name] = c.images || [];
          });
          
          setColors(loadedColors);
          setExistingImages(loadedExistingImages);
        }
      } catch (error) {
        console.error("Failed to fetch product details", error);
        toast.error("Failed to load product details");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProductDetails();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addSize = () => {
    const val = sizeInput.trim();
    if (val && !sizes.includes(val)) {
      setSizes([...sizes, val]);
      setSizeInput("");
    }
  };

  const removeSize = (sizeToRemove: string) => {
    setSizes(sizes.filter(s => s !== sizeToRemove));
  };

  const toggleColor = (colorObj: {name: string, hex: string}) => {
    const exists = colors.find(c => c.name === colorObj.name);
    if (exists) {
      setColors(colors.filter(c => c.name !== colorObj.name));
      const newExisting = { ...existingImages };
      delete newExisting[colorObj.name];
      setExistingImages(newExisting);
      
      const newFiles = { ...newColorImages };
      delete newFiles[colorObj.name];
      setNewColorImages(newFiles);
    } else {
      setColors([...colors, colorObj]);
      setExistingImages({ ...existingImages, [colorObj.name]: [] });
      setNewColorImages({ ...newColorImages, [colorObj.name]: [] });
    }
  };

  const addCustomColor = () => {
    if (customColorName.trim() && customColorHex) {
      const newColor = { name: customColorName, hex: customColorHex };
      if (!colors.find(c => c.name === newColor.name)) {
        setColors([...colors, newColor]);
        setExistingImages({ ...existingImages, [newColor.name]: [] });
        setNewColorImages({ ...newColorImages, [newColor.name]: [] });
      }
      setCustomColorName("");
      setCustomColorHex("#ffffff");
      setShowCustomColor(false);
    }
  };

  const removeColor = (idxToRemove: number) => {
    const colorToRemove = colors[idxToRemove];
    setColors(colors.filter((_, idx) => idx !== idxToRemove));
    
    const newExisting = { ...existingImages };
    delete newExisting[colorToRemove.name];
    setExistingImages(newExisting);
    
    const newFiles = { ...newColorImages };
    delete newFiles[colorToRemove.name];
    setNewColorImages(newFiles);
  };

  const handleColorImageUpload = (e: React.ChangeEvent<HTMLInputElement>, colorName: string) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const existingCount = existingImages[colorName]?.length || 0;
      const currentNewImages = newColorImages[colorName] || [];
      
      if (existingCount + currentNewImages.length + selectedFiles.length > 7) {
        toast.warning("You can only have up to 7 images per color");
        return;
      }
      setNewColorImages({
        ...newColorImages,
        [colorName]: [...currentNewImages, ...selectedFiles]
      });
    }
  };

  const removeExistingImage = (colorName: string, idxToRemove: number) => {
    const currentImages = existingImages[colorName] || [];
    setExistingImages({
      ...existingImages,
      [colorName]: currentImages.filter((_, idx) => idx !== idxToRemove)
    });
  };

  const removeNewImage = (colorName: string, idxToRemove: number) => {
    const currentImages = newColorImages[colorName] || [];
    setNewColorImages({
      ...newColorImages,
      [colorName]: currentImages.filter((_, idx) => idx !== idxToRemove)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (colors.length === 0) {
      toast.warning("Please select at least one color");
      return;
    }
    
    const missingImages = colors.find(c => {
      const ex = existingImages[c.name] || [];
      const nw = newColorImages[c.name] || [];
      return ex.length === 0 && nw.length === 0;
    });
    
    if (missingImages) {
      toast.warning(`Please have at least one image for color: ${missingImages.name}`);
      return;
    }

    try {
      setIsSubmitting(true);
      
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });
      
      data.append("sizes", JSON.stringify(sizes));
      
      // Reconstruct colors array with existing image URLs
      const finalColorsPayload = colors.map((c) => {
        return {
          name: c.name,
          hex: c.hex,
          images: existingImages[c.name] || []
        };
      });
      
      data.append("colors", JSON.stringify(finalColorsPayload));
      
      // Append new images with dynamic field names per color
      colors.forEach((color, idx) => {
        const newImagesForColor = newColorImages[color.name] || [];
        newImagesForColor.forEach(img => {
          data.append(`images_${idx}`, img);
        });
      });

      const response = await authApiInstance.put(`/products/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (response.data.success) {
        toast.success("Product updated successfully!");
        setTimeout(() => {
          router.push("/admin/products");
        }, 800);
      }
    } catch (error: unknown) {
      console.error("Error updating product:", error);
      const errObj = error as { response?: { data?: { message?: string } } };
      toast.error(errObj.response?.data?.message || "Failed to update product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className={styles.loadingBox}>Loading product details...</div>;
  }

  return (
    <form className={styles.container} onSubmit={handleSubmit}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.titleWrapper}>
            <Link href="/admin/products" className={styles.backLink}>
              <ArrowLeft size={24} />
            </Link>
            <div className={styles.titleLine}></div>
            <h2 className={styles.title}>Edit Product</h2>
          </div>
          <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>
            <Save size={18} />
            <span>{isSubmitting ? "Updating..." : "Update Product"}</span>
          </button>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Product Name :</label>
          <div className={styles.inputWrapper}>
            <input 
              type="text" 
              name="title"
              className={styles.input} 
              placeholder="Product Name" 
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Product Price :</label>
          <div className={styles.inputWrapper}>
            <input 
              type="number" 
              name="priceAmount"
              className={styles.input} 
              placeholder="Product Price (e.g. 1999)" 
              value={formData.priceAmount}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Product Before Price :</label>
          <div className={styles.inputWrapper}>
            <input 
              type="number" 
              name="originalPriceAmount"
              className={styles.input} 
              placeholder="Original Price (Optional)" 
              value={formData.originalPriceAmount}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Product Category :</label>
          <div className={styles.inputWrapper}>
            <select 
              name="category"
              className={styles.select}
              value={formData.category}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Category...</option>
              {categoriesList.map(cat => (
                <option key={cat.slug} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Product Sizes (Optional) :</label>
          <div className={styles.inputWrapper}>
            <div className={styles.flexInput}>
              <input 
                type="text" 
                className={styles.input} 
                placeholder="e.g. S, M, L or 4.5ml, 50ml (Optional for Bags/Beauty)" 
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
              />
              <button type="button" className={styles.addBtn} onClick={addSize}>Add</button>
            </div>
            {sizes.length > 0 && (
              <div className={styles.tagContainer}>
                {sizes.map(size => (
                  <span key={size} className={styles.tag}>
                    {size} <button type="button" onClick={() => removeSize(size)}><X size={14}/></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Selected Colors :</label>
          <div className={styles.inputWrapper}>
            <div className={styles.swatchGrid}>
              {availableColors.map((c) => {
                const isSelected = colors.some(selected => selected.name === c.name);
                return (
                  <button
                    key={c.name}
                    type="button"
                    className={`${styles.swatchBtn} ${isSelected ? styles.swatchSelected : ""}`}
                    onClick={() => toggleColor(c)}
                    title={c.name}
                  >
                    <span 
                      className={styles.swatchCircle} 
                      style={{ 
                        backgroundColor: c.hex,
                        border: c.hex === "#FFFFFF" ? "1px solid #ccc" : "none" 
                      }} 
                    />
                    <span className={styles.swatchName}>{c.name}</span>
                  </button>
                );
              })}
              
              <button 
                type="button" 
                className={styles.addCustomBtn} 
                onClick={() => setShowCustomColor(!showCustomColor)}
              >
                + Custom
              </button>
            </div>

            {showCustomColor && (
              <div className={`${styles.flexInput} ${styles.customColorBox}`}>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="Custom Name (e.g. Neon Pink)" 
                  value={customColorName}
                  onChange={(e) => setCustomColorName(e.target.value)}
                />
                <input 
                  type="color" 
                  className={styles.colorPicker} 
                  value={customColorHex}
                  onChange={(e) => setCustomColorHex(e.target.value)}
                />
                <button type="button" className={styles.addBtn} onClick={addCustomColor}>Add</button>
              </div>
            )}

            {colors.length > 0 && (
              <div className={styles.tagContainer}>
                {colors.map((c, idx) => (
                  <span key={idx} className={styles.tag} style={{ borderLeft: `4px solid ${c.hex}` }}>
                    {c.name} <button type="button" onClick={() => removeColor(idx)}><X size={14}/></button>
                  </span>
                ))}
              </div>
            )}
            {colors.length === 0 && <span className={`${styles.helperText} ${styles.helperTextMargin}`}>No colors selected</span>}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Material :</label>
          <div className={styles.inputWrapper}>
            <input 
              type="text" 
              name="material"
              className={styles.input} 
              placeholder="e.g. 100% Cotton" 
              value={formData.material}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Minimum Delivery Days :</label>
          <div className={styles.inputWrapper}>
            <input 
              type="text" 
              name="deliveryInfo"
              className={styles.input} 
              placeholder="product delivery time in days" 
              value={formData.deliveryInfo}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Stock status :</label>
          <div className={styles.inputWrapper}>
            <select 
              name="inStock"
              className={styles.select} 
              value={formData.inStock}
              onChange={handleInputChange}
            >
              <option value="true">In Stock</option>
              <option value="false">Out of Stock</option>
            </select>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Feature in NEW IN :</label>
          <div className={styles.inputWrapper}>
            <select 
              name="isNewIn"
              className={styles.select} 
              value={formData.isNewIn}
              onChange={handleInputChange}
            >
              <option value="false">No</option>
              <option value="true">Yes — Show on Homepage</option>
            </select>
          </div>
        </div>

        <div className={`${styles.formGroup} ${styles.formGroupTop}`}>
          <label className={`${styles.label} ${styles.labelTop}`}>Product Long Description:</label>
          <div className={styles.inputWrapper}>
            <textarea 
              name="description"
              className={styles.textarea} 
              placeholder="product long description"
              value={formData.description}
              onChange={handleInputChange}
              rows={6}
            />
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.titleWrapper}>
          <div className={styles.titleLine}></div>
          <h2 className={styles.title}>Product Images (Per Color)</h2>
        </div>
        
        {colors.length === 0 ? (
          <p className={styles.noColorHelper}>
            Please select colors above to upload their images.
          </p>
        ) : (
          <div className={styles.colorUploadsContainer}>
            {colors.map((color) => {
              const currentExisting = existingImages[color.name] || [];
              const currentNew = newColorImages[color.name] || [];
              const totalImagesCount = currentExisting.length + currentNew.length;

              return (
                <div key={color.name} className={styles.colorUploadGroup}>
                  <div className={styles.colorUploadHeader}>
                    <span 
                      className={styles.swatchCircle} 
                      style={{ 
                        backgroundColor: color.hex,
                        border: color.hex === "#FFFFFF" ? "1px solid #ccc" : "none",
                        width: '20px', height: '20px'
                      }} 
                    />
                    <h3 className={styles.colorUploadTitle}>{color.name} Images <span className={styles.helperText}>(Max 7)</span></h3>
                  </div>

                  <div className={styles.uploadArea}>
                    <input 
                      type="file" 
                      id={`imageUpload-${color.name}`}
                      className={styles.fileInput} 
                      multiple 
                      accept="image/*"
                      onChange={(e) => handleColorImageUpload(e, color.name)}
                      disabled={totalImagesCount >= 7}
                    />
                    <label htmlFor={`imageUpload-${color.name}`} className={styles.uploadLabel}>
                      <CloudUpload size={32} className={styles.uploadIcon} />
                      <p>Drag and drop or click to upload {color.name} photos</p>
                    </label>
                  </div>

                  {totalImagesCount > 0 && (
                    <div className={styles.imagePreviewGrid}>
                      {/* Existing Images */}
                      {currentExisting.map((url, idx) => (
                        <div key={`existing-${idx}`} className={styles.imagePreviewWrapper}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Existing ${idx}`} className={styles.imagePreview} />
                          <button type="button" className={styles.removeImageBtn} onClick={() => removeExistingImage(color.name, idx)}>
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      {/* New Images */}
                      {currentNew.map((file, idx) => (
                        <div key={`new-${idx}`} className={styles.imagePreviewWrapper}>
                          <ImageFilePreview file={file} alt={`New ${idx}`} className={styles.imagePreview} />
                          <button type="button" className={styles.removeImageBtn} onClick={() => removeNewImage(color.name, idx)}>
                            <X size={16} />
                          </button>
                          <span className={styles.newBadge}>New</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </form>
  );
}
