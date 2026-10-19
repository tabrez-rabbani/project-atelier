"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, ChevronDown, SlidersHorizontal, Check } from "lucide-react";
import { ProductCard, ProductCardSkeleton } from "@/components";
import authApiInstance from "@/lib/axios";
import type { Product, Category } from "@/types";
import styles from "./CollectionTemplate.module.css";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
];

import {
  SHOW_ALL_CATEGORIES,
  getSizesForCategory,
  FILTER_COLORS,
  matchesColorFamily,
  PRICE_MIN_LIMIT,
  PRICE_MAX_LIMIT,
  PRICE_STEP,
  PRICE_GAP,
} from "@/constants/collectionFilters";

interface CollectionTemplateProps {
  title: string;
  category: string;
}

interface Filters {
  category: string;
  sizes: string[];
  colors: string[];
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
}

export default function CollectionTemplate({ title, category }: CollectionTemplateProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [sort, setSort] = useState("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);




  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setSortOpen(false);
      }
    }
    if (sortOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sortOpen]);


  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const cacheKey = "col_categories";
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          try {
            const { data, ts } = JSON.parse(cached);
            if (Date.now() - ts < 10 * 60 * 1000 && Array.isArray(data) && data.length > 0) {
              if (isMounted) {
                setCategoriesList(data);
                setCategoriesLoading(false);
              }
              return;
            }
          } catch {}
        }

        const response = await authApiInstance.get("/categories");
        if (response.data?.success && Array.isArray(response.data.categories)) {
          if (isMounted) {
            setCategoriesList(response.data.categories);
            sessionStorage.setItem(
              cacheKey,
              JSON.stringify({ data: response.data.categories, ts: Date.now() })
            );
          }
        }
      } catch (error) {
        console.error("Failed to fetch categories", error);
      } finally {
        if (isMounted) {
          setCategoriesLoading(false);
        }
      }
    };

    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, []);


  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    category: false,
    price: false,
    color: false,
    size: false,
    availability: false,
  });


  const isRealRouteCategory = category && !SHOW_ALL_CATEGORIES.includes(category);

  const [filters, setFilters] = useState<Filters>({
    category: isRealRouteCategory ? category : "",
    sizes: [],
    colors: [],
    minPrice: "",
    maxPrice: "",
    inStock: false,
  });


  const activeCategory = isRealRouteCategory ? category : filters.category;


  const availableSizes = getSizesForCategory(activeCategory);


  const colorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    FILTER_COLORS.forEach((color) => {
      counts[color.name] = products.filter((p) =>
        p.colors?.some((c) => matchesColorFamily(c.name, color.name))
      ).length;
    });
    return counts;
  }, [products]);


  useEffect(() => {
    if (availableSizes === null && filters.sizes.length > 0) {
      setFilters((prev) => ({ ...prev, sizes: [] }));
    }
  }, [availableSizes, filters.sizes.length]);

  const [sliderMin, setSliderMin] = useState<number>(PRICE_MIN_LIMIT);
  const [sliderMax, setSliderMax] = useState<number>(PRICE_MAX_LIMIT);

  useEffect(() => {
    if (!filters.minPrice && sliderMin !== PRICE_MIN_LIMIT) {
      setSliderMin(PRICE_MIN_LIMIT);
    }
    if (!filters.maxPrice && sliderMax !== PRICE_MAX_LIMIT) {
      setSliderMax(PRICE_MAX_LIMIT);
    }
  }, [filters.minPrice, filters.maxPrice, sliderMin, sliderMax]);


  useEffect(() => {
    const timer = setTimeout(() => {
      const newMin = sliderMin > PRICE_MIN_LIMIT ? String(sliderMin) : "";
      const newMax = sliderMax < PRICE_MAX_LIMIT ? String(sliderMax) : "";
      setFilters((prev) => {
        if (prev.minPrice === newMin && prev.maxPrice === newMax) return prev;
        return { ...prev, minPrice: newMin, maxPrice: newMax };
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [sliderMin, sliderMax]);

  const handleSliderMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderMin(Math.min(Number(e.target.value), sliderMax - PRICE_GAP));
  };

  const handleSliderMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderMax(Math.max(Number(e.target.value), sliderMin + PRICE_GAP));
  };

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const activeFilterCount = [
    isRealRouteCategory || filters.category ? 1 : 0,
    availableSizes ? filters.sizes.length : 0,
    filters.colors.length,
    filters.minPrice || filters.maxPrice ? 1 : 0,
    filters.inStock ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    const cat = isRealRouteCategory ? category : filters.category;
    if (cat) params.set("category", cat);
    if (filters.colors.length > 0) params.set("colors", filters.colors.join(","));
    if (filters.sizes.length > 0) params.set("sizes", filters.sizes.join(","));
    if (filters.inStock) params.set("inStock", "true");
    if (filters.minPrice) params.set("minPrice", filters.minPrice);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
    params.set("sort", sort);
    params.set("limit", "48");
    return params.toString();
  }, [category, isRealRouteCategory, filters, sort]);

  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const qs = buildQueryString();
        const cacheKey = `col_p_${qs}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          try {
            const { data, ts } = JSON.parse(cached);
            if (Date.now() - ts < 3 * 60 * 1000 && Array.isArray(data)) {
              if (isMounted) {
                setProducts(data);
                setLoading(false);
              }
              return;
            }
          } catch {}
        }

        const response = await authApiInstance.get(`/products?${qs}`);
        if (response.data.success && isMounted) {
          setProducts(response.data.products);
          sessionStorage.setItem(
            cacheKey,
            JSON.stringify({ data: response.data.products, ts: Date.now() })
          );
        }
      } catch (error) {
        console.error("Failed to fetch products", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();
    return () => {
      isMounted = false;
    };
  }, [buildQueryString]);

  const clearAllFilters = () => {
    setSliderMin(PRICE_MIN_LIMIT);
    setSliderMax(PRICE_MAX_LIMIT);
    setFilters({
      category: "",
      sizes: [],
      colors: [],
      minPrice: "",
      maxPrice: "",
      inStock: false,
    });
    if (isRealRouteCategory) {
      router.push("/collection");
    }
  };

  const toggleArrayFilter = (key: "sizes" | "colors", value: string) => {
    setFilters((prev) => {
      const arr = prev[key];
      return {
        ...prev,
        [key]: arr.includes(value)
          ? arr.filter((v) => v !== value)
          : [...arr, value],
      };
    });
  };

  const formattedProducts = products.map((product) => ({
    id: product._id,
    title: product.title,
    slug: product.slug,
    price: product.price.amount,
    originalPrice: product.originalPrice?.amount,
    mainImage: product.colors?.[0]?.images?.[0] ?? "",
    hoverImage: product.colors?.[0]?.images?.[1] ?? product.colors?.[0]?.images?.[0] ?? "",
    colors: product.colors?.map((c) => c.hex) ?? [],
    colorsList: product.colors ?? [],
    colorName: product.colors?.[0]?.name ?? "Default",
    sizes: product.sizes ?? [],
  }));

  const getCategoryLabel = useCallback(
    (slug: string) => {
      const match = categoriesList.find(
        (c) => c.slug.toLowerCase() === slug.toLowerCase()
      );
      return match ? match.name : slug.replace(/-/g, " ");
    },
    [categoriesList]
  );


  const pageTitle = isRealRouteCategory
    ? getCategoryLabel(category)
    : title.replace(/-/g, " ");


  const filterContent = (
    <div className={styles.filterContent}>
      {/* Category filter — always available */}
      <div className={styles.filterGroup}>
        <button
          type="button"
          className={styles.filterGroupHeader}
          onClick={() => toggleSection("category")}
        >
          <span>Category</span>
          <ChevronDown
            size={16}
            className={`${styles.chevron} ${openSections.category ? styles.chevronOpen : ""}`}
          />
        </button>
        <div className={`${styles.filterGroupBody} ${openSections.category ? styles.filterGroupBodyOpen : ""}`}>
            <label className={styles.checkboxLabel}>
              <input
                type="radio"
                name="filterCategory"
                checked={!isRealRouteCategory && !filters.category}
                onChange={() => {
                  setFilters((prev) => ({ ...prev, category: "", sizes: [] }));
                  if (isRealRouteCategory) {
                    router.push("/collection");
                  }
                }}
                className={styles.hiddenInput}
              />
              <span
                className={`${styles.radioMark} ${
                  !isRealRouteCategory && !filters.category ? styles.radioMarkActive : ""
                }`}
              />
              <span className={styles.filterLabel}>All Products</span>
            </label>
            {categoriesLoading && categoriesList.length === 0 ? (
              <div className={styles.categoriesLoadingText}>
                Loading categories...
              </div>
            ) : (
              categoriesList.map((cat) => {
                const isSelected = isRealRouteCategory
                  ? category.toLowerCase() === cat.slug.toLowerCase()
                  : filters.category.toLowerCase() === cat.slug.toLowerCase();

                return (
                  <label key={cat._id || cat.slug} className={styles.checkboxLabel}>
                    <input
                      type="radio"
                      name="filterCategory"
                      checked={isSelected}
                      onChange={() => {
                        if (isSelected) {
                          setFilters((prev) => ({ ...prev, category: "", sizes: [] }));
                          router.push("/collection");
                        } else {
                          setFilters((prev) => ({ ...prev, sizes: [] }));
                          router.push(`/collection/${cat.slug}`);
                        }
                      }}
                      className={styles.hiddenInput}
                    />
                    <span
                      className={`${styles.radioMark} ${
                        isSelected ? styles.radioMarkActive : ""
                      }`}
                    />
                    <span className={styles.filterLabel}>{cat.name}</span>
                  </label>
                );
              })
            )}
          </div>
      </div>

      <div className={styles.filterGroup}>
        <button
          type="button"
          className={styles.filterGroupHeader}
          onClick={() => toggleSection("price")}
        >
          <span>Price</span>
          <ChevronDown
            size={16}
            className={`${styles.chevron} ${openSections.price ? styles.chevronOpen : ""}`}
          />
        </button>
        <div className={`${styles.filterGroupBody} ${openSections.price ? styles.filterGroupBodyOpen : ""}`}>
            <div className={styles.rangeSliderWrapper}>
              <div className={styles.rangeSliderTrack}>
                <div
                  className={styles.rangeSliderProgress}
                  style={
                    {
                      "--slider-left": `${(sliderMin / PRICE_MAX_LIMIT) * 100}%`,
                      "--slider-right": `${100 - (sliderMax / PRICE_MAX_LIMIT) * 100}%`,
                    } as React.CSSProperties
                  }
                />
              </div>
              <input
                type="range"
                min={PRICE_MIN_LIMIT}
                max={PRICE_MAX_LIMIT}
                step={PRICE_STEP}
                value={sliderMin}
                onChange={handleSliderMinChange}
                className={`${styles.rangeInput} ${styles.rangeInputMin} ${sliderMin > PRICE_MAX_LIMIT - 1000 ? styles["rangeInputMin--top"] : ""}`.trim()}
                aria-label="Minimum price"
              />
              <input
                type="range"
                min={PRICE_MIN_LIMIT}
                max={PRICE_MAX_LIMIT}
                step={PRICE_STEP}
                value={sliderMax}
                onChange={handleSliderMaxChange}
                className={`${styles.rangeInput} ${styles.rangeInputMax}`}
                aria-label="Maximum price"
              />
              <div className={styles.rangeLabels}>
                <span className={styles.rangeLabelMin}>
                  ₹{sliderMin.toLocaleString("en-IN")}
                </span>
                <span className={styles.rangeLabelMax}>
                  ₹{sliderMax.toLocaleString("en-IN")}{sliderMax >= PRICE_MAX_LIMIT ? "+" : ""}
                </span>
              </div>
            </div>
          </div>
      </div>

      {/* Color */}
      <div className={styles.filterGroup}>
        <button
          type="button"
          className={styles.filterGroupHeader}
          onClick={() => toggleSection("color")}
        >
          <span>Color</span>
          <ChevronDown
            size={16}
            className={`${styles.chevron} ${openSections.color ? styles.chevronOpen : ""}`}
          />
        </button>
        <div className={`${styles.filterGroupBody} ${openSections.color ? styles.filterGroupBodyOpen : ""}`}>
            <div className={styles.colorListWrapper}>
              {FILTER_COLORS.map((color) => {
                const isSelected = filters.colors.includes(color.name);
                const count = colorCounts[color.name] || 0;
                const isMulti = color.name.toLowerCase() === "multi";
                const isWhite =
                  color.name.toLowerCase() === "white" ||
                  color.hex.toLowerCase() === "#ffffff";

                return (
                  <label key={color.name} className={styles.colorRow}>
                    <div className={styles.colorRowLeft}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleArrayFilter("colors", color.name)}
                        className={styles.hiddenInput}
                      />
                      <span
                        className={`${styles.colorCheckbox} ${
                          isSelected ? styles.colorCheckboxActive : ""
                        }`}
                      >
                        {isSelected && (
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#fff"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span>
                      <span className={styles.colorName}>{color.name}</span>
                    </div>

                    <div className={styles.colorRowRight}>
                      <span className={styles.colorCount}>[{count}]</span>
                      <span
                        className={`${styles.colorCircleDot} ${isMulti ? styles["colorCircleDot--multi"] : ""} ${isWhite ? styles["colorCircleDot--white"] : ""}`.trim()}
                        style={isMulti ? undefined : ({ "--swatch-hex": color.hex } as React.CSSProperties)}
                      />
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
      </div>

      {/* Size — only displayed for categories that support sizing */}
      {availableSizes && availableSizes.length > 0 && (
        <div className={styles.filterGroup}>
          <button
            type="button"
            className={styles.filterGroupHeader}
            onClick={() => toggleSection("size")}
          >
            <span>Size</span>
            <ChevronDown
              size={16}
              className={`${styles.chevron} ${openSections.size ? styles.chevronOpen : ""}`}
            />
          </button>
          <div className={`${styles.filterGroupBody} ${openSections.size ? styles.filterGroupBodyOpen : ""}`}>
              <div className={styles.sizeGrid}>
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`${styles.sizeChip} ${
                      filters.sizes.includes(size) ? styles.sizeChipActive : ""
                    }`}
                    onClick={() => toggleArrayFilter("sizes", size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
        </div>
      )}

      {/* Availability */}
      <div className={styles.filterGroup}>
        <button
          type="button"
          className={styles.filterGroupHeader}
          onClick={() => toggleSection("availability")}
        >
          <span>Availability</span>
          <ChevronDown
            size={16}
            className={`${styles.chevron} ${openSections.availability ? styles.chevronOpen : ""}`}
          />
        </button>
        <div className={`${styles.filterGroupBody} ${openSections.availability ? styles.filterGroupBodyOpen : ""}`}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={filters.inStock}
                onChange={() =>
                  setFilters((prev) => ({ ...prev, inStock: !prev.inStock }))
                }
                className={styles.hiddenInput}
              />
              <span
                className={`${styles.checkMark} ${
                  filters.inStock ? styles.checkMarkActive : ""
                }`}
              >
                {filters.inStock && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
              <span className={styles.filterLabel}>In Stock Only</span>
            </label>
          </div>
      </div>
    </div>
  );

  return (
    <div className={styles.collection}>

      <div className={styles.toolbarWrapper}>
        <div className={`${styles.collectionContainer} ${styles.toolbar}`}>
          <div className={styles.toolbar__left}>
            {isRealRouteCategory ? (
              <div className={styles.breadcrumbs}>
                <Link href="/collection" className={styles.breadcrumbLink}>
                  All Collections
                </Link>
                <span className={styles.breadcrumbSep}>/</span>
                <h1 className={styles.pageTitle}>{pageTitle}</h1>
              </div>
            ) : (
              <h1 className={styles.pageTitle}>{pageTitle}</h1>
            )}
            <span className={styles.productCount}>
              {formattedProducts.length} {formattedProducts.length === 1 ? "product" : "products"}
            </span>
          </div>

          <div className={styles.toolbar__right}>
            {/* Mobile filter toggle */}
            <button
              type="button"
              className={styles.mobileFilterBtn}
              onClick={() => setMobileFilterOpen(true)}
            >
              <SlidersHorizontal size={18} strokeWidth={1.5} />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className={styles.filterBadge}>{activeFilterCount}</span>
              )}
            </button>

            <div className={styles.sortDropdown} ref={sortRef}>
              <span className={styles.sortLabel}>Sort by:</span>
              <button
                type="button"
                className={styles.sortToggleBtn}
                onClick={() => setSortOpen((prev) => !prev)}
                aria-expanded={sortOpen}
                aria-label="Sort products"
              >
                <span>
                  {SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Newest"}
                </span>
                <ChevronDown
                  size={14}
                  className={`${styles.sortChevron} ${
                    sortOpen ? styles.sortChevronOpen : ""
                  }`}
                />
              </button>

              {sortOpen && (
                <div className={styles.sortMenu} role="listbox">
                  {SORT_OPTIONS.map((option) => {
                    const isSelected = sort === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        className={`${styles.sortOption} ${
                          isSelected ? styles.sortOptionSelected : ""
                        }`}
                        onClick={() => {
                          setSort(option.value);
                          setSortOpen(false);
                        }}
                      >
                        <span>{option.label}</span>
                        {isSelected && (
                          <Check size={14} className={styles.sortCheckIcon} />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active filter pills */}
      {activeFilterCount > 0 && (
        <div className={styles.activeFiltersBar}>
          <div className={`${styles.collectionContainer} ${styles.activeFiltersInner}`}>
            {isRealRouteCategory ? (
              <button
                type="button"
                className={styles.filterPill}
                onClick={() => router.push("/collection")}
              >
                {getCategoryLabel(category)} <X size={14} />
              </button>
            ) : filters.category ? (
              <button
                type="button"
                className={styles.filterPill}
                onClick={() => setFilters((prev) => ({ ...prev, category: "" }))}
              >
                {getCategoryLabel(filters.category)} <X size={14} />
              </button>
            ) : null}
            {filters.colors.map((c) => (
              <button
                key={c}
                type="button"
                className={styles.filterPill}
                onClick={() => toggleArrayFilter("colors", c)}
              >
                {c} <X size={14} />
              </button>
            ))}
            {availableSizes &&
              filters.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={styles.filterPill}
                  onClick={() => toggleArrayFilter("sizes", s)}
                >
                  {s} <X size={14} />
                </button>
              ))}
            {(filters.minPrice || filters.maxPrice) && (
              <button
                type="button"
                className={styles.filterPill}
                onClick={() => {
                  setSliderMin(PRICE_MIN_LIMIT);
                  setSliderMax(PRICE_MAX_LIMIT);
                  setFilters((prev) => ({ ...prev, minPrice: "", maxPrice: "" }));
                }}
              >
                ₹{Number(filters.minPrice || 0).toLocaleString("en-IN")} — ₹{Number(filters.maxPrice || PRICE_MAX_LIMIT).toLocaleString("en-IN")} <X size={14} />
              </button>
            )}
            {filters.inStock && (
              <button
                type="button"
                className={styles.filterPill}
                onClick={() => setFilters((prev) => ({ ...prev, inStock: false }))}
              >
                In Stock <X size={14} />
              </button>
            )}
            <button
              type="button"
              className={styles.clearAllBtn}
              onClick={clearAllFilters}
            >
              Clear All
            </button>
          </div>
        </div>
      )}


      <div className={`${styles.collectionContainer} ${styles.mainLayout}`}>

        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>Filters</h2>
            {activeFilterCount > 0 && (
              <button
                type="button"
                className={styles.sidebarClear}
                onClick={clearAllFilters}
              >
                Clear All
              </button>
            )}
          </div>
          {filterContent}
        </aside>


        <section className={styles.gridSection}>
          {loading ? (
            <div className={styles.grid}>
              {Array.from({ length: 8 }).map((_, idx) => (
                <ProductCardSkeleton key={idx} />
              ))}
            </div>
          ) : formattedProducts.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>No products found</p>
              <p className={styles.emptyText}>
                Try adjusting your filters to discover more products.
              </p>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  className={styles.emptyBtn}
                  onClick={clearAllFilters}
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <div className={styles.grid}>
              {formattedProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          )}
        </section>
      </div>


      <div
        className={`${styles.drawerOverlay} ${mobileFilterOpen ? styles.drawerOverlayVisible : ""}`}
        onClick={() => setMobileFilterOpen(false)}
      />
      <aside
        className={`${styles.drawer} ${mobileFilterOpen ? styles.drawerOpen : ""}`}
      >
        <div className={styles.drawerHeader}>
          <h2 className={styles.drawerTitle}>Filters</h2>
          <button
            type="button"
            className={styles.drawerClose}
            onClick={() => setMobileFilterOpen(false)}
            aria-label="Close filters"
          >
            <X size={20} />
          </button>
        </div>
        <div className={styles.drawerBody}>{filterContent}</div>
        <div className={styles.drawerFooter}>
          <button
            type="button"
            className={styles.drawerClearBtn}
            onClick={clearAllFilters}
          >
            Clear All
          </button>
          <button
            type="button"
            className={styles.drawerApplyBtn}
            onClick={() => setMobileFilterOpen(false)}
          >
            Show {formattedProducts.length} Results
          </button>
        </div>
      </aside>
    </div>
  );
}
