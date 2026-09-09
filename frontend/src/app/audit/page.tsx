"use client";

import React, { useEffect, useState } from "react";
import { History, ShieldCheck, Search } from "lucide-react";

import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { auditApi } from "@/lib/api/audit";
import { AuditLog } from "@/types";

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
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
        const res = await auditApi.getAuditLogs({
          page,
          pageSize,
          query: debouncedSearch,
        });
        setLogs(res.items);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      } catch (err) {
        console.error("Failed to load audit logs:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page, debouncedSearch]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Immutable Governance Audit Trail"
        description="Comprehensive auditable log of all human reviews, AI inferences, catalog ingestions, and National Code mappings in PostgreSQL."
        badge="Regulatory Compliance"
      />

      {/* Audit control bar */}
      <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail by User, Entity, or Action..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-900 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Every officer decision is non-repudiable and timestamped</span>
        </div>
      </div>

      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingState message="Loading sovereign audit events from database..." />
        ) : logs.length === 0 ? (
          <EmptyState
            title="No Audit Records Found"
            description="No logged governance events match your query."
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
                    <th className="py-3 px-4">Timestamp (IST)</th>
                    <th className="py-3 px-4">Officer / Agent</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target Entity / Mapping</th>
                    <th className="py-3 px-4 max-w-xs">Old Value</th>
                    <th className="py-3 px-4 max-w-xs">New Value</th>
                    <th className="py-3 px-4">Decision</th>
                    <th className="py-3 px-4">Subsystem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {log.timestamp}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{log.user}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {log.role}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                        {log.entity}
                      </td>

                      <td className="py-3 px-4 max-w-xs text-slate-600 truncate font-mono text-[11px]">
                        {log.oldValue}
                      </td>

                      <td className="py-3 px-4 max-w-xs font-semibold text-slate-900 truncate font-mono text-[11px]">
                        {log.newValue}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            log.decision === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : log.decision === "REJECTED"
                              ? "bg-red-100 text-red-800 border border-red-300"
                              : "bg-blue-100 text-blue-800 border border-blue-300"
                          }`}
                        >
                          {log.decision}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 font-medium">
                        {log.source}
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
