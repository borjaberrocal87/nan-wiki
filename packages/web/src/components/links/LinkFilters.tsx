"use client";

import { useState, useMemo } from "react";
import type { SourceItem } from "../../lib/api";
import { SOURCE_CONFIG, type SourceType } from "../../lib/sources";

interface LinkFiltersProps {
  sources: SourceItem[];
  onFilterChange: (filters: Record<string, string | string[] | null>) => void;
  tags?: string[];
  authors?: Array<{ id: number; username: string }>;
  channels?: Array<{ id: number; name: string }>;
  activeFilterCount?: number;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  resultCount?: number;
}

interface FilterState {
  selectedSources: Set<string>;
  selectedTags: Set<string>;
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
}: LinkFiltersProps) {
  const [filterState, setFilterState] = useState<FilterState>({
    selectedSources: new Set(),
    selectedTags: new Set(),
    selectedAuthorId: null,
    selectedChannelId: null,
    dateFrom: "",
    dateTo: "",
    searchMessage: "",
  });
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false);
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);

  const sourcesList = sources.map((s) => s.source);
  const allTags = useMemo(() => {
    const tagMap = new Map<string, number>();
    for (const tag of tags) {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
    }
    return Array.from(tagMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([tag]) => tag);
  }, [tags]);

  const emitFilters = (state: FilterState) => {
    const filters: Record<string, string | string[] | null> = {};

    if (state.selectedSources.size > 0) {
      filters.source = Array.from(state.selectedSources);
    }
    if (state.selectedTags.size > 0) {
      filters.tags = Array.from(state.selectedTags);
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
    if (state.searchMessage) {
      filters.search_query = state.searchMessage;
    }

    onFilterChange(filters);
  };

  const toggleSource = (source: string) => {
    const newSet = new Set(filterState.selectedSources);
    if (newSet.has(source)) {
      newSet.delete(source);
    } else {
      newSet.add(source);
    }
    const newState = { ...filterState, selectedSources: newSet };
    setFilterState(newState);
    emitFilters(newState);
    setShowSourceDropdown(false);
  };

  const toggleTag = (tag: string) => {
    const newSet = new Set(filterState.selectedTags);
    if (newSet.has(tag)) {
      newSet.delete(tag);
    } else {
      newSet.add(tag);
    }
    const newState = { ...filterState, selectedTags: newSet };
    setFilterState(newState);
    emitFilters(newState);
    setShowTagDropdown(false);
  };

  const selectAuthor = (authorId: string) => {
    const newState = { ...filterState, selectedAuthorId: filterState.selectedAuthorId === authorId ? null : authorId };
    setFilterState(newState);
    emitFilters(newState);
    setShowAuthorDropdown(false);
  };

  const selectChannel = (channelId: string) => {
    const newState = { ...filterState, selectedChannelId: filterState.selectedChannelId === channelId ? null : channelId };
    setFilterState(newState);
    emitFilters(newState);
    setShowChannelDropdown(false);
  };

  const handleDateFrom = (value: string) => {
    const newState = { ...filterState, dateFrom: value };
    setFilterState(newState);
    emitFilters(newState);
  };

  const handleDateTo = (value: string) => {
    const newState = { ...filterState, dateTo: value };
    setFilterState(newState);
    emitFilters(newState);
  };

  const handleSearchMessage = (value: string) => {
    const newState = { ...filterState, searchMessage: value };
    setFilterState(newState);
    emitFilters(newState);
  };

  const activeCount =
    filterState.selectedSources.size +
    filterState.selectedTags.size +
    (filterState.selectedAuthorId ? 1 : 0) +
    (filterState.selectedChannelId ? 1 : 0) +
    (filterState.dateFrom ? 1 : 0) +
    (filterState.dateTo ? 1 : 0) +
    (filterState.searchMessage ? 1 : 0);

  const clearFilters = () => {
    const empty: FilterState = {
      selectedSources: new Set(),
      selectedTags: new Set(),
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
          {renderMultiSelectDropdown(
            showSourceDropdown,
            () => setShowSourceDropdown(false),
            "Sources",
            sourcesList.length > 0 && filterState.selectedSources.size > 0 ? (
              <span className="text-slate-300 text-xs py-1 px-3 truncate">{Array.from(filterState.selectedSources).join(", ")}</span>
            ) : (
              <span className="text-slate-500 text-xs py-1 px-3">All Sources</span>
            ),
            sourcesList.map((source) => {
              const sourceKey = source.toLowerCase() as SourceType;
              const config = SOURCE_CONFIG[sourceKey] || SOURCE_CONFIG.other;
              const isSelected = filterState.selectedSources.has(source);
              return (
                <button
                  key={source}
                  onClick={() => toggleSource(source)}
                  className={`flex items-center gap-2 w-full px-2 py-1.5 text-xs text-left transition-colors ${
                    isSelected ? "bg-violet-600/20 text-violet-400" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded border-[1.5px] flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? "border-violet-500 bg-violet-500"
                        : "border-slate-600 bg-transparent"
                    }`}
                  >
                    {isSelected && (
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </span>
                  <span>{config.label}</span>
                </button>
              );
            }),
          )}
        </div>

        {/* Author */}
        <div className="flex flex-col gap-0.5 flex-1 min-w-[120px]">
          <label className="text-[9px] uppercase tracking-widest font-bold text-slate-500 pl-1">Author</label>
          {renderMultiSelectDropdown(
            showAuthorDropdown,
            () => setShowAuthorDropdown(false),
            "Authors",
            filterState.selectedAuthorId ? (
              <span className="text-slate-300 text-xs py-1 px-3 truncate">
                {authors.find((a) => String(a.id) === filterState.selectedAuthorId)?.username || "Author"}
              </span>
            ) : (
              <span className="text-slate-500 text-xs py-1 px-3">All Authors</span>
            ),
            <>
              <button
                onClick={() => selectAuthor("")}
                className={`w-full px-2 py-1.5 text-xs text-left transition-colors ${
                  !filterState.selectedAuthorId ? "bg-violet-600/20 text-violet-400" : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                All Authors
              </button>
              {authors.map((author) => (
                <button
                  key={author.id}
                  onClick={() => selectAuthor(String(author.id))}
                  className={`w-full px-2 py-1.5 text-xs text-left transition-colors ${
                    filterState.selectedAuthorId === String(author.id) ? "bg-violet-600/20 text-violet-400" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {author.username}
                </button>
              ))}
            </>,
          )}
        </div>

        {/* Channel */}
        <div className="flex flex-col gap-0.5 flex-1 min-w-[120px]">
          <label className="text-[9px] uppercase tracking-widest font-bold text-slate-500 pl-1">Channel</label>
          {renderMultiSelectDropdown(
            showChannelDropdown,
            () => setShowChannelDropdown(false),
            "Channels",
            filterState.selectedChannelId ? (
              <span className="text-slate-300 text-xs py-1 px-3 truncate">
                {channels.find((c) => String(c.id) === filterState.selectedChannelId)?.name || "Channel"}
              </span>
            ) : (
              <span className="text-slate-500 text-xs py-1 px-3">All Channels</span>
            ),
            <>
              <button
                onClick={() => selectChannel("")}
                className={`w-full px-2 py-1.5 text-xs text-left transition-colors ${
                  !filterState.selectedChannelId ? "bg-violet-600/20 text-violet-400" : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                All Channels
              </button>
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => selectChannel(String(channel.id))}
                  className={`w-full px-2 py-1.5 text-xs text-left transition-colors ${
                    filterState.selectedChannelId === String(channel.id) ? "bg-violet-600/20 text-violet-400" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  #{channel.name}
                </button>
              ))}
            </>,
          )}
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="flex flex-col gap-0.5 flex-1 min-w-[120px]">
            <label className="text-[9px] uppercase tracking-widest font-bold text-slate-500 pl-1">Tags</label>
            {renderMultiSelectDropdown(
              showTagDropdown,
              () => setShowTagDropdown(false),
              "Tags",
              filterState.selectedTags.size > 0 ? (
                <span className="text-slate-300 text-xs py-1 px-3 truncate">{filterState.selectedTags.size} selected</span>
              ) : (
                <span className="text-slate-500 text-xs py-1 px-3">All Tags</span>
              ),
              allTags.map((tag) => {
                const isSelected = filterState.selectedTags.has(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`w-full px-2 py-1.5 text-xs text-left transition-colors ${
                      isSelected ? "bg-violet-600/20 text-violet-400" : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <span className="font-mono">{tag}</span>
                  </button>
                );
              }),
            )}
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

  function renderMultiSelectDropdown(
    isOpen: boolean,
    onClose: () => void,
    _triggerLabel: string,
    triggerContent: React.ReactNode,
    dropdownContent: React.ReactNode,
  ) {
    return (
      <div className="relative">
        <button
          onClick={() => {
            if (isOpen) onClose();
          }}
          onMouseDown={(e) => e.preventDefault()}
          className="w-full bg-slate-900 border border-slate-800 text-xs py-1.5 px-3 rounded focus:outline-none focus:border-violet-500 text-left cursor-pointer min-h-[30px] transition-colors overflow-hidden"
        >
          {triggerContent}
        </button>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[1]" onClick={onClose} />
            <div
              className="absolute z-10 top-full left-0 mt-1 bg-slate-900 border border-slate-800 rounded p-1 min-w-[180px] max-h-[240px] overflow-y-auto"
            >
              {dropdownContent}
            </div>
          </>
        )}
      </div>
    );
  }
}
