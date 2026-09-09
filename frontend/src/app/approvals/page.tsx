"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  Filter,
  UserCheck,
  Sparkles,
} from "lucide-react";

import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { materialService } from "@/services/materialService";
import { Approval, ApprovalStatus } from "@/types";

export default function ApprovalQueuePage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const list = await materialService.getApprovals();
      setApprovals(list);
      setLoading(false);
    }
    load();
  }, []);

  const handleAction = async (id: string, status: ApprovalStatus) => {
    const reviewer = "S. Sharma (Chief Procurement Officer)";
    await materialService.updateApprovalStatus(id, status, reviewer);
    const updated = await materialService.getApprovals();
    setApprovals(updated);

    setActionAlert(
      status === "APPROVED"
        ? `Recommendation ${id} approved successfully! Traceable mapping recorded in National Master.`
        : `Recommendation ${id} rejected.`
    );
    setTimeout(() => setActionAlert(null), 3500);
  };

  const filteredApprovals = approvals.filter((a) => {
    if (filterStatus === "ALL") return true;
    return a.status === filterStatus;
  });

  const pendingCount = approvals.filter((a) => a.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Human-in-the-Loop Approval Queue"
        description="Mandatory governance gate: Authorized procurement officers verify, modify, or reject AI-recommended material consolidations."
      />

      {actionAlert && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-md text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionAlert}</span>
        </div>
      )}

      {/* Queue summary & filter controls */}
      <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Pending Officer Sign-offs:
          </span>
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            {pendingCount} records
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Filter Queue:</span>
          <div className="flex rounded border border-slate-200 overflow-hidden text-xs">
            {["ALL", "PENDING", "APPROVED", "REJECTED"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 font-medium transition-colors ${
                  filterStatus === st
                    ? "bg-blue-700 text-white font-bold"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Approvals Table */}
      {loading ? (
        <LoadingState message="Loading review queue..." />
      ) : filteredApprovals.length === 0 ? (
        <EmptyState
          title="No recommendations in this queue category"
          description="All AI recommendations for this filter category have been processed or none match."
          action={{ label: "View All Records", onClick: () => setFilterStatus("ALL") }}
        />
      ) : (
        <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">Queue ID</th>
                  <th className="py-3 px-4">Enterprise Source (A)</th>
                  <th className="py-3 px-4">Comparison Target (B)</th>
                  <th className="py-3 px-4">Relationship</th>
                  <th className="py-3 px-4">AI Score</th>
                  <th className="py-3 px-4">Proposed National Code</th>
                  <th className="py-3 px-4">Queue Status</th>
                  <th className="py-3 px-4">Auditor / Date</th>
                  <th className="py-3 px-4 text-right">Human Decision Gate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredApprovals.map((appr) => (
                  <tr key={appr.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {appr.id}
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-blue-700 px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-[10px]">
                          {appr.cpseA}
                        </span>
                        <span className="font-mono font-bold text-slate-900">{appr.legacyCodeA}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {appr.descriptionA}
                      </p>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-amber-700 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-[10px]">
                          {appr.cpseB}
                        </span>
                        <span className="font-mono font-bold text-slate-900">{appr.legacyCodeB}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {appr.descriptionB}
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={appr.relationship} />
                    </td>

                    <td className="py-3 px-4">
                      <ConfidenceBadge score={appr.confidence} showLabel={false} size="sm" />
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {appr.recommendedNmc}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={appr.status} />
                    </td>

                    <td className="py-3 px-4 text-[11px] text-slate-500">
                      <div>{appr.reviewer || "Awaiting Review"}</div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {appr.actionTakenAt || appr.createdAt}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {appr.status === "PENDING" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleAction(appr.id, "REJECTED")}
                            className="p-1.5 text-rose-700 hover:bg-rose-50 rounded border border-rose-200 transition-colors"
                            title="Reject Match"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAction(appr.id, "APPROVED")}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <Link
                            href={`/matches?id=${appr.matchId}`}
                            className="p-1.5 text-blue-700 hover:bg-blue-50 rounded border border-blue-200 transition-colors"
                            title="Inspect in Match Center"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      ) : (
                        <Link
                          href={`/matches?id=${appr.matchId}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-slate-50 px-2 py-1 rounded border border-slate-200"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Audit Record</span>
                        </Link>
                      )}
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
