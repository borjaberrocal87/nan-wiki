"use client";

import { useCallback } from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  perPage,
  onPageChange,
}: PaginationProps) {
  const handlePageClick = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        onPageChange(page);
      }
    },
    [onPageChange, totalPages],
  );

  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  const pageButtonStyle = (page: number): React.CSSProperties => ({
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: page === currentPage ? "var(--accent-primary-container)" : "transparent",
    color: page === currentPage ? "var(--text-on-primary-container)" : "var(--text-secondary)",
    border: `1px solid ${page === currentPage ? "var(--accent-primary-container)" : "var(--border-color)"}`,
    borderRadius: "4px",
    fontSize: "13px",
    fontWeight: page === currentPage ? 600 : 400,
    cursor: page === currentPage ? "default" : "pointer",
    transition: "all 0.15s",
    fontFamily: "var(--font-sans)",
  });

  const navButtonStyle = (disabled: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "6px 12px",
    backgroundColor: "transparent",
    color: disabled ? "var(--text-tertiary)" : "var(--text-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "4px",
    fontSize: "13px",
    cursor: disabled ? "default" : "pointer",
    transition: "all 0.2s",
    fontFamily: "var(--font-sans)",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        marginTop: "40px",
        padding: "16px 0",
      }}
    >
      <button
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 1}
        style={navButtonStyle(currentPage === 1)}
        onMouseEnter={(e) => {
          if (currentPage > 1) e.currentTarget.style.borderColor = "var(--accent-primary-container)";
          if (currentPage > 1) e.currentTarget.style.color = "var(--accent-primary-container)";
        }}
        onMouseLeave={(e) => {
          if (currentPage > 1) e.currentTarget.style.borderColor = "var(--border-color)";
          if (currentPage > 1) e.currentTarget.style.color = "var(--text-secondary)";
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Prev
      </button>

      {pages[0] !== 1 && pages[0] !== undefined && (
        <>
          <button
            onClick={() => handlePageClick(1)}
            style={pageButtonStyle(1)}
            onMouseEnter={(e) => {
              if (1 !== currentPage) e.currentTarget.style.borderColor = "var(--accent-primary-container)";
            }}
            onMouseLeave={(e) => {
              if (1 !== currentPage) e.currentTarget.style.borderColor = "var(--border-color)";
            }}
          >
            1
          </button>
          {pages[0] > 2 && (
            <span style={{ color: "var(--text-tertiary)", fontSize: "13px", padding: "0 2px", fontFamily: "var(--font-mono)" }}>&middot;</span>
          )}
        </>
      )}

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => handlePageClick(page)}
          style={pageButtonStyle(page)}
          onMouseEnter={(e) => {
            if (page !== currentPage) e.currentTarget.style.borderColor = "var(--accent-primary-container)";
          }}
          onMouseLeave={(e) => {
            if (page !== currentPage) e.currentTarget.style.borderColor = "var(--border-color)";
          }}
        >
          {page}
        </button>
      ))}

      {pages[pages.length - 1] !== totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && (
            <span style={{ color: "var(--text-tertiary)", fontSize: "13px", padding: "0 2px", fontFamily: "var(--font-mono)" }}>&middot;</span>
          )}
          <button
            onClick={() => handlePageClick(totalPages)}
            style={pageButtonStyle(totalPages)}
            onMouseEnter={(e) => {
              if (totalPages !== currentPage) e.currentTarget.style.borderColor = "var(--accent-primary-container)";
            }}
            onMouseLeave={(e) => {
              if (totalPages !== currentPage) e.currentTarget.style.borderColor = "var(--border-color)";
            }}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={navButtonStyle(currentPage === totalPages)}
        onMouseEnter={(e) => {
          if (currentPage < totalPages) e.currentTarget.style.borderColor = "var(--accent-primary-container)";
          if (currentPage < totalPages) e.currentTarget.style.color = "var(--accent-primary-container)";
        }}
        onMouseLeave={(e) => {
          if (currentPage < totalPages) e.currentTarget.style.borderColor = "var(--border-color)";
          if (currentPage < totalPages) e.currentTarget.style.color = "var(--text-secondary)";
        }}
      >
        Next
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      <span style={{
        fontFamily: "var(--font-mono)",
        fontSize: "12px",
        color: "var(--text-tertiary)",
        marginLeft: "16px",
        fontVariantNumeric: "tabular-nums",
      }}>
        {totalItems > 0 ? `${((currentPage - 1) * perPage) + 1}\u2013${Math.min(currentPage * perPage, totalItems)} of ${totalItems}` : "No results"}
      </span>
    </div>
  );
}

function getPageNumbers(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: number[] = [];

  if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i);
  } else if (current >= total - 3) {
    for (let i = total - 4; i <= total; i++) pages.push(i);
  } else {
    for (let i = current - 2; i <= current + 2; i++) pages.push(i);
  }

  return pages;
}
