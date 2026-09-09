import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  isLoading?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  isLoading = false,
}: PaginationProps) {
  if (totalItems <= 0) return null;

  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-slate-200 text-xs text-slate-600">
      <div>
        Showing <span className="font-bold text-slate-900">{startItem}</span> to{" "}
        <span className="font-bold text-slate-900">{endItem}</span> of{" "}
        <span className="font-bold text-slate-900">{totalItems.toLocaleString()}</span>{" "}
        catalog records
      </div>

      <div className="flex items-center gap-2">
        <span className="text-slate-500 mr-2">
          Page <span className="font-bold text-slate-800">{currentPage}</span> of{" "}
          <span className="font-bold text-slate-800">{totalPages || 1}</span>
        </span>

        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || isLoading}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-slate-200 bg-slate-50 text-slate-700 font-medium hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || isLoading}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-slate-200 bg-slate-50 text-slate-700 font-medium hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
