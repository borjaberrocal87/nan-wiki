"use client";

import { useEffect, useState } from "react";
import { fetchLinks, type LinkItem, type PaginatedLinksResponse } from "../../lib/api";
import LinkCard from "../links/LinkCard";

export default function LinkGrid() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetchLinks({ page: String(page), per_page: "20" })
      .then((res: PaginatedLinksResponse) => {
        if (page === 1) {
          setLinks(res.data);
        } else {
          setLinks((prev) => [...prev, ...res.data]);
        }
        setHasMore(res.data.length > 0 && res.page * res.per_page < res.total);
      })
      .catch((err: Error) => {
        console.error("Failed to fetch links:", err);
        if (page === 1) setError("Failed to load links. Make sure the API is running.");
      })
      .finally(() => setLoading(false));
  }, [page]);

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
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#666";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#333";
            }}
          >
            Load more
          </button>
        </div>
      )}
    </>
  );
}
