"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, RefreshCw, CheckCircle2, AlertCircle, ArrowRight, ShieldAlert } from "lucide-react";

import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingState } from "@/components/ui/LoadingState";
import { materialService } from "@/services/materialService";
import { formatNumber } from "@/lib/utils";
import { CPSE } from "@/types";

export default function CpsesPage() {
  const [cpses, setCpses] = useState<CPSE[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const list = await materialService.getCpses();
      setCpses(list);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Participating CPSE Enterprises"
        description="Monitoring federated catalog synchronization, master item ingestion, and harmonization progress across Central Public Sector Enterprises."
      />

      {/* Disclaimers & Integrity Note */}
      <div className="p-3.5 bg-amber-50 rounded-md border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Synthetic Demonstrator Notice:</span> Data shown below simulates master catalog metrics from key Indian Maharatna and Navratna enterprises for SIH evaluation. No live connection to sovereign ERP / SAP instances is claimed or required in Phase 2.
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading CPSE enterprise telemetry..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cpses.map((cpse) => (
            <div
              key={cpse.id}
              className="bg-white rounded-md border border-slate-200 p-5 shadow-sm space-y-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-black text-xs">
                      {cpse.code}
                    </span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                      {cpse.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 mt-1.5">
                    {cpse.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">{cpse.ministry}</p>
                </div>
                <StatusBadge status={cpse.status} size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                    Imported Items
                  </span>
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    {formatNumber(cpse.materialsImported)}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                    Harmonized (NMC)
                  </span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    {formatNumber(cpse.materialsStandardized)}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                    Match Candidates
                  </span>
                  <span className="font-mono font-bold text-amber-700 text-sm">
                    {formatNumber(cpse.matchCandidates)}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                    Approved Maps
                  </span>
                  <span className="font-mono font-bold text-blue-700 text-sm">
                    {formatNumber(cpse.approvedMappings)}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Sync: {cpse.lastSynchronization}</span>
                <Link
                  href={`/materials?cpse=${cpse.code}`}
                  className="font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-0.5"
                >
                  View Catalog <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
