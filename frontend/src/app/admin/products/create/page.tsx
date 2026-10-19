"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, CloudUpload, X } from "lucide-react";
import styles from "./CreateProduct.module.css";
import authApiInstance from "@/lib/axios";
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

export default function CreateProductPage() {
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

  const [colorImages, setColorImages] = useState<Record<string, File[]>>({});
  const [categoriesList, setCategoriesList] = useState<{name: string, slug: string}[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const newImages = { ...colorImages };
      delete newImages[colorObj.name];
      setColorImages(newImages);
    } else {
      setColors([...colors, colorObj]);
      setColorImages({ ...colorImages, [colorObj.name]: [] });
    }
  };

  const addCustomColor = () => {
    if (customColorName.trim() && customColorHex) {
      const newColor = { name: customColorName, hex: customColorHex };
      if (!colors.find(c => c.name === newColor.name)) {
        setColors([...colors, newColor]);
        setColorImages({ ...colorImages, [newColor.name]: [] });
      }
      setCustomColorName("");
      setCustomColorHex("#ffffff");
      setShowCustomColor(false);
    }
  };

  const removeColor = (idxToRemove: number) => {
    const colorToRemove = colors[idxToRemove];
    setColors(colors.filter((_, idx) => idx !== idxToRemove));
    const newImages = { ...colorImages };
    delete newImages[colorToRemove.name];
    setColorImages(newImages);
  };

  const handleColorImageUpload = (e: React.ChangeEvent<HTMLInputElement>, colorName: string) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const currentImages = colorImages[colorName] || [];
      if (currentImages.length + selectedFiles.length > 7) {
        toast.warning("You can only upload up to 7 images per color");
        return;
      }
      setColorImages({
        ...colorImages,
        [colorName]: [...currentImages, ...selectedFiles]
      });
    }
  };

  const removeColorImage = (colorName: string, idxToRemove: number) => {
    const currentImages = colorImages[colorName] || [];
    setColorImages({
      ...colorImages,
      [colorName]: currentImages.filter((_, idx) => idx !== idxToRemove)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (colors.length === 0) {
      toast.warning("Please select at least one color");
      return;
    }
    
    const missingImages = colors.find(c => !colorImages[c.name] || colorImages[c.name].length === 0);
    if (missingImages) {
      toast.warning(`Please upload at least one image for color: ${missingImages.name}`);
      return;
    }

    try {
      setIsSubmitting(true);
      
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });
      
      data.append("sizes", JSON.stringify(sizes));
      data.append("colors", JSON.stringify(colors));
      
      // Append images with dynamic field names per color
      colors.forEach((color, idx) => {
        const imagesForColor = colorImages[color.name] || [];
        imagesForColor.forEach(img => {
          data.append(`images_${idx}`, img);
        });
      });

      const response = await authApiInstance.post("/products", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (response.data.success) {
        toast.success("Product created successfully!");
        // Reset form or redirect
        setTimeout(() => {
          router.push("/admin/products");
        }, 800);
      }
    } catch (error: unknown) {
      console.error("Error creating product:", error);
      const errObj = error as { response?: { data?: { message?: string } } };
      toast.error(errObj.response?.data?.message || "Failed to create product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={styles.container} onSubmit={handleSubmit}>
      {/* Product Information Card */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.titleWrapper}>
            <div className={styles.titleLine}></div>
            <h2 className={styles.title}>Product Information</h2>
          </div>
          <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>
            <Save size={18} />
            <span>{isSubmitting ? "Saving..." : "Save Data"}</span>
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
            {/* Visual Swatch Picker */}
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

            {/* Custom Color Input Form */}
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

            {/* Selected Colors Tag Display */}
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
              const currentImages = colorImages[color.name] || [];
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
                      disabled={currentImages.length >= 7}
                    />
                    <label htmlFor={`imageUpload-${color.name}`} className={styles.uploadLabel}>
                      <CloudUpload size={32} className={styles.uploadIcon} />
                      <p>Drag and drop or click to upload {color.name} photos</p>
                    </label>
                  </div>

                  {currentImages.length > 0 && (
                    <div className={styles.imagePreviewGrid}>
                      {currentImages.map((img, idx) => (
                        <div key={idx} className={styles.imagePreviewWrapper}>
                          <ImageFilePreview file={img} alt={`Preview ${idx}`} className={styles.imagePreview} />
                          <button type="button" className={styles.removeImageBtn} onClick={() => removeColorImage(color.name, idx)}>
                            <X size={16} />
                          </button>
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
