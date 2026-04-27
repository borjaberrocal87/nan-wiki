"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchLinks, fetchSources, type LinkItem, type PaginatedLinksResponse, type SourceItem } from "../../lib/api";
import LinkCard from "../links/LinkCard";
import LinkFilters from "../links/LinkFilters";

export default function LinkGrid() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [filters, setFilters] = useState<Record<string, string | null>>({});

  useEffect(() => {
    fetchSources().then((res) => {
      setSources(res.data);
    }).catch(() => {});
  }, []);

  const resetAndFetch = useCallback((newPage: number, extraParams: Record<string, string | null>) => {
    setLoading(true);
    setError(null);

    const params: Record<string, string | number> = { page: String(newPage), per_page: "20" };
    for (const [key, value] of Object.entries(extraParams)) {
      if (value !== null && value !== undefined) {
        params[key] = value;
      }
    }

    fetchLinks(params)
      .then((res: PaginatedLinksResponse) => {
        if (newPage === 1) {
          setLinks(res.data);
        } else {
          setLinks((prev) => [...prev, ...res.data]);
        }
        setHasMore(res.data.length > 0 && res.page * res.per_page < res.total);
      })
      .catch((err: Error) => {
        console.error("Failed to fetch links:", err);
        if (newPage === 1) setError("Failed to load links. Make sure the API is running.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    resetAndFetch(1, filters);
  }, [filters, resetAndFetch]);

  const handleFilterChange = (newFilters: Record<string, string | null>) => {
    setFilters(newFilters);
  };

  if (loading && page === 1) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "200px",
        color: "#666",
      }}>
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        textAlign: "center",
        padding: "40px",
        color: "#999",
      }}>
        <p>{error}</p>
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div style={{
        textAlign: "center",
        padding: "40px",
        color: "#666",
      }}>
        No links found. Share some links in Discord!
      </div>
    );
  }

  return (
    <>
      <LinkFilters sources={sources} onFilterChange={handleFilterChange} />
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: "16px",
      }}>
        {links.map((link) => (
          <LinkCard key={link.id} link={link} />
        ))}
      </div>

      {hasMore && (
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <button
            onClick={() => setPage((p) => p + 1)}
            style={{
              backgroundColor: "transparent",
              color: "#e5e5e5",
              padding: "10px 24px",
              borderRadius: "6px",
              fontWeight: 500,
              fontSize: "14px",
              border: "1px solid #333",
              cursor: "pointer",
              transition: "border-color 0.2s",
            }}
            className="load-more-btn"
          >
            Load more
          </button>
        </div>
      )}
    </>
  );
}
