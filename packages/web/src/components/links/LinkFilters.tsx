"use client";

import { useState, useMemo } from "react";
import type { SourceItem, TagItem } from "../../lib/api";
import { SOURCE_CONFIG, type SourceType } from "../../lib/sources";

interface LinkFiltersProps {
  sources: SourceItem[];
  onFilterChange: (filters: Record<string, string | string[] | null>) => void;
  tags?: TagItem[];
  authors?: SourceItem[];
  channels?: SourceItem[];
  activeFilterCount?: number;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  resultCount?: number;
  initialFilters?: Record<string, string | string[] | null>;
}

interface FilterState {
  selectedSource: string;
  selectedTag: string;
  selectedAuthorId: string | null;
  selectedChannelId: string | null;
  dateFrom: string;
  dateTo: string;
  searchMessage: string;
}

export default function LinkFilters({
  sources,
  onFilterChange,
  tags = [],
  authors = [],
  channels = [],
  activeFilterCount: _activeFilterCount,
  searchQuery: _searchQuery = "",
  onSearchChange: _onSearchChange,
  resultCount,
  initialFilters = {},
}: LinkFiltersProps) {
  const initSource = useMemo(() => {
    const val = initialFilters.source_id;
    if (Array.isArray(val)) return val[0] || "";
    if (typeof val === "string" && val) return val.split(",")[0];
    return "";
  }, [initialFilters.source_id]);

  const initTag = useMemo(() => {
    const val = initialFilters.tag_ids;
    if (Array.isArray(val)) return val[0] || "";
    if (typeof val === "string" && val) return val.split(",")[0];
    return "";
  }, [initialFilters.tag_ids]);

  const [filterState, setFilterState] = useState<FilterState>({
    selectedSource: initSource,
    selectedTag: initTag,
    selectedAuthorId: (initialFilters.author_id as string | null) || null,
    selectedChannelId: (initialFilters.channel_id as string | null) || null,
    dateFrom: (initialFilters.date_from as string) || "",
    dateTo: (initialFilters.date_to as string) || "",
    searchMessage: (initialFilters.search_query as string) || "",
  });

  const sourcesList = sources.map((s) => s.id);
  const allTags = useMemo(() => {
    const tagMap = new Map<string, string>();
    for (const tag of tags) {
      tagMap.set(tag.id, tag.name);
    }
    return Array.from(tagMap.entries())
      .slice(0, 50);
  }, [tags]);

  const emitFilters = (state: FilterState) => {
    const filters: Record<string, string | string[] | null> = {};

    if (state.selectedSource) {
      filters.source_id = state.selectedSource;
    }
    if (state.selectedTag) {
      filters.tag_ids = state.selectedTag;
    }
    if (state.selectedAuthorId) {
      filters.author_id = state.selectedAuthorId;
    }
    if (state.selectedChannelId) {
      filters.channel_id = state.selectedChannelId;
    }
    if (state.dateFrom) {
      filters.date_from = state.dateFrom;
    }
    if (state.dateTo) {
      filters.date_to = state.dateTo;
    }
    if (state.searchMessage && state.searchMessage.trim().length >= 3) {
      filters.search_query = state.searchMessage;
    }

    onFilterChange(filters);
  };

  const selectSource = (source: string) => {
    const newState: FilterState = { ...filterState, selectedSource: source };
    setFilterState(newState);
    emitFilters(newState);
  };

  const selectTag = (tag: string) => {
    const newState: FilterState = { ...filterState, selectedTag: tag };
    setFilterState(newState);
    emitFilters(newState);
  };

  const selectAuthor = (authorId: string) => {
    const newState: FilterState = { ...filterState, selectedAuthorId: filterState.selectedAuthorId === authorId ? null : authorId };
    setFilterState(newState);
    emitFilters(newState);
  };

  const selectChannel = (channelId: string) => {
    const newState: FilterState = { ...filterState, selectedChannelId: filterState.selectedChannelId === channelId ? null : channelId };
    setFilterState(newState);
    emitFilters(newState);
  };

  const handleDateFrom = (value: string) => {
    const newState: FilterState = { ...filterState, dateFrom: value };
    setFilterState(newState);
    emitFilters(newState);
  };

  const handleDateTo = (value: string) => {
    const newState: FilterState = { ...filterState, dateTo: value };
    setFilterState(newState);
    emitFilters(newState);
  };

  const handleSearchMessage = (value: string) => {
    const newState: FilterState = { ...filterState, searchMessage: value };
    setFilterState(newState);
    if (value.trim().length >= 3) {
      emitFilters(newState);
    }
  };

  const activeCount =
    filterState.selectedSource ? 1 : 0 +
    filterState.selectedTag ? 1 : 0 +
    (filterState.selectedAuthorId ? 1 : 0) +
    (filterState.selectedChannelId ? 1 : 0) +
    (filterState.dateFrom ? 1 : 0) +
    (filterState.dateTo ? 1 : 0) +
    (filterState.searchMessage ? 1 : 0);

  const clearFilters = () => {
    const empty: FilterState = {
      selectedSource: "",
      selectedTag: "",
      selectedAuthorId: null,
      selectedChannelId: null,
      dateFrom: "",
      dateTo: "",
      searchMessage: "",
    };
    setFilterState(empty);
    emitFilters(empty);
  };

  const hasActive = activeCount > 0;

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-end gap-2 bg-surface-container/30 p-3 border border-slate-800/50 rounded-lg">
        {/* Search */}
        <div className="flex flex-col gap-0.5 flex-[2] min-w-[180px]">
          <label className="text-[9px] uppercase tracking-widest font-bold text-slate-500 pl-1">Search</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
            <input
              className="w-full bg-slate-900 border border-slate-800 text-xs py-1.5 pl-8 pr-3 rounded focus:outline-none focus:border-violet-500 text-slate-300 placeholder:text-slate-600"
              placeholder="Keywords..."
              type="text"
              value={filterState.searchMessage}
              onChange={(e) => handleSearchMessage(e.target.value)}
            />
          </div>
        </div>

        {/* Source */}
        <div className="flex flex-col gap-0.5 flex-1 min-w-[120px]">
          <label className="text-[9px] uppercase tracking-widest font-bold text-slate-500 pl-1">Source</label>
          <select
            className="w-full bg-slate-900 border border-slate-800 text-xs py-1.5 px-2 rounded focus:outline-none focus:border-violet-500 text-slate-300"
            value={filterState.selectedSource}
            onChange={(e) => selectSource(e.target.value)}
          >
            <option value="">All Sources</option>
            {sourcesList.map((source) => (
              <option key={source} value={source}>
                {SOURCE_CONFIG[source.toLowerCase() as SourceType]?.label || source}
              </option>
            ))}
          </select>
        </div>

        {/* Author */}
        <div className="flex flex-col gap-0.5 flex-1 min-w-[120px]">
          <label className="text-[9px] uppercase tracking-widest font-bold text-slate-500 pl-1">Author</label>
          <select
            className="w-full bg-slate-900 border border-slate-800 text-xs py-1.5 px-2 rounded focus:outline-none focus:border-violet-500 text-slate-300"
            value={filterState.selectedAuthorId ?? ""}
            onChange={(e) => selectAuthor(e.target.value)}
          >
            <option value="">All Authors</option>
            {authors.map((author) => (
              <option key={author.id} value={author.id}>
                {author.name}
              </option>
            ))}
          </select>
        </div>

        {/* Channel */}
        <div className="flex flex-col gap-0.5 flex-1 min-w-[120px]">
          <label className="text-[9px] uppercase tracking-widest font-bold text-slate-500 pl-1">Channel</label>
          <select
            className="w-full bg-slate-900 border border-slate-800 text-xs py-1.5 px-2 rounded focus:outline-none focus:border-violet-500 text-slate-300"
            value={filterState.selectedChannelId ?? ""}
            onChange={(e) => selectChannel(e.target.value)}
          >
            <option value="">All Channels</option>
            {channels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                #{channel.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="flex flex-col gap-0.5 flex-1 min-w-[120px]">
            <label className="text-[9px] uppercase tracking-widest font-bold text-slate-500 pl-1">Tags</label>
            <select
              className="w-full bg-slate-900 border border-slate-800 text-xs py-1.5 px-2 rounded focus:outline-none focus:border-violet-500 text-slate-300"
              value={filterState.selectedTag}
              onChange={(e) => selectTag(e.target.value)}
            >
              <option value="">All Tags</option>
              {allTags.map(([tagId, tagName]) => (
                <option key={tagId} value={tagId}>
                  {tagName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date From */}
        <div className="flex flex-col gap-0.5">
          <label className="text-[9px] uppercase tracking-widest font-bold text-slate-500 pl-1">Date From</label>
          <input
            type="date"
            value={filterState.dateFrom}
            onChange={(e) => handleDateFrom(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-[11px] py-1 px-2 rounded focus:outline-none focus:border-violet-500 text-slate-300"
          />
        </div>

        {/* Date To */}
        <div className="flex flex-col gap-0.5">
          <label className="text-[9px] uppercase tracking-widest font-bold text-slate-500 pl-1">Date To</label>
          <input
            type="date"
            value={filterState.dateTo}
            onChange={(e) => handleDateTo(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-[11px] py-1 px-2 rounded focus:outline-none focus:border-violet-500 text-slate-300"
          />
        </div>

        {/* Clear All */}
        {hasActive && (
          <button
            onClick={clearFilters}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded transition-colors self-end mb-0.5"
            title="Clear all filters"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
          </button>
        )}
      </div>

      {resultCount !== undefined && resultCount > 0 && (
        <div className="font-mono text-xs text-slate-500 mt-3 pl-1">
          {resultCount} result{resultCount !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
