"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Eye, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { materialService } from "@/services/materialService";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { NationalMaterial } from "@/types";

export default function NationalMaterialsPage() {
  const [nationalMaterials, setNationalMaterials] = useState<NationalMaterial[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 25;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await materialService.getNationalMaterialsPaginated({
          page,
          pageSize,
          query: debouncedSearch,
        });
        setNationalMaterials(res.items);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      } catch (err) {
        console.error("Failed to fetch national materials:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page, debouncedSearch]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="National Material Master (NMC)"
        description="Authoritative, unified catalog master establishing standardized National Material Codes mapped to all participating CPSE legacy systems in PostgreSQL."
      />

      {/* Control bar */}
      <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by National Code (e.g. NMC-100045) or Specification..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-900 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Non-destructive bidirectional CPSE mapping guaranteed</span>
        </div>
      </div>

      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingState message="Fetching standardized National Materials from PostgreSQL..." />
        ) : nationalMaterials.length === 0 ? (
          <EmptyState
            title="No National Materials Found"
            description="No standardized national codes match your query."
            action={{
              label: "Clear Search",
              onClick: () => {
                setSearch("");
                setDebouncedSearch("");
                setPage(1);
              },
            }}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4">National Material Code</th>
                    <th className="py-3 px-4 max-w-md">Standard Description</th>
                    <th className="py-3 px-4">Category / Group</th>
                    <th className="py-3 px-4">Key Standards</th>
                    <th className="py-3 px-4 text-center">CPSEs</th>
                    <th className="py-3 px-4 text-center">Legacy Codes</th>
                    <th className="py-3 px-4">Aggregated Spend</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Traceability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {nationalMaterials.map((nmc) => (
                    <tr key={nmc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                          {nmc.nationalCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-md">
                        <div className="font-medium text-slate-900 leading-snug">
                          {nmc.standardDescription}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{nmc.category}</td>
                      <td className="py-3 px-4 text-[11px] text-slate-600 font-mono">
                        {nmc.keySpecifications && Object.entries(nmc.keySpecifications).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(" | ")}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-blue-700 font-mono">
                        {nmc.participatingCpsesCount}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-800">
                        {formatNumber(nmc.legacyCodesCount)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-800">
                        {formatCurrency(nmc.totalHistoricalSpend)}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={nmc.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/national-materials/${encodeURIComponent(nmc.id)}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
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
