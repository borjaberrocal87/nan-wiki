"use client";

import { useState } from "react";
import SearchBar from "../links/SearchBar";
import LinkFilters from "../links/LinkFilters";
import Pagination from "../links/Pagination";
import LinkCard from "../links/LinkCard";
import LinkCardSkeleton from "../links/LinkCardSkeleton";
import { useLinks } from "../../hooks/useLinks";

const TOTAL_TAGS = [
  "javascript", "typescript", "python", "react", "vue", "angular", "node",
  "docker", "kubernetes", "aws", "devops", "css", "html", "git",
  "tutorial", "guide", "article", "video", "tool", "library", "framework",
  "api", "database", "performance", "security", "testing", "design",
];

const TOTAL_AUTHORS = [
  { id: 1, username: "alice" },
  { id: 2, username: "bob" },
  { id: 3, username: "charlie" },
  { id: 4, username: "diana" },
  { id: 5, username: "eve" },
];

const TOTAL_CHANNELS = [
  { id: 1, name: "general" },
  { id: 2, name: "sharing" },
  { id: 3, name: "dev" },
  { id: 4, name: "resources" },
];

export default function LinkGrid() {
  const {
    links,
    loading,
    error,
    total,
    page,
    hasMore,
    sources,
    filters,
    searchQuery,
    setPage,
    setSearchQuery,
    setFilters,
    loadMore,
  } = useLinks();

  const totalPages = Math.ceil(total / 20);
  const activeFilterCount = Object.keys(filters).filter((k) => filters[k] !== null && filters[k] !== "" && filters[k] !== undefined).length;

  return (
    <>
      <SearchBar value={searchQuery} onChange={setSearchQuery} resultCount={total} />

      <LinkFilters
        sources={sources}
        onFilterChange={(f) => setFilters(f)}
        tags={TOTAL_TAGS}
        authors={TOTAL_AUTHORS}
        channels={TOTAL_CHANNELS}
        activeFilterCount={activeFilterCount}
      />

      {loading && page === 1 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "16px",
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <LinkCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <EmptyState message={error} submessage="Make sure the API is running on port 8000." />
      ) : links.length === 0 ? (
        <EmptyState
          searchQuery={searchQuery}
          message={searchQuery ? `No results for "${searchQuery}"` : "No links shared yet"}
          submessage={searchQuery ? "Try different search terms or filters" : "Share some links in Discord to get started"}
        />
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "16px",
            }}
          >
            {links.map((link) => (
              <LinkCard key={link.id} link={link} />
            ))}
          </div>

          {hasMore && (
            <>
              {!window.location.search && (
                <div style={{ textAlign: "center", marginTop: "24px" }}>
                  <button
                    onClick={loadMore}
                    className="btn-outline"
                    style={{
                      fontSize: "13px",
                      padding: "8px 20px",
                      color: "var(--text-secondary)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--text-primary)";
                      e.currentTarget.style.color = "var(--text-primary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-color)";
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }}
                  >
                    Load more
                  </button>
                </div>
              )}
              <div id="infinite-scroll-trigger" style={{ height: "1px" }} />
            </>
          )}

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            perPage={20}
            onPageChange={(p) => {
              setPage(p);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </>
      )}
    </>
  );
}

function EmptyState({ searchQuery, message, submessage }: { searchQuery?: string; message: string; submessage: string }) {
  return (
    <div style={{
      textAlign: "center",
      padding: "80px 20px",
      color: "var(--text-tertiary)",
      backgroundColor: "var(--bg-surface-container-lowest)",
      borderRadius: "4px",
      border: "1px solid var(--border-color)",
    }}>
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--border-color)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginBottom: "12px" }}
      >
        <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
        <path d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101z" />
      </svg>
      <p style={{
        fontSize: "14px",
        fontWeight: 500,
        color: "var(--text-secondary)",
        marginBottom: "4px",
      }}>
        {message}
      </p>
      <p style={{
        fontSize: "13px",
        color: "var(--text-tertiary)",
      }}>
        {submessage}
      </p>
    </div>
  );
}
