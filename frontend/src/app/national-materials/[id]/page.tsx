"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Globe2,
  GitMerge,
  Building2,
  ShieldCheck,
  CheckCircle2,
  TrendingDown,
  Layers,
  ArrowDown,
} from "lucide-react";

import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { materialService } from "@/services/materialService";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { NationalMaterial, MaterialMapping } from "@/types";

export default function NationalMaterialDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [nmc, setNmc] = useState<NationalMaterial | null>(null);
  const [mappings, setMappings] = useState<MaterialMapping[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await materialService.getNationalMaterialById(id);
      if (data) {
        setNmc(data);
        const mapList = await materialService.getMappingsForNationalCode(data.nationalCode);
        setMappings(mapList);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return <LoadingState message="Resolving National Material Code Traceability Matrix..." />;
  }

  if (!nmc) {
    return (
      <EmptyState
        title="National Material Code Not Found"
        description={`Identifier "${id}" does not correspond to an approved national master record.`}
        action={{
          label: "Back to National Master",
          onClick: () => window.history.back(),
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/national-materials"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to National Material Master</span>
        </Link>
      </div>

      <PageHeader
        title={`National Material Code: ${nmc.nationalCode}`}
        description="Unified sovereign master record with unbroken, bidirectional mapping to participating CPSE legacy material systems."
        badge="Standardized Master"
      />

      {/* Hero specification card */}
      <div className="bg-white rounded-md border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded border border-emerald-200">
                {nmc.nationalCode}
              </span>
              <StatusBadge status={nmc.status} />
            </div>
            <p className="text-sm font-semibold text-slate-800 mt-2">
              {nmc.standardDescription}
            </p>
          </div>

          <div className="flex flex-col sm:items-end bg-slate-50 p-3 rounded border border-slate-200 shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-500">
              Aggregated Annual Spend
            </span>
            <span className="font-mono font-black text-lg text-slate-900 mt-0.5">
              {formatCurrency(nmc.totalHistoricalSpend)}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Volume: {formatNumber(nmc.totalAnnualQty)} Units
            </span>
          </div>
        </div>

        {/* Specifications Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
          {Object.entries(nmc.keySpecifications).map(([k, v]) => (
            <div key={k} className="p-2.5 bg-slate-50 rounded border border-slate-200">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">{k}</span>
              <span className="font-mono font-bold text-slate-800 mt-0.5 block">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sovereign Bidirectional Traceability Diagram */}
      <div className="bg-white rounded-md border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <GitMerge className="w-4 h-4 text-blue-600" />
              <span>Bidirectional Legacy Code Mapping Architecture</span>
            </h3>
            <p className="text-xs text-slate-500">
              Every participating CPSE keeps its ERP legacy code; the platform maps each back to this central NMC.
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200 font-bold">
            100% Traceable
          </span>
        </div>

        {/* Visual Graph / Convergence Tree */}
        <div className="p-6 bg-slate-900 text-white rounded-md border border-slate-800 flex flex-col items-center">
          {/* Top National Code Node */}
          <div className="bg-emerald-800/90 text-white px-5 py-3 rounded border border-emerald-400/50 shadow-md text-center max-w-md w-full">
            <span className="text-[10px] tracking-wider uppercase font-bold text-emerald-200 block">
              National Unified Master (NMC)
            </span>
            <span className="font-mono text-base font-black text-white mt-0.5 block">
              {nmc.nationalCode}
            </span>
          </div>

          <div className="my-3 flex flex-col items-center text-blue-400">
            <ArrowDown className="w-5 h-5 animate-bounce" />
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
              Preserved Bidirectional Links
            </span>
          </div>

          {/* Child CPSE Nodes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full mt-1">
            {mappings.map((map) => (
              <div
                key={map.id}
                className="bg-slate-800/90 p-3 rounded border border-slate-700 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400">{map.cpse}</span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      {map.confidence}% Match
                    </span>
                  </div>
                  <div className="font-mono font-bold text-xs text-white mt-1">
                    Legacy: {map.legacyMaterialCode}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                    {map.rawDescription}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[9px] text-slate-400">
                  <span>Auditor: {map.approvedBy}</span>
                  <span className="text-emerald-400 font-bold">ACTIVE</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Mappings Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Participating CPSE Legacy Material Matrix
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">CPSE Enterprise</th>
                <th className="py-3 px-4">Legacy Material Code</th>
                <th className="py-3 px-4 max-w-md">Catalog Raw Description</th>
                <th className="py-3 px-4">AI Relationship</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Approved Date & Officer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {mappings.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">{m.cpse}</td>
                  <td className="py-3 px-4 font-mono font-bold text-blue-700">
                    {m.legacyMaterialCode}
                  </td>
                  <td className="py-3 px-4 max-w-md text-slate-600">{m.rawDescription}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={m.relationship} />
                  </td>
                  <td className="py-3 px-4">
                    <ConfidenceBadge score={m.confidence} showLabel={false} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-[11px] text-slate-500">
                    {m.mappedAt} ({m.approvedBy})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
