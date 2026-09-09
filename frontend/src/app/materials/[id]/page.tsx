"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Boxes,
  Building2,
  FileCheck2,
  GitFork,
  History,
  ShieldCheck,
  Tag,
  Sparkles,
} from "lucide-react";

import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { materialService } from "@/services/materialService";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Material, MaterialMapping } from "@/types";

export default function MaterialDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [material, setMaterial] = useState<Material | null>(null);
  const [mappings, setMappings] = useState<MaterialMapping[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const mat = await materialService.getMaterialById(id);
      if (mat) {
        setMaterial(mat);
        if (mat.nationalMaterialCode) {
          const m = await materialService.getMappingsForNationalCode(mat.nationalMaterialCode);
          setMappings(m);
        }
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return <LoadingState message="Loading material specification master..." />;
  }

  if (!material) {
    return (
      <EmptyState
        title="Material Master Not Found"
        description={`No catalog record matching identifier "${id}" exists in the platform database.`}
        action={{
          label: "Back to Explorer",
          onClick: () => window.history.back(),
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top breadcrumb navigation */}
      <div>
        <Link
          href="/materials"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Material Explorer</span>
        </Link>
      </div>

      <PageHeader
        title={`${material.cpse} : ${material.legacyCode}`}
        description="Detailed technical parameter specification, enterprise lineage, and national mapping traceability."
      >
        <Link
          href={`/matches?search=${encodeURIComponent(material.legacyCode)}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-blue-700 text-white hover:bg-blue-800 shadow-sm transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Find AI Matches</span>
        </Link>
      </PageHeader>

      {/* Overview Card */}
      <div className="bg-white rounded-md border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-xs">
                {material.cpse}
              </span>
              <span className="font-mono text-base font-bold text-slate-900">
                {material.legacyCode}
              </span>
              <StatusBadge status={material.status} />
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-2 font-sans">
              {material.rawDescription}
            </h2>
          </div>

          <div className="flex flex-col sm:items-end bg-slate-50 p-3 rounded border border-slate-200 shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-500">
              National Material Code (NMC)
            </span>
            <span className="font-mono font-bold text-sm text-emerald-800 mt-0.5">
              {material.nationalMaterialCode || "Pending Standardization"}
            </span>
            {material.matchConfidence && (
              <div className="mt-1">
                <ConfidenceBadge score={material.matchConfidence} size="sm" />
              </div>
            )}
          </div>
        </div>

        {/* Normalized Description Block */}
        <div className="p-3.5 rounded bg-blue-50/60 border border-blue-200">
          <span className="text-[10px] uppercase font-bold text-blue-900 tracking-wider">
            Normalized Technical Description (Standardized Master)
          </span>
          <p className="text-xs text-blue-950 font-medium mt-1 leading-relaxed">
            {material.normalizedDescription || "Pending data/AI normalization. Raw catalog description preserved above."}
          </p>
        </div>

        {/* Core Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-xs">
          <div>
            <span className="text-slate-500 text-[11px] block">Material Category</span>
            <span className="font-semibold text-slate-800">{material.category}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[11px] block">Unit of Measure (UOM)</span>
            <span className="font-mono font-semibold text-slate-800">{material.uom}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[11px] block">Standard Reference</span>
            <span className="font-semibold text-slate-800">{material.standard || "N/A"}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[11px] block">Manufacturer / Brand</span>
            <span className="font-semibold text-slate-800">{material.manufacturer || "Multiple"}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[11px] block">Material Grade</span>
            <span className="font-semibold text-slate-800">{material.materialGrade || "Standard"}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[11px] block">Historical Spend (Simulated)</span>
            <span className="font-mono font-bold text-slate-900">
              {material.historicalSpend ? formatCurrency(material.historicalSpend) : "—"}
            </span>
          </div>
          <div>
            <span className="text-slate-500 text-[11px] block">Historical Volume</span>
            <span className="font-mono font-semibold text-slate-800">
              {material.historicalQty ? `${formatNumber(material.historicalQty)} ${material.uom}` : "—"}
            </span>
          </div>
          <div>
            <span className="text-slate-500 text-[11px] block">Last Catalog Sync</span>
            <span className="font-mono text-slate-600">{material.lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* Technical Attributes Table */}
      <div className="bg-white rounded-md border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3">
          Granular Technical Attributes
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Parameter Key</th>
                <th className="py-2.5 px-4">Parameter Name</th>
                <th className="py-2.5 px-4">Standardized Value</th>
                <th className="py-2.5 px-4">Unit</th>
                <th className="py-2.5 px-4">Normalization Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {material.attributes.map((attr) => (
                <tr key={attr.key} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-mono text-slate-500">{attr.key}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{attr.name}</td>
                  <td className="py-2.5 px-4 font-mono font-bold text-blue-700">{attr.value}</td>
                  <td className="py-2.5 px-4 text-slate-600">{attr.unit || "—"}</td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Validated
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cross-Enterprise Mapping & Traceability */}
      {material.nationalMaterialCode && (
        <div className="bg-white rounded-md border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Unified National Code Traceability Group
              </h3>
              <p className="text-xs text-slate-500">
                Other CPSE material items harmonized under this common National Material Code
              </p>
            </div>
            <Link
              href={`/national-materials/${material.nationalMaterialCode}`}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900"
            >
              View National Master Record →
            </Link>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
            <span className="font-mono font-bold text-emerald-800 text-sm">
              {material.nationalMaterialCode}
            </span>
            <span className="text-xs text-slate-600">
              {mappings.length} Participating CPSE Legacy Codes Mapped
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">CPSE</th>
                  <th className="py-2.5 px-4">Legacy Material Code</th>
                  <th className="py-2.5 px-4">Raw Catalog Description</th>
                  <th className="py-2.5 px-4">Relationship</th>
                  <th className="py-2.5 px-4">Confidence</th>
                  <th className="py-2.5 px-4">Sign-Off Officer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mappings.map((map) => (
                  <tr key={map.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-900">{map.cpse}</td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-blue-700">
                      {map.legacyMaterialCode}
                    </td>
                    <td className="py-2.5 px-4 max-w-sm text-slate-600 truncate">
                      {map.rawDescription}
                    </td>
                    <td className="py-2.5 px-4">
                      <StatusBadge status={map.relationship} />
                    </td>
                    <td className="py-2.5 px-4">
                      <ConfidenceBadge score={map.confidence} showLabel={false} size="sm" />
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 font-sans">{map.approvedBy}</td>
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
