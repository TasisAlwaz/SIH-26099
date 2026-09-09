"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Edit3,
  Cpu,
  Check,
  AlertCircle,
  Loader2,
  Scale,
} from "lucide-react";

import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { LoadingState } from "@/components/ui/LoadingState";
import { materialService } from "@/services/materialService";
import { MaterialMatch, Material, ApprovalStatus } from "@/types";

function MatchCenterContent() {
  const searchParams = useSearchParams();
  const initialMatchId = searchParams.get("id");

  const [matches, setMatches] = useState<MaterialMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MaterialMatch | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);
  const [customMatAId, setCustomMatAId] = useState("");
  const [customMatBId, setCustomMatBId] = useState("");
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [mList, matList] = await Promise.all([
        materialService.getMatches(),
        materialService.getMaterials(),
      ]);
      setMatches(mList);
      setAllMaterials(matList);

      const target = initialMatchId ? mList.find((m) => m.id === initialMatchId) : mList[0];
      setSelectedMatch(target || mList[0] || null);
      if (mList[0]) {
        setCustomMatAId(mList[0].materialA.id);
        setCustomMatBId(mList[0].materialB.id);
      }
      setLoading(false);
    }
    load();
  }, [initialMatchId]);

  const handleSelectMatch = (m: MaterialMatch) => {
    setSelectedMatch(m);
    setCustomMatAId(m.materialA.id);
    setCustomMatBId(m.materialB.id);
    setActionSuccessMessage(null);
  };

  const handleRunAnalysis = async () => {
    if (!customMatAId || !customMatBId) return;
    setAnalyzing(true);
    setActionSuccessMessage(null);

    // Simulated short AI inference cycle
    setTimeout(async () => {
      const result = await materialService.analyzePair(customMatAId, customMatBId);
      setSelectedMatch(result);
      const updatedList = await materialService.getMatches();
      setMatches(updatedList);
      setAnalyzing(false);
    }, 650);
  };

  const handleApprovalAction = async (status: ApprovalStatus) => {
    if (!selectedMatch) return;
    const reviewer = "S. Sharma (Chief Procurement Officer)";
    await materialService.updateApprovalStatus(
      selectedMatch.id,
      status,
      reviewer,
      status === "REJECTED" ? "Rejected due to technical attribute incompatibility" : undefined
    );

    setSelectedMatch((prev) => (prev ? { ...prev, status, reviewedBy: reviewer } : null));
    const updatedList = await materialService.getMatches();
    setMatches(updatedList);

    setActionSuccessMessage(
      status === "APPROVED"
        ? `Match Approved! Consolidated mapping established to ${selectedMatch.recommendedNmc}.`
        : `Match marked as ${status}. Records will remain segregated in Material Master.`
    );

    setTimeout(() => {
      setActionSuccessMessage(null);
    }, 4000);
  };

  if (loading || !selectedMatch) {
    return <LoadingState message="Initializing AI Material Inference Engine..." />;
  }

  const matA = selectedMatch.materialA;
  const matB = selectedMatch.materialB;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Match & Deduplication Center"
        description="Core cognitive engine: Multi-attribute engineering comparison, deterministic relationship classification, and explainable AI recommendations."
        badge="Phase 2: Mock Engine"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2 py-1 rounded bg-amber-50 text-amber-900 border border-amber-200">
            Engine: Heuristic Mock v0.9
          </span>
        </div>
      </PageHeader>

      {/* Interactive Candidate Selector & Custom Pair Runner */}
      <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Select Material Pair for Inference
            </h3>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Presets:</span>
            {matches.slice(0, 4).map((m) => (
              <button
                key={m.id}
                onClick={() => handleSelectMatch(m)}
                className={`px-2.5 py-1 rounded font-mono text-[11px] border transition-colors whitespace-nowrap ${
                  selectedMatch.id === m.id
                    ? "bg-blue-700 text-white border-blue-700 font-bold"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {m.materialA.cpse}:{m.materialA.legacyCode} ↔ {m.materialB.cpse}:{m.materialB.legacyCode}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-100 items-center">
          <div className="sm:col-span-5">
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">
              Material A (Enterprise Source)
            </label>
            <select
              value={customMatAId}
              onChange={(e) => setCustomMatAId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 font-medium"
            >
              {allMaterials.map((m) => (
                <option key={m.id} value={m.id}>
                  [{m.cpse}] {m.legacyCode} — {m.rawDescription.slice(0, 45)}...
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 text-center flex flex-col items-center justify-center">
            <span className="text-[11px] font-bold text-slate-400">VS</span>
            <button
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="mt-1 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Matching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyze Match</span>
                </>
              )}
            </button>
          </div>

          <div className="sm:col-span-5">
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">
              Material B (Comparison Candidate)
            </label>
            <select
              value={customMatBId}
              onChange={(e) => setCustomMatBId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 font-medium"
            >
              {allMaterials.map((m) => (
                <option key={m.id} value={m.id}>
                  [{m.cpse}] {m.legacyCode} — {m.rawDescription.slice(0, 45)}...
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {actionSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-md text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Side-by-Side Comparison Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Material A Card */}
        <div className="bg-white rounded-md border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-xs">
                {matA.cpse}
              </span>
              <span className="font-mono text-xs font-bold text-slate-800">
                Legacy: {matA.legacyCode}
              </span>
            </div>
            <span className="text-[11px] text-slate-500">Source CPSE Master</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Raw Catalog Description</span>
            <p className="text-xs font-bold text-slate-900 mt-0.5">{matA.rawDescription}</p>
          </div>

          <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500">Normalized Specification</span>
            <p className="text-xs text-slate-800 mt-0.5">{matA.normalizedDescription}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div>
              <span className="text-slate-400 text-[11px]">Category:</span>{" "}
              <span className="font-semibold text-slate-800">{matA.category}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px]">UOM:</span>{" "}
              <span className="font-mono font-semibold text-slate-800">{matA.uom}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px]">Manufacturer:</span>{" "}
              <span className="font-semibold text-slate-800">{matA.manufacturer || "Multiple"}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px]">Standard:</span>{" "}
              <span className="font-semibold text-slate-800">{matA.standard || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Material B Card */}
        <div className="bg-white rounded-md border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-xs">
                {matB.cpse}
              </span>
              <span className="font-mono text-xs font-bold text-slate-800">
                Legacy: {matB.legacyCode}
              </span>
            </div>
            <span className="text-[11px] text-slate-500">Candidate Peer Master</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Raw Catalog Description</span>
            <p className="text-xs font-bold text-slate-900 mt-0.5">{matB.rawDescription}</p>
          </div>

          <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500">Normalized Specification</span>
            <p className="text-xs text-slate-800 mt-0.5">{matB.normalizedDescription}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div>
              <span className="text-slate-400 text-[11px]">Category:</span>{" "}
              <span className="font-semibold text-slate-800">{matB.category}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px]">UOM:</span>{" "}
              <span className="font-mono font-semibold text-slate-800">{matB.uom}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px]">Manufacturer:</span>{" "}
              <span className="font-semibold text-slate-800">{matB.manufacturer || "Multiple"}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px]">Standard:</span>{" "}
              <span className="font-semibold text-slate-800">{matB.standard || "N/A"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Inference Verdict & Multi-Vector Breakdown */}
      <div className="bg-white rounded-md border border-slate-200 p-5 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Deterministic AI Classification
            </span>
            <div className="flex items-center gap-3 mt-1">
              <StatusBadge status={selectedMatch.relationship} size="md" />
              <ConfidenceBadge score={selectedMatch.confidence} size="lg" />
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded border border-slate-200 sm:text-right">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">
              Recommended National Material Code
            </span>
            <span className="font-mono font-bold text-emerald-800 text-sm">
              {selectedMatch.recommendedNmc}
            </span>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Review Status: <strong>{selectedMatch.status}</strong>
            </div>
          </div>
        </div>

        {/* 5-Vector Similarity Signal Bars */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-800 mb-3 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-blue-600" />
            <span>Multi-Vector Match Signal Breakdown</span>
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">Description</span>
              <span className="font-mono text-base font-bold text-slate-800">
                {selectedMatch.breakdown.descriptionSimilarity}%
              </span>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full"
                  style={{ width: `${selectedMatch.breakdown.descriptionSimilarity}%` }}
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">Specification</span>
              <span className="font-mono text-base font-bold text-slate-800">
                {selectedMatch.breakdown.specificationSimilarity}%
              </span>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full"
                  style={{ width: `${selectedMatch.breakdown.specificationSimilarity}%` }}
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">Attributes</span>
              <span className="font-mono text-base font-bold text-slate-800">
                {selectedMatch.breakdown.attributeSimilarity}%
              </span>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full"
                  style={{ width: `${selectedMatch.breakdown.attributeSimilarity}%` }}
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">UOM Compatibility</span>
              <span className="font-mono text-base font-bold text-slate-800">
                {selectedMatch.breakdown.uomCompatibility}%
              </span>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full"
                  style={{ width: `${selectedMatch.breakdown.uomCompatibility}%` }}
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">Manufacturer</span>
              <span className="font-mono text-base font-bold text-slate-800">
                {selectedMatch.breakdown.manufacturerMatch}%
              </span>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full"
                  style={{ width: `${selectedMatch.breakdown.manufacturerMatch}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Explainability Section: WHY THIS MATCH? */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-md bg-emerald-50/60 border border-emerald-200">
            <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5 mb-2">
              <Check className="w-4 h-4 text-emerald-700" />
              <span>Why This Match? (Explainable AI Rationale)</span>
            </h5>
            <ul className="space-y-1.5 text-xs text-emerald-950">
              {selectedMatch.rationale.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-md bg-amber-50/60 border border-amber-200">
            <h5 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5 mb-2">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              <span>Detected Differences / Review Cautions</span>
            </h5>
            <ul className="space-y-1.5 text-xs text-amber-950">
              {selectedMatch.detectedDifferences.map((d, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Human-in-the-Loop Action Gate */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            <span>Current Decision: </span>
            <StatusBadge status={selectedMatch.status} />
            {selectedMatch.reviewedBy && (
              <span className="ml-2 font-medium text-slate-700">
                Reviewed by {selectedMatch.reviewedBy}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleApprovalAction("REJECTED")}
              className="px-4 py-2 text-xs font-semibold rounded border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 flex items-center gap-1.5 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject Match</span>
            </button>

            <button
              onClick={() => handleApprovalAction("MODIFIED")}
              className="px-4 py-2 text-xs font-semibold rounded border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Modify / Reclassify</span>
            </button>

            <button
              onClick={() => handleApprovalAction("APPROVED")}
              className="px-4 py-2 text-xs font-bold rounded bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve & Assign National Code</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MatchCenterPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading AI Match Center..." />}>
      <MatchCenterContent />
    </Suspense>
  );
}
