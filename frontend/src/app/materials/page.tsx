"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Filter, ArrowUpDown, ChevronRight, Eye } from "lucide-react";

import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { materialService } from "@/services/materialService";
import { Material } from "@/types";

export default function MaterialExplorerPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCpse, setSelectedCpse] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await materialService.getMaterials({
        query: searchQuery,
        cpse: selectedCpse,
        category: selectedCategory,
        status: selectedStatus,
      });
      setMaterials(data);
      setLoading(false);
    }
    load();
  }, [searchQuery, selectedCpse, selectedCategory, selectedStatus]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCpse("ALL");
    setSelectedCategory("ALL");
    setSelectedStatus("ALL");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Material Master Explorer"
        description="Search, filter, and inspect legacy enterprise material masters and their harmonized national mappings."
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
              onChange={(e) => setSelectedCpse(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">All CPSEs (IOCL, NTPC...)</option>
              <option value="IOCL">IOCL</option>
              <option value="NTPC">NTPC</option>
              <option value="SAIL">SAIL</option>
              <option value="HPCL">HPCL</option>
              <option value="BPCL">BPCL</option>
              <option value="CPCL">CPCL</option>
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">All Categories</option>
              <option value="Bearing">Bearing</option>
              <option value="Valve">Valve</option>
              <option value="Fastener">Fastener</option>
              <option value="Electrical">Electrical</option>
              <option value="Rotating Equipment">Rotating Equipment</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">All Statuses</option>
              <option value="STANDARDIZED">Standardized</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="UNMATCHED">Unmatched</option>
            </select>

            {(searchQuery || selectedCpse !== "ALL" || selectedCategory !== "ALL" || selectedStatus !== "ALL") && (
              <button
                onClick={resetFilters}
                className="text-xs text-blue-700 hover:text-blue-900 font-semibold px-2 py-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>Showing <strong>{materials.length}</strong> catalog records</span>
          <span className="font-mono text-[11px]">Database View: Read-Only Master</span>
        </div>
      </div>

      {/* Materials Table */}
      {loading ? (
        <LoadingState message="Filtering materials..." />
      ) : materials.length === 0 ? (
        <EmptyState
          title="No materials match your filter criteria"
          description="Try broadening your search query or selecting 'All CPSEs' to view catalog entries."
          action={{ label: "Reset Filters", onClick: resetFilters }}
        />
      ) : (
        <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">CPSE</th>
                  <th className="py-3 px-4">Legacy Code</th>
                  <th className="py-3 px-4 max-w-md">Item Description (Raw & Normalized)</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">UOM</th>
                  <th className="py-3 px-4">National Material Code</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {materials.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {m.cpse}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">
                      {m.legacyCode}
                    </td>
                    <td className="py-3 px-4 max-w-md">
                      <div className="font-medium text-slate-900 leading-snug">
                        {m.rawDescription}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate font-sans">
                        <span className="font-semibold text-slate-400">Norm:</span> {m.normalizedDescription}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{m.category}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{m.uom}</td>
                    <td className="py-3 px-4 font-mono font-semibold">
                      {m.nationalMaterialCode ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {m.nationalMaterialCode}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="py-3 px-4">
                      {m.matchConfidence ? (
                        <ConfidenceBadge score={m.matchConfidence} showLabel={false} size="sm" />
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/materials/${m.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 px-2.5 py-1 rounded border border-blue-200"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
