"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, X, ArrowRight, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { formatPrice } from "@/lib/utils";
import { API_URL } from "@/lib/axios";
import type { Product } from "@/types";
import styles from "./SearchModal.module.css";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES_CACHE_KEY = "sm_categories";
const CATEGORIES_CACHE_TTL = 10 * 60 * 1000;

function getProductImage(product: Product): string {
  return product.colors?.[0]?.images?.[0] ?? "/placeholder.jpg";
}

function getDiscount(product: Product): number | null {
  if (product.originalPrice && product.originalPrice.amount > product.price.amount) {
    return Math.round(
      ((product.originalPrice.amount - product.price.amount) / product.originalPrice.amount) * 100
    );
  }
  return null;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchedQuery, setLastSearchedQuery] = useState("");
  const [categoriesList, setCategoriesList] = useState<string[]>(() => {
    try {
      const cached = sessionStorage.getItem(CATEGORIES_CACHE_KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < CATEGORIES_CACHE_TTL) return data;
      }
    } catch {}
    return [];
  });
  const [isNavigating, setIsNavigating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevPathnameRef = useRef(pathname);
  const debouncedQuery = useDebounce(query, 300);

  const isDebouncing = query.trim() !== debouncedQuery.trim();
  const isSearching = (isLoading || isDebouncing) && query.trim().length > 0;


  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      setIsNavigating(false);
      onClose();
    }
  }, [pathname, onClose]);


  useEffect(() => {
    if (isNavigating) {
      const timer = setTimeout(() => {
        setIsNavigating(false);
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isNavigating, onClose]);


  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      try {
        const cached = sessionStorage.getItem(CATEGORIES_CACHE_KEY);
        if (cached) {
          const { data, ts } = JSON.parse(cached);
          if (Date.now() - ts < CATEGORIES_CACHE_TTL) {
            if (isMounted) setCategoriesList(data);
            return;
          }
        }
        const res = await fetch(`${API_URL}/categories`);
        const json = await res.json();
        if (isMounted && json.success && Array.isArray(json.categories) && json.categories.length > 0) {
          const names = Array.from(
            new Set(
              json.categories.map((c: { name: string }) => {
                const n = c.name.trim();
                return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
              })
            )
          ) as string[];
          setCategoriesList(names);
          sessionStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify({ data: names, ts: Date.now() }));
        }
      } catch {
        // fallback to DEFAULT_CATEGORIES already in state
      }
    };
    fetchCategories();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    } else {
      setQuery("");
      setResults([]);
      setTotalResults(0);
      setHasSearched(false);
      setLastSearchedQuery("");
      setIsLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);


  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setTotalResults(0);
      setHasSearched(false);
      setLastSearchedQuery("");
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `${API_URL}/products/search?q=${encodeURIComponent(debouncedQuery)}&limit=6`,
          { signal: controller.signal }
        );
        const data = await res.json();
        if (data.success) {
          setResults(data.products || []);
          setTotalResults(data.totalResults || 0);
          setLastSearchedQuery(debouncedQuery.trim());
          setHasSearched(true);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Search error:", err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
    return () => controller.abort();
  }, [debouncedQuery]);

  const handleSuggestionClick = useCallback((term: string) => {
    setQuery(term);
  }, []);

  const handleNavigateToSearch = (searchTerm: string) => {
    const term = searchTerm.trim();
    if (!term) return;
    const targetUrl = `/search?q=${encodeURIComponent(term)}`;

    if (pathname === "/search") {
      onClose();
      router.push(targetUrl);
    } else {
      setIsNavigating(true);
      router.push(targetUrl);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      handleNavigateToSearch(query.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        <div className={styles.header}>
          <form className={styles.searchBar} onSubmit={handleSubmit}>
            <Search className={styles.searchIcon} size={20} strokeWidth={2} />
            <input
              ref={inputRef}
              type="text"
              className={styles.searchInput}
              placeholder="Search for products, categories..."
              value={query}
              onChange={(e) => {
                const val = e.target.value;
                setQuery(val);
                if (!val.trim()) {
                  setResults([]);
                  setTotalResults(0);
                  setHasSearched(false);
                  setLastSearchedQuery("");
                }
              }}
              aria-label="Search products"
              id="search-modal-input"
            />
            {query && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  setTotalResults(0);
                  setHasSearched(false);
                  setLastSearchedQuery("");
                  inputRef.current?.focus();
                }}
                aria-label="Clear search"
              >
                <X size={16} strokeWidth={2} />
              </button>
            )}
            {isSearching && (
              <Loader2 className={styles.spinner} size={18} />
            )}
          </form>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close search"
          >
            <X size={22} strokeWidth={2} />
          </button>
        </div>
        <div className={styles.content}>
          {!query.trim() && (
            <div className={styles.suggestions}>
              <h3 className={styles.suggestionsTitle}>Popular Categories</h3>
              <div className={styles.suggestionsGrid}>
                {categoriesList.map((term) => (
                  <button
                    key={term}
                    type="button"
                    className={styles.suggestionChip}
                    onClick={() => handleSuggestionClick(term)}
                  >
                    <Search size={13} strokeWidth={2} />
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            </div>
          )}


          {query.trim() && isSearching && (
            <div className={styles.skeletonList}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={styles.skeletonItem}>
                  <div className={styles.skeletonThumb} />
                  <div className={styles.skeletonInfo}>
                    <div className={styles.skeletonCategory} />
                    <div className={`${styles.skeletonTitle} ${i % 2 !== 0 ? styles["skeletonTitle--alt"] : ""}`.trim()} />
                    <div className={styles.skeletonPrice} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {query.trim() && !isSearching && results.length > 0 && (
            <div className={styles.results}>
              <p className={styles.resultsCount}>
                {totalResults} result{totalResults !== 1 ? "s" : ""} for &ldquo;{lastSearchedQuery || query}&rdquo;
              </p>
              <div className={styles.resultsList}>
                {results.map((product) => {
                  const discount = getDiscount(product);
                  return (
                    <Link
                      key={product._id}
                      href={`/product/${product.slug}`}
                      className={styles.resultItem}
                      onClick={() => {
                        if (pathname.startsWith("/product/")) {
                          onClose();
                        } else {
                          setIsNavigating(true);
                        }
                      }}
                    >
                      <div className={styles.resultImage}>
                        <Image
                          src={getProductImage(product)}
                          alt={product.title}
                          fill
                          sizes="72px"
                        />
                        {discount && (
                          <span className={styles.resultBadge}>-{discount}%</span>
                        )}
                      </div>
                      <div className={styles.resultInfo}>
                        <span className={styles.resultCategory}>{product.category}</span>
                        <h4 className={styles.resultTitle}>{product.title}</h4>
                        <div className={styles.resultPrice}>
                          <span className={styles.resultCurrentPrice}>
                            {formatPrice(product.price.amount, product.price.currency)}
                          </span>
                          {product.originalPrice && (
                            <span className={styles.resultOldPrice}>
                              {formatPrice(product.originalPrice.amount, product.originalPrice.currency)}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className={styles.resultArrow} size={16} strokeWidth={2} />
                    </Link>
                  );
                })}
              </div>


              {totalResults > 6 && (
                <button
                  type="button"
                  className={styles.viewAll}
                  disabled={isNavigating}
                  onClick={() => handleNavigateToSearch(lastSearchedQuery || query)}
                >
                  {isNavigating ? (
                    <>
                      <Loader2 size={16} className={styles.navSpinner} />
                      <span>Loading search results...</span>
                    </>
                  ) : (
                    <>
                      <span>View all {totalResults} results</span>
                      <ArrowRight size={15} strokeWidth={2.5} />
                    </>
                  )}
                </button>
              )}
            </div>
          )}


          {query.trim() && !isSearching && hasSearched && lastSearchedQuery.toLowerCase() === query.trim().toLowerCase() && results.length === 0 && (
            <div className={styles.empty}>
              <Search className={styles.emptyIcon} size={40} strokeWidth={1.5} />
              <p className={styles.emptyTitle}>No results found</p>
              <p className={styles.emptyDesc}>
                We couldn&apos;t find anything for &ldquo;{lastSearchedQuery || query}&rdquo;. Try a different search term.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
