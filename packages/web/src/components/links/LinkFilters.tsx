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
}

interface FilterState {
  selectedSources: Set<string>;
  selectedTags: Set<string>;
  selectedAuthorId: string | null;
  selectedChannelId: string | null;
  dateFrom: string;
  dateTo: string;
}

export default function LinkFilters({
  sources,
  onFilterChange,
  tags = [],
  authors = [],
  channels = [],
  activeFilterCount: _activeFilterCount,
}: LinkFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterState, setFilterState] = useState<FilterState>({
    selectedSources: new Set(),
    selectedTags: new Set(),
    selectedAuthorId: null,
    selectedChannelId: null,
    dateFrom: "",
    dateTo: "",
  });
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false);
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

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

  const emitFilters = (state: FilterState, search: string) => {
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
    if (search) {
      filters.search_query = search;
    }

    onFilterChange(filters);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    emitFilters(filterState, value);
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
    emitFilters(newState, searchQuery);
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
    emitFilters(newState, searchQuery);
    setShowTagDropdown(false);
  };

  const selectAuthor = (authorId: string) => {
    const newState = { ...filterState, selectedAuthorId: filterState.selectedAuthorId === authorId ? null : authorId };
    setFilterState(newState);
    emitFilters(newState, searchQuery);
    setShowAuthorDropdown(false);
  };

  const selectChannel = (channelId: string) => {
    const newState = { ...filterState, selectedChannelId: filterState.selectedChannelId === channelId ? null : channelId };
    setFilterState(newState);
    emitFilters(newState, searchQuery);
    setShowChannelDropdown(false);
  };

  const handleDateFrom = (value: string) => {
    const newState = { ...filterState, dateFrom: value };
    setFilterState(newState);
    emitFilters(newState, searchQuery);
  };

  const handleDateTo = (value: string) => {
    const newState = { ...filterState, dateTo: value };
    setFilterState(newState);
    emitFilters(newState, searchQuery);
  };

  const activeCount =
    filterState.selectedSources.size +
    filterState.selectedTags.size +
    (filterState.selectedAuthorId ? 1 : 0) +
    (filterState.selectedChannelId ? 1 : 0) +
    (filterState.dateFrom ? 1 : 0) +
    (filterState.dateTo ? 1 : 0) +
    (searchQuery ? 1 : 0);

  const clearFilters = () => {
    const empty: FilterState = {
      selectedSources: new Set(),
      selectedTags: new Set(),
      selectedAuthorId: null,
      selectedChannelId: null,
      dateFrom: "",
      dateTo: "",
    };
    setFilterState(empty);
    setSearchQuery("");
    emitFilters(empty, "");
  };

  const hasActive = activeCount > 0;

  return (
    <div className="mb-8">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 bg-transparent border-none text-text-tertiary text-sm cursor-pointer px-1 pb-3 font-sans font-semibold uppercase tracking-[0.05em]"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={`transition-transform duration-150 ${collapsed ? "" : "rotate-90"}`}
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
        Filters
        {hasActive && (
          <span className="font-mono text-xs font-semibold text-accent-primary-container">
            {activeCount}
          </span>
        )}
      </button>

      {!collapsed && (
        <div
          className="flex flex-col gap-3 p-4 bg-surface-container-lowest rounded border border-border-color"
        >
          <div className="flex gap-2 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search links, tags, authors..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="input text-sm py-[7px] px-3"
              />
            </div>

            {renderMultiSelectDropdown(
              showSourceDropdown,
              () => setShowSourceDropdown(false),
              "Sources",
              sourcesList.length > 0 && filterState.selectedSources.size > 0 ? (
                <span className="font-mono text-sm text-text-secondary">{filterState.selectedSources.size} selected</span>
              ) : (
                <span className="font-mono text-sm text-text-tertiary">Sources</span>
              ),
              sourcesList.map((source) => {
                const sourceKey = source.toLowerCase() as SourceType;
                const config = SOURCE_CONFIG[sourceKey] || SOURCE_CONFIG.other;
                const isSelected = filterState.selectedSources.has(source);
                return (
                  <button
                    key={source}
                    onClick={() => toggleSource(source)}
                    className="flex items-center gap-2 w-full px-1.5 py-1 bg-surface-container border-none rounded text-primary text-sm cursor-pointer text-left font-sans"
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded border-[1.5px] flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? "border-accent-primary-container bg-accent-primary-container"
                          : "border-border-color bg-transparent"
                      }`}
                    >
                      {isSelected && (
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--bg-primary)" strokeWidth="4" strokeLinecap="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </span>
                    <span className="font-mono text-xs uppercase">{config.label}</span>
                  </button>
                );
              }),
              hasActive,
            )}

            {allTags.length > 0 &&
              renderMultiSelectDropdown(
                showTagDropdown,
                () => setShowTagDropdown(false),
                "Tags",
                filterState.selectedTags.size > 0 ? (
                  <span className="font-mono text-sm text-text-secondary">{filterState.selectedTags.size} selected</span>
                ) : (
                  <span className="font-mono text-sm text-text-tertiary">Tags</span>
                ),
                allTags.map((tag) => {
                  const isSelected = filterState.selectedTags.has(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className="flex items-center gap-2 w-full px-1.5 py-1 bg-surface-container border-none rounded text-primary text-sm cursor-pointer text-left font-sans"
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded border-[1.5px] flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? "border-accent-primary-container bg-accent-primary-container"
                            : "border-border-color bg-transparent"
                        }`}
                      >
                        {isSelected && (
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--bg-primary)" strokeWidth="4" strokeLinecap="round">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                      </span>
                      <span className="font-mono text-xs overflow-hidden text-ellipsis">{tag}</span>
                    </button>
                  );
                }),
                hasActive,
              )}

            {channels.length > 0 &&
              renderMultiSelectDropdown(
                showChannelDropdown,
                () => setShowChannelDropdown(false),
                "Channel",
                filterState.selectedChannelId ? (
                  <span className="font-mono text-sm text-text-secondary">
                    {channels.find((c) => String(c.id) === filterState.selectedChannelId)?.name || "Channel"}
                  </span>
                ) : (
                  <span className="font-mono text-sm text-text-tertiary">Channel</span>
                ),
                <>
                  <button
                    onClick={() => selectChannel("")}
                    className={`flex items-center gap-2 w-full px-1.5 py-1 border-none rounded text-sm cursor-pointer text-left font-sans ${
                      !filterState.selectedChannelId ? "bg-surface-container text-primary" : "bg-transparent text-secondary"
                    }`}
                  >
                    All channels
                  </button>
                  {channels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => selectChannel(String(channel.id))}
                      className={`flex items-center gap-2 w-full px-1.5 py-1 border-none rounded text-sm cursor-pointer text-left font-sans ${
                        filterState.selectedChannelId === String(channel.id) ? "bg-surface-container text-primary" : "bg-transparent text-secondary"
                      }`}
                    >
                      <span className="font-mono text-xs">#{channel.name}</span>
                    </button>
                  ))}
                </>,
                hasActive,
              )}

            {authors.length > 0 &&
              renderMultiSelectDropdown(
                showAuthorDropdown,
                () => setShowAuthorDropdown(false),
                "Author",
                filterState.selectedAuthorId ? (
                  <span className="font-mono text-sm text-text-secondary">
                    {authors.find((a) => String(a.id) === filterState.selectedAuthorId)?.username || "Author"}
                  </span>
                ) : (
                  <span className="font-mono text-sm text-text-tertiary">Author</span>
                ),
                <>
                  <button
                    onClick={() => selectAuthor("")}
                    className={`flex items-center gap-2 w-full px-1.5 py-1 border-none rounded text-sm cursor-pointer text-left font-sans ${
                      !filterState.selectedAuthorId ? "bg-surface-container text-primary" : "bg-transparent text-secondary"
                    }`}
                  >
                    All authors
                  </button>
                  {authors.map((author) => (
                    <button
                      key={author.id}
                      onClick={() => selectAuthor(String(author.id))}
                      className={`flex items-center gap-2 w-full px-1.5 py-1 border-none rounded text-sm cursor-pointer text-left font-sans ${
                        filterState.selectedAuthorId === String(author.id) ? "bg-surface-container text-primary" : "bg-transparent text-secondary"
                      }`}
                    >
                      <span className="font-mono text-xs">{author.username}</span>
                    </button>
                  ))}
                </>,
                hasActive,
              )}

            <input
              type="date"
              value={filterState.dateFrom}
              onChange={(e) => handleDateFrom(e.target.value)}
              className={`input text-sm py-[7px] px-[10px] cursor-pointer ${
                filterState.dateFrom ? "text-text-primary border-accent-primary-container" : "text-text-tertiary"
              }`}
              title="From date"
            />

            <input
              type="date"
              value={filterState.dateTo}
              onChange={(e) => handleDateTo(e.target.value)}
              className={`input text-sm py-[7px] px-[10px] cursor-pointer ${
                filterState.dateTo ? "text-text-primary border-accent-primary-container" : "text-text-tertiary"
              }`}
              title="To date"
            />

            {hasActive && (
              <button
                onClick={clearFilters}
                className="btn-outline font-sans text-sm py-[7px] px-3 border-border-color text-text-tertiary hover:border-accent-primary-container hover:text-accent-primary-container"
              >
                Clear all
              </button>
            )}
          </div>
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
    hasActive: boolean,
  ) {
    return (
      <div className="relative">
        <button
          onClick={() => {
            if (isOpen) onClose();
            else {
              onClose();
              setTimeout(() => setShowSourceDropdown(false), 0);
            }
          }}
          onMouseDown={(e) => e.preventDefault()}
          className={`flex items-center gap-1.5 bg-surface-container border rounded py-[7px] px-2.5 text-primary text-sm outline-none cursor-pointer min-w-[120px] transition-all duration-200 font-sans whitespace-nowrap ${
            hasActive ? "border-accent-primary-container" : "border-border-color"
          } hover:border-accent-primary-container`}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = hasActive ? "var(--accent-primary-container)" : "var(--border-color)";
          }}
        >
          {triggerContent}
          <span className="text-text-tertiary ml-auto font-mono text-xs">&#9662;</span>
        </button>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[1]" onClick={onClose} />
            <div
              className="absolute z-10 top-full left-0 bg-surface-container-lowest border border-border-color rounded p-1 min-w-[180px] max-h-[240px] overflow-y-auto"
              style={{ marginTop: "4px" }}
            >
              {dropdownContent}
            </div>
          </>
        )}
      </div>
    );
  }
}
