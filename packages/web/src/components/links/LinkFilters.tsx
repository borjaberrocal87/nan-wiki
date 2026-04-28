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

  const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    backgroundColor: "var(--bg-surface-container-lowest)",
    border: "1px solid var(--border-color)",
    borderRadius: "4px",
    padding: "4px",
    zIndex: 10,
    minWidth: "180px",
    maxHeight: "240px",
    overflowY: "auto",
  };

  const triggerButtonStyle = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "var(--bg-surface-container)",
    border: `1px solid ${active ? "var(--accent-primary-container)" : "var(--border-color)"}`,
    borderRadius: "4px",
    padding: "7px 10px",
    color: "var(--text-primary)",
    fontSize: "13px",
    outline: "none",
    cursor: "pointer",
    minWidth: "120px",
    transition: "all 0.2s",
    fontFamily: "var(--font-sans)",
    whiteSpace: "nowrap",
  });

  const dropdownItemStyle = (selected: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "100%",
    padding: "5px 6px",
    backgroundColor: selected ? "var(--bg-surface-container)" : "transparent",
    border: "none",
    borderRadius: "4px",
    color: selected ? "var(--text-primary)" : "var(--text-secondary)",
    fontSize: "13px",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "var(--font-sans)",
  });

  const checkboxStyle = (selected: boolean): React.CSSProperties => ({
    width: "14px",
    height: "14px",
    borderRadius: "3px",
    border: `1.5px solid ${selected ? "var(--accent-primary-container)" : "var(--border-color)"}`,
    backgroundColor: selected ? "var(--accent-primary-container)" : "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  });

  return (
    <div style={{ marginBottom: "32px" }}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          backgroundColor: "transparent",
          border: "none",
          color: "var(--text-tertiary)",
          fontSize: "13px",
          cursor: "pointer",
          padding: "0 4px 12px",
          fontFamily: "var(--font-sans)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ transform: collapsed ? "" : "rotate(90deg)", transition: "transform 0.15s" }}
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
        Filters
        {hasActive && (
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--accent-primary-container)",
          }}>
            {activeCount}
          </span>
        )}
      </button>

      {!collapsed && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            padding: "16px",
            backgroundColor: "var(--bg-surface-container-lowest)",
            borderRadius: "4px",
            border: "1px solid var(--border-color)",
          }}
        >
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <input
                type="text"
                placeholder="Search links, tags, authors..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="input"
                style={{ fontSize: "13px", padding: "7px 12px" }}
              />
            </div>

            {renderMultiSelectDropdown(
              showSourceDropdown,
              () => setShowSourceDropdown(false),
              "Sources",
              sourcesList.length > 0 && filterState.selectedSources.size > 0 ? (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-secondary)" }}>{filterState.selectedSources.size} selected</span>
              ) : (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-tertiary)" }}>Sources</span>
              ),
              sourcesList.map((source) => {
                const sourceKey = source.toLowerCase() as SourceType;
                const config = SOURCE_CONFIG[sourceKey] || SOURCE_CONFIG.other;
                const isSelected = filterState.selectedSources.has(source);
                return (
                  <button
                    key={source}
                    onClick={() => toggleSource(source)}
                    style={dropdownItemStyle(isSelected)}
                  >
                    <span style={checkboxStyle(isSelected)}>
                      {isSelected && (
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--bg-primary)" strokeWidth="4" strokeLinecap="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", textTransform: "uppercase" }}>{config.label}</span>
                  </button>
                );
              }),
            )}

            {allTags.length > 0 &&
              renderMultiSelectDropdown(
                showTagDropdown,
                () => setShowTagDropdown(false),
                "Tags",
                filterState.selectedTags.size > 0 ? (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-secondary)" }}>{filterState.selectedTags.size} selected</span>
                ) : (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-tertiary)" }}>Tags</span>
                ),
                allTags.map((tag) => {
                  const isSelected = filterState.selectedTags.has(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      style={dropdownItemStyle(isSelected)}
                    >
                      <span style={checkboxStyle(isSelected)}>
                        {isSelected && (
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--bg-primary)" strokeWidth="4" strokeLinecap="round">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis" }}>{tag}</span>
                    </button>
                  );
                }),
              )}

            {channels.length > 0 &&
              renderMultiSelectDropdown(
                showChannelDropdown,
                () => setShowChannelDropdown(false),
                "Channel",
                filterState.selectedChannelId ? (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-secondary)" }}>
                    {channels.find((c) => String(c.id) === filterState.selectedChannelId)?.name || "Channel"}
                  </span>
                ) : (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-tertiary)" }}>Channel</span>
                ),
                <>
                  <button
                    onClick={() => selectChannel("")}
                    style={dropdownItemStyle(!filterState.selectedChannelId)}
                  >
                    All channels
                  </button>
                  {channels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => selectChannel(String(channel.id))}
                      style={dropdownItemStyle(filterState.selectedChannelId === String(channel.id))}
                    >
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}>#{channel.name}</span>
                    </button>
                  ))}
                </>,
              )}

            {authors.length > 0 &&
              renderMultiSelectDropdown(
                showAuthorDropdown,
                () => setShowAuthorDropdown(false),
                "Author",
                filterState.selectedAuthorId ? (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-secondary)" }}>
                    {authors.find((a) => String(a.id) === filterState.selectedAuthorId)?.username || "Author"}
                  </span>
                ) : (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-tertiary)" }}>Author</span>
                ),
                <>
                  <button
                    onClick={() => selectAuthor("")}
                    style={dropdownItemStyle(!filterState.selectedAuthorId)}
                  >
                    All authors
                  </button>
                  {authors.map((author) => (
                    <button
                      key={author.id}
                      onClick={() => selectAuthor(String(author.id))}
                      style={dropdownItemStyle(filterState.selectedAuthorId === String(author.id))}
                    >
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}>{author.username}</span>
                    </button>
                  ))}
                </>,
              )}

            <input
              type="date"
              value={filterState.dateFrom}
              onChange={(e) => handleDateFrom(e.target.value)}
              className="input"
              style={{
                fontSize: "13px",
                padding: "7px 10px",
                color: filterState.dateFrom ? "var(--text-primary)" : "var(--text-tertiary)",
                borderColor: filterState.dateFrom ? "var(--accent-primary-container)" : "var(--border-color)",
                cursor: "pointer",
              }}
              title="From date"
            />

            <input
              type="date"
              value={filterState.dateTo}
              onChange={(e) => handleDateTo(e.target.value)}
              className="input"
              style={{
                fontSize: "13px",
                padding: "7px 10px",
                color: filterState.dateTo ? "var(--text-primary)" : "var(--text-tertiary)",
                borderColor: filterState.dateTo ? "var(--accent-primary-container)" : "var(--border-color)",
                cursor: "pointer",
              }}
              title="To date"
            />

            {hasActive && (
              <button
                onClick={clearFilters}
                className="btn-outline"
                style={{
                  fontSize: "13px",
                  padding: "7px 12px",
                  color: "var(--text-tertiary)",
                  borderColor: "var(--border-color)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent-primary-container)";
                  e.currentTarget.style.color = "var(--accent-primary-container)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-color)";
                  e.currentTarget.style.color = "var(--text-tertiary)";
                }}
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
  ) {
    return (
      <div style={{ position: "relative" }}>
        <button
          onClick={() => {
            if (isOpen) onClose();
            else {
              onClose();
              setTimeout(() => setShowSourceDropdown(false), 0);
            }
          }}
          onMouseDown={(e) => e.preventDefault()}
          style={triggerButtonStyle(hasActive)}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent-primary-container)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = hasActive ? "var(--accent-primary-container)" : "var(--border-color)";
          }}
        >
          {triggerContent}
          <span style={{ color: "var(--text-tertiary)", marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: "11px" }}>&#9662;</span>
        </button>
        {isOpen && (
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 1 }} onClick={onClose} />
            <div style={dropdownStyle}>
              {dropdownContent}
            </div>
          </>
        )}
      </div>
    );
  }
}
