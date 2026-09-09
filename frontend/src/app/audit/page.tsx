"use client";

import React, { useEffect, useState } from "react";
import { History, ShieldCheck, Search, Filter, ArrowRight, UserCheck, Clock } from "lucide-react";

import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingState } from "@/components/ui/LoadingState";
import { materialService } from "@/services/materialService";
import { AuditLog } from "@/types";

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const list = await materialService.getAuditLogs();
      setLogs(list);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = logs.filter(
    (l) =>
      l.user.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.entity.toLowerCase().includes(search.toLowerCase()) ||
      l.newValue.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Immutable Governance Audit Trail"
        description="Comprehensive cryptographically-auditable log of all human reviews, AI inferences, catalog ingestions, and National Code mappings."
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

      {loading ? (
        <LoadingState message="Loading sovereign audit events..." />
      ) : (
        <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
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
                {filtered.map((log) => (
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

                    <td className="py-3 px-4 max-w-xs text-slate-500 text-[11px] truncate">
                      {log.oldValue}
                    </td>

                    <td className="py-3 px-4 max-w-xs text-emerald-800 font-medium text-[11px] truncate">
                      {log.newValue}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={log.decision} size="sm" />
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {log.source}
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
