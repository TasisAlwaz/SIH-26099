"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingDown,
  Layers,
  PieChart as PieIcon,
  Scale,
  Sparkles,
  Building2,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";

import { PageHeader } from "@/components/ui/PageHeader";
import { MetricCard } from "@/components/ui/MetricCard";
import { LoadingState } from "@/components/ui/LoadingState";
import { materialService } from "@/services/materialService";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { ProcurementRecord, CPSE } from "@/types";

export default function AnalyticsPage() {
  const [procurement, setProcurement] = useState<ProcurementRecord[]>([]);
  const [cpses, setCpses] = useState<CPSE[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [pList, cList] = await Promise.all([
        materialService.getProcurementRecords(),
        materialService.getCpses(),
      ]);
      setProcurement(pList);
      setCpses(cList);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <LoadingState message="Aggregating cross-CPSE procurement intelligence..." />;
  }

  const confidenceBins = [
    { range: "95-100%", count: 4820, fill: "#059669" },
    { range: "90-94%", count: 3410, fill: "#10b981" },
    { range: "80-89%", count: 2950, fill: "#f59e0b" },
    { range: "70-79%", count: 1840, fill: "#6366f1" },
    { range: "< 70%", count: 1830, fill: "#f43f5e" },
  ];

  const rationalizationTrends = [
    { month: "Apr 26", legacy: 84320, rationalized: 84320 },
    { month: "May 26", legacy: 84320, rationalized: 76500 },
    { month: "Jun 26", legacy: 84320, rationalized: 69200 },
    { month: "Jul 26", legacy: 84320, rationalized: 62400 },
    { month: "Aug 26", legacy: 84320, rationalized: 54100 },
    { month: "Sep 26 (Current)", legacy: 84320, rationalized: 46800 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Procurement & Rationalization Analytics"
        description="Cross-enterprise spend harmonization, material redundancy reduction curves, and AI confidence spectrum."
        badge="Enterprise Intelligence"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Consolidated Spend Evaluated"
          value={formatCurrency(2150000000)} // 215 Crore
          subtext={`Across ${cpses.length || 4} CPSE item masters`}
          icon={BarChart3}
        />
        <MetricCard
          title="Harmonization Dividend (Simulated)"
          value={formatCurrency(230700000)} // ~23.07 Crore
          subtext="Volume aggregation + price parity"
          icon={TrendingDown}
          trend="+10.7% efficiency"
        />
        <MetricCard
          title="Overall Code Reduction Ratio"
          value="72.4%"
          subtext="From 84k legacy codes to 23k NMC"
          icon={Layers}
          badge="High Impact"
        />
      </div>

      {/* Charts Grid 1: Procurement Aggregation & Code Reduction by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Code Rationalization by Industrial Category
              </h3>
              <p className="text-[11px] text-slate-500">
                Comparing disparate CPSE legacy codes vs consolidated National Codes (NMC)
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
              Legacy vs NMC
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={procurement}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: "#475569" }} />
                <YAxis tick={{ fontSize: 10, fill: "#475569" }} />
                <Tooltip
                  formatter={(val: number) => [formatNumber(val), "Codes"]}
                  contentStyle={{ fontSize: "11px", borderRadius: "4px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="legacyCodesCount" name="Legacy CPSE Codes" fill="#94a3b8" radius={[2, 2, 0, 0]} />
                <Bar dataKey="consolidatedNmcCount" name="Consolidated NMC" fill="#0284c7" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spend by Category */}
        <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Aggregated Procurement Spend & Potential Benefit
              </h3>
              <p className="text-[11px] text-slate-500">
                Category spend volume and projected savings from cross-CPSE rate parity
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold">
              INR Millions
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={procurement.map((p) => ({
                  ...p,
                  totalSpendCr: p.totalSpendInr / 10000000,
                  benefitCr: p.estimatedHarmonizationBenefitInr / 10000000,
                }))}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: "#475569" }} />
                <YAxis tick={{ fontSize: 10, fill: "#475569" }} />
                <Tooltip
                  formatter={(val: number) => [`₹${val.toFixed(1)} Cr`, "Value"]}
                  contentStyle={{ fontSize: "11px", borderRadius: "4px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="totalSpendCr" name="Annual Spend (₹ Cr)" fill="#334e68" radius={[2, 2, 0, 0]} />
                <Bar dataKey="benefitCr" name="Projected Dividend (₹ Cr)" fill="#10b981" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Grid 2: Confidence Distribution & Rationalization Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confidence Spread */}
        <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                AI Confidence Spectrum Distribution
              </h3>
              <p className="text-[11px] text-slate-500">
                Candidate pairs grouped by model confidence thresholds
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              14,850 Pairs
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={confidenceBins} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: "#475569" }} />
                <YAxis tick={{ fontSize: 10, fill: "#475569" }} />
                <Tooltip
                  formatter={(val: number) => [formatNumber(val), "Pairs"]}
                  contentStyle={{ fontSize: "11px", borderRadius: "4px" }}
                />
                <Bar dataKey="count" name="Candidate Pairs" fill="#6366f1" radius={[2, 2, 0, 0]}>
                  {confidenceBins.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rationalization Trend Curve */}
        <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Active SKU Count Rationalization Curve
              </h3>
              <p className="text-[11px] text-slate-500">
                Progressive consolidation of duplicate catalogs into unified master records
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold">
              -44.5% Active SKUs
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={rationalizationTrends}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#475569" }} />
                <YAxis tick={{ fontSize: 10, fill: "#475569" }} />
                <Tooltip
                  formatter={(val: number) => [formatNumber(val), "Active Codes"]}
                  contentStyle={{ fontSize: "11px", borderRadius: "4px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Area
                  type="monotone"
                  dataKey="legacy"
                  name="Unconsolidated Baseline"
                  stroke="#94a3b8"
                  fill="#f1f5f9"
                />
                <Area
                  type="monotone"
                  dataKey="rationalized"
                  name="Harmonized Active Codes"
                  stroke="#2563eb"
                  fill="#dbeafe"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
