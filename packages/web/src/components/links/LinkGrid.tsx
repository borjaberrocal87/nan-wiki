"use client";

import { useEffect, useState } from "react";
import LinkFilters from "../links/LinkFilters";
import Pagination from "../links/Pagination";
import LinkCard from "../links/LinkCard";
import LinkCardSkeleton from "../links/LinkCardSkeleton";
import LinkTableRowSkeleton from "../links/LinkTableRowSkeleton";
import LinkTable from "../links/LinkTable";
import MetricsCards from "./MetricsCards";
import { useLinks } from "../../hooks/useLinks";
import { PER_PAGE } from "../../lib/api-url";
import { fetchAuthMe, fetchStats, type AuthUser, type StatsResponse } from "../../lib/api";

type ViewMode = "grid" | "table";

export default function LinkGrid() {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const {
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
  } = useLinks({ viewMode });
  const [user, setUser] = useState<AuthUser | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const totalPages = Math.ceil(total / PER_PAGE);

  useEffect(() => {
    Promise.all([
      fetchAuthMe().then((u) => setUser(u)).catch(() => setUser(null)),
      fetchStats().then((s) => setStats(s)).catch(() => setStats(null)),
    ]);
  }, []);
  const activeFilterCount = Object.keys(filters).filter((k) => filters[k] !== null && filters[k] !== "" && filters[k] !== undefined).length;

  return (
    <>
      <LinkFilters
        sources={sources}
        onFilterChange={(f) => setFilters(f)}
        tags={tags}
        authors={authors}
        channels={channels}
        activeFilterCount={activeFilterCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        resultCount={total}
        initialFilters={filters}
      />

      <div className="flex items-center justify-between mb-4 gap-3">
        <div
          className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded p-[3px]"
        >
          <button
            onClick={() => setViewMode("grid")}
            className={`flex items-center justify-center w-8 h-7 border-none rounded transition-all duration-150 p-0 ${
              viewMode === "grid"
                ? "bg-accent-primary-container text-on-primary-container"
                : "bg-slate-700/50 text-slate-400 hover:text-slate-300"
            }`}
            title="Grid view"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center justify-center w-8 h-7 border-none rounded transition-all duration-150 p-0 ${
              viewMode === "table"
                ? "bg-accent-primary-container text-on-primary-container"
                : "bg-slate-700/50 text-slate-400 hover:text-slate-300"
            }`}
            title="Table view"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
              <line x1="9" y1="6" x2="9" y2="18" />
              <line x1="15" y1="6" x2="15" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {loading && page === 1 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <LinkCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-slate-800/50 rounded-lg overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-surface-container-low">
                    <th className="p-4 font-label-md text-slate-400 uppercase text-[10px] tracking-widest">ID</th>
                    <th className="p-4 font-label-md text-slate-400 uppercase text-[10px] tracking-widest">URL</th>
                    <th className="p-4 font-label-md text-slate-400 uppercase text-[10px] tracking-widest">Domain</th>
                    <th className="p-4 font-label-md text-slate-400 uppercase text-[10px] tracking-widest">Source</th>
                    <th className="p-4 font-label-md text-slate-400 uppercase text-[10px] tracking-widest">Author</th>
                    <th className="p-4 font-label-md text-slate-400 uppercase text-[10px] tracking-widest">Channel</th>
                    <th className="p-4 font-label-md text-slate-400 uppercase text-[10px] tracking-widest">Tags</th>
                    <th className="p-4 font-label-md text-slate-400 uppercase text-[10px] tracking-widest">Message</th>
                    <th className="p-4 font-label-md text-slate-400 uppercase text-[10px] tracking-widest whitespace-nowrap">Age</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <LinkTableRowSkeleton key={i} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
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
          {viewMode === "grid" ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
              {links.map((link) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  onTagFilter={(tagId) => setFilters({ tag_ids: tagId })}
                  activeTagFilter={(filters.tag_ids as string | null) || null}
                />
              ))}
            </div>
          ) : (
            <LinkTable
              links={links}
              onTagFilter={(tagId) => setFilters({ tag_ids: tagId })}
              activeTagFilter={(filters.tag_ids as string | null) || null}
            />
          )}

          {viewMode === "grid" ? (
            hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-violet-400 border border-slate-700 hover:border-violet-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Loading...
                    </>
                  ) : (
                    "Load more"
                  )}
                </button>
              </div>
            )
          ) : (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              perPage={PER_PAGE}
              onPageChange={(p) => {
                setPage(p);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}

          {!loading && (
            <MetricsCards
              totalLinks={stats?.totalLinks ?? 0}
              linksToday={stats?.linksToday ?? 0}
              totalAuthors={stats?.totalAuthors ?? 0}
              userLinkCount={stats?.userLinkCount ?? 0}
              contributionPercent={stats?.contributionPercent ?? 0}
              topAuthors={stats?.topAuthors ?? []}
            />
          )}
        </>
      )}
    </>
  );
}

function EmptyState({ searchQuery, message, submessage }: { searchQuery?: string; message: string; submessage: string }) {
  return (
    <div className="text-center p-20 text-text-tertiary bg-surface-container-lowest rounded border border-border-color">
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--border-color)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mb-3"
      >
        <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
        <path d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101z" />
      </svg>
      <p className="text-sm font-medium text-text-secondary mb-1">
        {message}
      </p>
      <p className="text-sm text-text-tertiary">
        {submessage}
      </p>
    </div>
  );
}
