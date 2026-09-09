"use client";

import React, { useEffect, useState } from "react";
import {
  Boxes,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Building2,
  Clock,
  TrendingUp,
  FileCheck2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import { PageHeader } from "@/components/ui/PageHeader";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { LoadingState } from "@/components/ui/LoadingState";
import { materialService } from "@/services/materialService";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { MetricSummary, CPSE, MaterialMatch } from "@/types";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<MetricSummary | null>(null);
  const [cpses, setCpses] = useState<CPSE[]>([]);
  const [matches, setMatches] = useState<MaterialMatch[]>([]);
  const [distribution, setDistribution] = useState<{ name: string; value: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [m, c, mat, dist] = await Promise.all([
        materialService.getMetrics(),
        materialService.getCpses(),
        materialService.getMatches(),
        materialService.getRelationshipDistribution(),
      ]);
      setMetrics(m);
      setCpses(c);
      setMatches(mat);
      setDistribution(dist);
      setLoading(false);
    }
    load();
  }, []);

  if (loading || !metrics) {
    return <LoadingState message="Initializing National Master Dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="National Material Master Dashboard"
        description="Cross-CPSE material deduplication, sovereign codification, and procurement intelligence overview."
        badge="Live Telemetry (Mock)"
      >
        <Link
          href="/matches"
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded bg-blue-700 text-white hover:bg-blue-800 shadow-sm transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Launch AI Match Center</span>
        </Link>
      </PageHeader>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total CPSE Materials"
          value={formatNumber(metrics.totalMaterials)}
          subtext="Cataloged across 8 enterprises"
          icon={Boxes}
        />
        <MetricCard
          title="Materials Analyzed"
          value={formatNumber(metrics.materialsAnalyzed)}
          subtext="93.6% pipeline throughput"
          icon={Layers}
          trend="+4.2% today"
        />
        <MetricCard
          title="Duplicate Candidates"
          value={formatNumber(metrics.duplicateCandidates)}
          subtext="Identical / Equivalent pairs"
          icon={AlertTriangle}
          badge="High Priority"
        />
        <MetricCard
          title="Approved Harmonizations"
          value={formatNumber(metrics.approvedMatches)}
          subtext="Verified by human reviewers"
          icon={CheckCircle2}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="National Materials (NMC)"
          value={formatNumber(metrics.nationalMaterials)}
          subtext="Standardized master records"
          icon={FileCheck2}
        />
        <MetricCard
          title="Connected CPSEs"
          value={metrics.cpsesConnected}
          subtext="Maharatna & Navratna peers"
          icon={Building2}
        />
        <MetricCard
          title="Pending Reviews"
          value={metrics.pendingReviews}
          subtext="Awaiting officer sign-off"
          icon={Clock}
          badge="Action Req."
        />
        <MetricCard
          title="Rationalizable Codes"
          value={formatNumber(metrics.potentiallyRationalizableCodes)}
          subtext="Redundancy elimination"
          icon={TrendingUp}
          trend="~18.4k codes"
        />
      </div>

      {/* Rationalization Value Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-md p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-blue-800">
        <div>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-blue-300">
            Sovereign Value Dividend (Simulated)
          </span>
          <h2 className="text-xl font-bold mt-0.5">
            Cross-Enterprise Procurement Harmonization
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            By collapsing {formatNumber(metrics.potentiallyRationalizableCodes)} duplicate and near-duplicate material codes into unified National Material Codes (NMC), participating CPSEs achieve direct spend transparency and cross-enterprise contract leverage.
          </p>
        </div>
        <div className="flex flex-col sm:items-end shrink-0 bg-white/10 p-3 rounded border border-white/10">
          <span className="text-[10px] text-blue-200 uppercase font-semibold">
            Estimated Spend Impact
          </span>
          <span className="text-2xl font-black font-mono text-emerald-300">
            {formatCurrency(metrics.estimatedConsolidationSavingsInr)}
          </span>
          <span className="text-[10px] text-slate-300">Simulated demand aggregation</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Relationship Distribution Pie */}
        <div className="bg-white rounded-md border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Material Relationship Distribution
              </h3>
              <p className="text-xs text-slate-500">
                AI classification breakdown across candidate item pairs
              </p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              5 Target Classes
            </span>
          </div>

          <div className="h-64 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => [formatNumber(val), "Pairs"]}
                  contentStyle={{ fontSize: "12px", borderRadius: "4px" }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CPSE Material Ingestion & Standardization Bar */}
        <div className="bg-white rounded-md border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                CPSE Material Ingestion & Standardization
              </h3>
              <p className="text-xs text-slate-500">
                Catalog volume and harmonized records per enterprise
              </p>
            </div>
            <Link
              href="/cpses"
              className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-64 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={cpses.slice(0, 6)}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="code" tick={{ fontSize: 11, fill: "#475569" }} />
                <YAxis tick={{ fontSize: 11, fill: "#475569" }} />
                <Tooltip
                  formatter={(val: number) => [formatNumber(val), "Materials"]}
                  contentStyle={{ fontSize: "12px", borderRadius: "4px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Bar dataKey="materialsImported" name="Imported" fill="#94a3b8" radius={[2, 2, 0, 0]} />
                <Bar dataKey="materialsStandardized" name="Harmonized" fill="#2563eb" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Rationalization Before/After Workflow Diagram */}
      <div className="bg-white rounded-md border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-1">
          Catalog Rationalization Architecture (Before → After)
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Visualizing how disparate CPSE legacy item master codes converge into traceable Common National Material Codes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-md border border-slate-200">
          <div className="bg-white p-3.5 rounded border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Input: Disparate CPSEs</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 font-mono">Isolated Masters</span>
            </div>
            <div className="space-y-2 text-xs font-mono">
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="font-bold text-blue-700">IOCL:</span> BRG-00142
                <div className="text-[11px] text-slate-500 font-sans mt-0.5">SKF Deep Groove Ball Bearing 6205 2RS</div>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="font-bold text-amber-700">NTPC:</span> MAT-77891
                <div className="text-[11px] text-slate-500 font-sans mt-0.5">6205-2RS SKF Ball Bearing C3</div>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="font-bold text-emerald-700">SAIL:</span> 45000621
                <div className="text-[11px] text-slate-500 font-sans mt-0.5">BRG BALL S/R 25X52X15 6205 2RS</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center items-center text-center p-4 bg-blue-50/60 rounded border border-blue-200">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center mb-2 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
              AI Matching & Attribute Resolution
            </h4>
            <p className="text-[11px] text-blue-700 mt-1 max-w-xs">
              Semantic embeddings + ISO/DIN dimensional vector comparison calculate 98.4% DUPLICATE relationship confidence.
            </p>
            <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 bg-white px-2.5 py-1 rounded border border-blue-200">
              Human Reviewer: APPROVED
            </div>
          </div>

          <div className="bg-white p-3.5 rounded border border-emerald-300 bg-emerald-50/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-emerald-800 uppercase">Result: Traceable National Code</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold">Standardized</span>
            </div>
            <div className="p-3 bg-white rounded border border-emerald-200 shadow-sm space-y-2">
              <div className="text-xs font-mono font-bold text-emerald-800 text-sm">
                NMC-BRG-6205-2RS
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                DEEP GROOVE BALL BEARING, 25X52X15 MM, 2RS SEALS, C3, ISO 15 / DIN 625
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>3 CPSEs Mapped</span>
                <span className="text-emerald-700 font-bold">Traceability 100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent AI Recommendations Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Recent AI Match Recommendations
            </h3>
            <p className="text-xs text-slate-500">
              Candidate material clusters awaiting or finalized in human review queue
            </p>
          </div>
          <Link
            href="/approvals"
            className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
          >
            Review Queue <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Match ID</th>
                <th className="py-3 px-4">Material Pair (CPSE & Legacy Code)</th>
                <th className="py-3 px-4">Relationship</th>
                <th className="py-3 px-4">AI Confidence</th>
                <th className="py-3 px-4">Recommended NMC</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {matches.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-slate-900">{m.id}</td>
                  <td className="py-3 px-4 max-w-sm">
                    <div className="font-semibold text-slate-900">
                      <span className="text-blue-700">{m.materialA.cpse}</span> ({m.materialA.legacyCode}) ↔{" "}
                      <span className="text-amber-700">{m.materialB.cpse}</span> ({m.materialB.legacyCode})
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {m.materialA.rawDescription}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={m.relationship} />
                  </td>
                  <td className="py-3 px-4">
                    <ConfidenceBadge score={m.confidence} showLabel={false} />
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                    {m.recommendedNmc}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/matches?id=${m.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
                    >
                      Inspect Match <ArrowRight className="w-3 h-3" />
                    </Link>
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
