"use client";

import { useState } from "react";
import type { SourceItem } from "../../lib/api";

interface LinkFiltersProps {
  sources: SourceItem[];
  onFilterChange: (filters: Record<string, string | null>) => void;
}

export default function LinkFilters({ sources, onFilterChange }: LinkFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const sourcesList = sources.map((s) => s.source);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onFilterChange({ search_query: value || null, source: selectedSource, date_from: dateFrom || null, date_to: dateTo || null });
  };

  const handleSourceChange = (source: string | null) => {
    setSelectedSource(source);
    onFilterChange({ source, search_query: searchQuery || null, date_from: dateFrom || null, date_to: dateTo || null });
  };

  const handleDateFromChange = (value: string) => {
    setDateFrom(value);
    onFilterChange({ source: selectedSource, search_query: searchQuery || null, date_from: value || null, date_to: dateTo || null });
  };

  const handleDateToChange = (value: string) => {
    setDateTo(value);
    onFilterChange({ source: selectedSource, search_query: searchQuery || null, date_from: dateFrom || null, date_to: value || null });
  };

  const hasActiveFilters = searchQuery || selectedSource || dateFrom || dateTo;

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedSource(null);
    setDateFrom("");
    setDateTo("");
    onFilterChange({});
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      marginBottom: "24px",
      padding: "16px",
      backgroundColor: "#111111",
      borderRadius: "8px",
      border: "1px solid #1e1e1e",
    }}>
      <input
        type="text"
        placeholder="Search links..."
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        style={{
          backgroundColor: "#0a0a0a",
          border: "1px solid #1e1e1e",
          borderRadius: "6px",
          padding: "10px 14px",
          color: "#e5e5e5",
          fontSize: "14px",
          outline: "none",
        }}
      />

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <select
          value={selectedSource || ""}
          onChange={(e) => handleSourceChange(e.target.value || null)}
          style={{
            backgroundColor: "#0a0a0a",
            border: "1px solid #1e1e1e",
            borderRadius: "6px",
            padding: "8px 12px",
            color: "#e5e5e5",
            fontSize: "13px",
            outline: "none",
            cursor: "pointer",
            minWidth: "140px",
          }}
        >
          <option value="">All sources</option>
          {sourcesList.map((source) => (
            <option key={source} value={source}>{source}</option>
          ))}
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => handleDateFromChange(e.target.value)}
          style={{
            backgroundColor: "#0a0a0a",
            border: "1px solid #1e1e1e",
            borderRadius: "6px",
            padding: "8px 12px",
            color: "#e5e5e5",
            fontSize: "13px",
            outline: "none",
            cursor: "pointer",
          }}
        />

        <input
          type="date"
          value={dateTo}
          onChange={(e) => handleDateToChange(e.target.value)}
          style={{
            backgroundColor: "#0a0a0a",
            border: "1px solid #1e1e1e",
            borderRadius: "6px",
            padding: "8px 12px",
            color: "#e5e5e5",
            fontSize: "13px",
            outline: "none",
            cursor: "pointer",
          }}
        />

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            style={{
              backgroundColor: "transparent",
              border: "1px solid #333",
              borderRadius: "6px",
              padding: "8px 14px",
              color: "#999",
              fontSize: "13px",
              cursor: "pointer",
              marginLeft: "auto",
            }}
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
