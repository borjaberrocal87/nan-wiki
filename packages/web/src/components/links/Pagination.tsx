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

  const btnBase = "w-8 h-8 flex items-center justify-center border border-slate-800 text-slate-500 hover:text-white hover:border-violet-500 transition-all text-xs font-bold";
  const btnActive = "w-8 h-8 flex items-center justify-center border border-violet-500 bg-violet-600/10 text-violet-400 text-xs font-bold";

  const navBtnBase = "w-8 h-8 flex items-center justify-center border border-slate-800 text-slate-500 hover:text-white hover:border-violet-500 transition-all";

  return (
    <div className="p-4 border-t border-slate-800 flex justify-between items-center bg-surface-container-low/50">
      <div className="text-[12px] text-slate-500 uppercase tracking-widest font-bold">
        {totalItems > 0
          ? `Showing ${((currentPage - 1) * perPage) + 1}–${Math.min(currentPage * perPage, totalItems)} of ${totalItems.toLocaleString()} results`
          : "No results"}
      </div>

      <div className="flex gap-1">
        <button
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          className={`${navBtnBase} ${currentPage === 1 ? "opacity-50 cursor-default" : ""}`}
        >
          <span className="material-symbols-outlined text-sm">chevron_left</span>
        </button>

        {pages[0] !== 1 && pages[0] !== undefined && (
          <>
            <button
              onClick={() => handlePageClick(1)}
              className={1 === currentPage ? btnActive : btnBase}
            >
              1
            </button>
            {pages[0] > 2 && (
              <span className="w-8 h-8 flex items-center justify-center text-slate-500 text-xs font-bold">
                ...
              </span>
            )}
          </>
        )}

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => handlePageClick(page)}
            className={page === currentPage ? btnActive : btnBase}
          >
            {page}
          </button>
        ))}

        {pages[pages.length - 1] !== totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && (
              <span className="w-8 h-8 flex items-center justify-center text-slate-500 text-xs font-bold">
                ...
              </span>
            )}
            <button
              onClick={() => handlePageClick(totalPages)}
              className={totalPages === currentPage ? btnActive : btnBase}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`${navBtnBase} ${currentPage === totalPages ? "opacity-50 cursor-default" : ""}`}
        >
          <span className="material-symbols-outlined text-sm">chevron_right</span>
        </button>
      </div>
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
