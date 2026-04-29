"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchLinks, fetchSources, fetchAuthors, fetchChannels, fetchTags, searchLinks, type LinkItem, type PaginatedLinksResponse, type SourceItem, type TagItem } from "../lib/api";
import { PER_PAGE } from "../lib/api-url";


interface UseLinksOptions {
  initialFilters?: Record<string, string | string[] | null>;
  viewMode?: "grid" | "table";
}

interface UseLinksReturn {
  links: LinkItem[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  hasMore: boolean;
  sources: SourceItem[];
  authors: SourceItem[];
  channels: SourceItem[];
  tags: TagItem[];
  filters: Record<string, string | string[] | null>;
  searchQuery: string;
  setPage: (p: number) => void;
  setSearchQuery: (q: string) => void;
  setFilters: (f: Record<string, string | string[] | null>) => void;
  loadMore: () => void;
  clearFilters: () => void;
}

function parseUrlFilters(): { filters: Record<string, string | string[] | null>; page: number } {
  try {
    const params = new URLSearchParams(window.location.search);
    const urlFilters: Record<string, string | string[] | null> = {};

    for (const [key, value] of params.entries()) {
      if (key === "page") continue;

      if (key === "source_id" || key === "tag_ids") {
        urlFilters[key] = value.split(",").filter(Boolean);
      } else {
        urlFilters[key] = value;
      }
    }

    return {
      filters: urlFilters,
      page: parseInt(params.get("page") || "1") || 1,
    };
  } catch {
    return { filters: {}, page: 1 };
  }
}

export function useLinks(options: UseLinksOptions = {}): UseLinksReturn {
  const { initialFilters = {}, viewMode = "table" } = options;
  const { filters: urlFilters, page: urlPage } = parseUrlFilters();

  const hasUrlParams = Object.keys(urlFilters).length > 0;

  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(hasUrlParams ? urlPage : 1);
  const [hasMore, setHasMore] = useState(true);
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [authors, setAuthors] = useState<SourceItem[]>([]);
  const [channels, setChannels] = useState<SourceItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [filters, setFiltersState] = useState<Record<string, string | string[] | null>>(
    hasUrlParams ? urlFilters : initialFilters,
  );
  const [searchQuery, setSearchQueryState] = useState(
    hasUrlParams ? (urlFilters.search_query as string | null) || "" : (initialFilters.search_query as string | null) || "",
  );

  const isInitialMount = useRef(true);
  const isLoadMore = useRef(false);

  // Fetch sources, authors, channels, tags on mount
  useEffect(() => {
    Promise.all([
      fetchSources().then((res) => setSources(res.data)).catch(() => {}),
      fetchAuthors().then((res) => setAuthors(res.data)).catch(() => {}),
      fetchChannels().then((res) => setChannels(res.data)).catch(() => {}),
      fetchTags().then((res) => setTags(res.data)).catch(() => {}),
    ]);
  }, []);

  // Sync filters to URL (skip on mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const params = new URLSearchParams(window.location.search);
    params.delete("page");

    for (const [key, value] of Object.entries(filters)) {
      if (value === null || value === undefined) {
        params.delete(key);
      } else if (Array.isArray(value)) {
        if (value.length > 0) {
          params.set(key, value.join(","));
        } else {
          params.delete(key);
        }
      } else {
        if (value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
    }

    const query = params.toString();
    const url = `${window.location.pathname}${query ? `?${query}` : ""}`;
    window.history.replaceState({}, "", url);
  }, [filters]);

  const fetchData = useCallback(
    async (pageNum: number, append: boolean = false) => {
      if (!append) {
        setLoading(true);
        setError(null);
      }

      const searchQ = filters.search_query as string | null;

      if (searchQ && searchQ.trim()) {
        try {
          const res = await searchLinks(searchQ.trim(), "hybrid", undefined, pageNum, PER_PAGE);

          if (append) {
            setLinks((prev) => [...prev, ...res.data]);
          } else {
            setLinks(res.data);
          }

          setTotal(res.total);
          setHasMore(res.data.length > 0 && res.page * res.per_page < res.total);
        } catch (err) {
          console.error("Failed to search links:", err);
          if (!append) {
            setError("Failed to search links. Make sure the API is running.");
          }
          if (!append) {
            setLinks([]);
          }
        } finally {
          if (!append) {
            setLoading(false);
          }
        }
        return;
      }

      const params: Record<string, string | number> = {
        page: String(pageNum),
        per_page: PER_PAGE,
      };

      for (const [key, value] of Object.entries(filters)) {
        if (value === null || value === undefined) continue;

        if (Array.isArray(value)) {
          if (value.length > 0) {
            params[key] = value.join(",");
          }
        } else if (value !== "") {
          params[key] = value;
        }
      }

      try {
        const res: PaginatedLinksResponse = await fetchLinks(params);

        if (append) {
          setLinks((prev) => [...prev, ...res.data]);
        } else {
          setLinks(res.data);
        }

        setTotal(res.total);
        setHasMore(res.data.length > 0 && res.page * res.per_page < res.total);
      } catch (err) {
        console.error("Failed to fetch links:", err);
        if (!append) {
          setError("Failed to load links. Make sure the API is running.");
        }
        if (!append) {
          setLinks([]);
        }
      } finally {
        if (!append) {
          setLoading(false);
        }
      }
    },
    [filters],
  );

  const setSearchQuery = useCallback(
    (q: string) => {
      setSearchQueryState(q);
      setFiltersState((prev) => ({ ...prev, search_query: q || null }));
    },
    [],
  );

  const setFilters = useCallback(
    (f: Record<string, string | string[] | null>) => {
      setPage(1);
      setFiltersState(f);
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setPage(1);
    setFiltersState({});
    setSearchQueryState("");
  }, []);

  const loadMore = useCallback(() => {
    isLoadMore.current = true;
    const nextPage = page + 1;
    setPage(nextPage);
  }, [page]);

  // Main data fetch effect
  useEffect(() => {
    if (isLoadMore.current) {
      isLoadMore.current = false;
      fetchData(page, true);
    } else {
      fetchData(page, false);
    }
  }, [page, filters, fetchData]);

  // Scroll to top on page change (table view only)
  useEffect(() => {
    if (viewMode !== "table") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page, viewMode]);

  return {
    links,
    loading,
    error,
    total,
    page,
    hasMore,
    sources,
    authors,
    channels,
    tags,
    filters,
    searchQuery,
    setPage,
    setSearchQuery,
    setFilters,
    loadMore,
    clearFilters,
  };
}
