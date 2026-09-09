"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ChevronRight, Eye, RefreshCw } from "lucide-react";

import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { materialService } from "@/services/materialService";
import { Material } from "@/types";

export default function MaterialExplorerPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 25;

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCpse, setSelectedCpse] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await materialService.getMaterialsPaginated({
          page,
          pageSize,
          query: debouncedQuery,
          cpse: selectedCpse,
          category: selectedCategory,
          status: selectedStatus,
        });
        setMaterials(res.items);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      } catch (err) {
        console.error("Failed to fetch materials:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page, debouncedQuery, selectedCpse, selectedCategory, selectedStatus]);

  const resetFilters = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    setSelectedCpse("ALL");
    setSelectedCategory("ALL");
    setSelectedStatus("ALL");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Material Master Explorer"
        description="Search, filter, and inspect legacy enterprise material masters and their harmonized national mappings in PostgreSQL."
      />

      {/* Filter and Search Controls Bar */}
      <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Legacy Code, Description, National Code (e.g., 6205, SS304, BRG)..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-900 placeholder-slate-400 font-sans"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            {/* CPSE Filter */}
            <select
              value={selectedCpse}
              onChange={(e) => {
                setSelectedCpse(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">All CPSEs</option>
              <option value="IOCL">IOCL (Indian Oil)</option>
              <option value="NTPC">NTPC Limited</option>
              <option value="SAIL">SAIL (Steel Authority)</option>
              <option value="BHEL">BHEL (Heavy Electricals)</option>
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">All Categories</option>
              <option value="Valves">Valves</option>
              <option value="Pipes & Fittings">Pipes & Fittings</option>
              <option value="Fasteners">Fasteners</option>
              <option value="Electrical">Electrical</option>
              <option value="Bearings">Bearings</option>
              <option value="Gaskets & Seals">Gaskets & Seals</option>
              <option value="Safety">Safety</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">All Statuses</option>
              <option value="STANDARDIZED">Harmonized (NMC)</option>
              <option value="PENDING_REVIEW">Pending Review</option>
            </select>

            {(searchQuery || selectedCpse !== "ALL" || selectedCategory !== "ALL" || selectedStatus !== "ALL") && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-slate-500 hover:text-slate-800 underline px-2 py-1 font-medium"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Materials Results Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingState message="Fetching master catalog records from PostgreSQL..." />
        ) : materials.length === 0 ? (
          <EmptyState
            title="No Material Masters Found"
            description="No items match your active search and enterprise filter criteria."
            action={{
              label: "Reset All Filters",
              onClick: resetFilters,
            }}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4">CPSE</th>
                    <th className="py-3 px-4">Legacy Code</th>
                    <th className="py-3 px-4 max-w-md">Description</th>
                    <th className="py-3 px-4">Category / Group</th>
                    <th className="py-3 px-4">UOM</th>
                    <th className="py-3 px-4">National Code (NMC)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {materials.map((mat) => (
                    <tr key={mat.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold px-2 py-0.5 rounded text-[11px] bg-blue-50 text-blue-800 border border-blue-200">
                          {mat.cpse}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {mat.legacyCode}
                      </td>

                      <td className="py-3 px-4 max-w-md">
                        <div className="font-medium text-slate-900 leading-snug line-clamp-2">
                          {mat.rawDescription}
                        </div>
                        {mat.specifications && Object.keys(mat.specifications).length > 0 && (
                          <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-1 font-mono">
                            {Object.entries(mat.specifications)
                              .slice(0, 2)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(" | ")}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {mat.category}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600">
                        {mat.uom}
                      </td>

                      <td className="py-3 px-4">
                        {mat.nationalMaterialCode ? (
                          <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {mat.nationalMaterialCode}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px] italic">
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <StatusBadge status={mat.status} size="sm" />
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/materials/${encodeURIComponent(mat.id)}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              pageSize={pageSize}
              onPageChange={(p) => setPage(p)}
              isLoading={loading}
            />
          </>
        )}
      </div>
    </div>
  );
}
