"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, ArrowLeft, SlidersHorizontal, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import ProductCard from "@/components/product/ProductCard/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/Skeleton/Skeleton";
import { Header, Footer } from "@/components";
import { API_URL } from "@/lib/axios";
import type { Product } from "@/types";
import styles from "./search.module.css";

const SEARCH_CACHE_PREFIX = "atelier_search_";

const getAmount = (p?: { amount?: number } | number | null): number => {
  if (!p) return 0;
  if (typeof p === "number") return p;
  if (typeof p === "object" && typeof p.amount === "number") return p.amount;
  return 0;
};

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Product[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchedQuery, setLastSearchedQuery] = useState("");
  const debouncedQuery = useDebounce(query, 350);

  const isDebouncing = query.trim() !== debouncedQuery.trim();
  const isSearching = (isLoading || isDebouncing) && query.trim().length > 0;

  useEffect(() => {
    document.title = debouncedQuery.trim()
      ? `Search: "${debouncedQuery.trim()}" | MAISONÉ`
      : "Search Collection | MAISONÉ";
  }, [debouncedQuery]);

  const fetchResults = useCallback(
    async (searchQuery: string, pageNum: number) => {
      const trimmed = searchQuery.trim();
      if (!trimmed) {
        setResults([]);
        setTotalResults(0);
        setTotalPages(1);
        setHasSearched(false);
        setLastSearchedQuery("");
        return;
      }

      const cacheKey = `${SEARCH_CACHE_PREFIX}${trimmed.toLowerCase()}_p${pageNum}`;
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed.products)) {
            setResults(parsed.products);
            setTotalResults(parsed.totalResults || 0);
            setTotalPages(parsed.totalPages || 1);
            setLastSearchedQuery(trimmed);
            setHasSearched(true);
            setIsLoading(false);
            return;
          }
        }
      } catch {}

      setIsLoading(true);
      try {
        const res = await fetch(
          `${API_URL}/products/search?q=${encodeURIComponent(trimmed)}&page=${pageNum}&limit=12`
        );
        if (!res.ok) {
          throw new Error("Search request failed");
        }
        const data = await res.json();
        if (data.success) {
          const prods = data.products || [];
          const total = data.totalResults || 0;
          const pages = data.pagination?.totalPages || 1;

          setResults(prods);
          setTotalResults(total);
          setTotalPages(pages);
          setLastSearchedQuery(trimmed);
          setHasSearched(true);

          try {
            sessionStorage.setItem(
              cacheKey,
              JSON.stringify({ products: prods, totalResults: total, totalPages: pages })
            );
          } catch {}
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchResults(debouncedQuery, page);

    if (debouncedQuery.trim()) {
      const params = new URLSearchParams();
      params.set("q", debouncedQuery);
      if (page > 1) params.set("page", String(page));
      router.replace(`/search?${params.toString()}`, { scroll: false });
    }
  }, [debouncedQuery, page, fetchResults, router]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <main className={styles.page}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.header}>
          <Link href="/" className={styles.backBtn} aria-label="Go back">
            <ArrowLeft size={20} strokeWidth={2} />
          </Link>
          <form
            className={styles.searchBar}
            onSubmit={(e) => {
              e.preventDefault();
              fetchResults(query, 1);
            }}
          >
            <Search className={styles.searchIcon} size={18} strokeWidth={2} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search for products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              aria-label="Search products"
              id="search-page-input"
            />
            {query.trim().length > 0 && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <X size={15} strokeWidth={2} />
              </button>
            )}
          </form>
        </div>

        {!isSearching && hasSearched && results.length > 0 && (
          <div className={styles.info}>
            <p className={styles.infoText}>
              {totalResults} result{totalResults !== 1 ? "s" : ""} for &ldquo;{lastSearchedQuery || query}&rdquo;
            </p>
          </div>
        )}

        {isSearching && (
          <div className={styles.grid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!isSearching && results.length > 0 && (
          <>
            <div className={styles.grid}>
              {results.map((product) => (
                <ProductCard
                  key={product._id}
                  id={product._id}
                  title={product.title}
                  price={getAmount(product.price)}
                  originalPrice={getAmount(product.originalPrice)}
                  mainImage={product.colors?.[0]?.images?.[0] || ""}
                  hoverImage={product.colors?.[0]?.images?.[1] || product.colors?.[0]?.images?.[0] || ""}
                  colors={product.colors?.map((c) => c.hex) || []}
                  colorsList={product.colors}
                  colorName={product.colors?.[0]?.name}
                  sizes={product.sizes}
                  slug={product.slug}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  type="button"
                  className={styles.pageBtn}
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                >
                  Previous
                </button>
                <span className={styles.pageInfo}>
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  className={styles.pageBtn}
                  disabled={page >= totalPages}
                  onClick={() => handlePageChange(page + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {!isSearching && hasSearched && lastSearchedQuery.toLowerCase() === query.trim().toLowerCase() && results.length === 0 && (
          <div className={styles.empty}>
            <SlidersHorizontal className={styles.emptyIcon} size={44} strokeWidth={1.5} />
            <h2 className={styles.emptyTitle}>No products found</h2>
            <p className={styles.emptyDesc}>
              Try adjusting your search or browse our categories
            </p>
            <Link href="/collection/all" className={styles.emptyCta}>
              Browse All Products
            </Link>
          </div>
        )}

        {!query.trim() && !isSearching && (
          <div className={styles.empty}>
            <Search className={styles.emptyIcon} size={44} strokeWidth={1.5} />
            <h2 className={styles.emptyTitle}>Search our collection</h2>
            <p className={styles.emptyDesc}>
              Find dresses, tops, jeans, and more
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <>
      <Header />
      <Suspense
        fallback={
          <main className={styles.page}>
            <div className={`container ${styles.inner}`}>
              <div className={styles.grid}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </main>
        }
      >
        <SearchContent />
      </Suspense>
      <Footer />
    </>
  );
}
