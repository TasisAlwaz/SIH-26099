"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
  ShieldAlert,
  ArrowRight,
  Sliders,
  Layers,
  FileCheck,
  HelpCircle,
  RefreshCw,
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
  const queryMatA = searchParams.get("matA");
  const queryMatB = searchParams.get("matB");

  const [matches, setMatches] = useState<MaterialMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MaterialMatch | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>("");
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);
  const [customMatAId, setCustomMatAId] = useState("");
  const [customMatBId, setCustomMatBId] = useState("");
  const [searchFilterA, setSearchFilterA] = useState("");
  const [searchFilterB, setSearchFilterB] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Reviewer form modal/state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [targetAction, setTargetAction] = useState<ApprovalStatus>("APPROVED");
  const [reviewerName, setReviewerName] = useState("P. Verma (Technical Officer)");
  const [reviewerRole, setReviewerRole] = useState("SENIOR_TECHNICAL_OFFICER");
  const [reviewComments, setReviewComments] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [mList, matPage] = await Promise.all([
          materialService.getMatches(),
          materialService.getMaterialsPaginated({ page: 1, pageSize: 100 }),
        ]);
        setMatches(mList);
        const mats = matPage.items;
        setAllMaterials(mats);

        // Preselection logic
        if (queryMatA && queryMatB) {
          setCustomMatAId(queryMatA);
          setCustomMatBId(queryMatB);
          try {
            const pairResult = await materialService.analyzePair(queryMatA, queryMatB);
            setSelectedMatch(pairResult);
          } catch (err) {
            console.error("Auto-analysis failed for URL query params:", err);
          }
        } else if (queryMatA) {
          setCustomMatAId(queryMatA);
          const other = mats.find((m) => m.id !== queryMatA);
          if (other) setCustomMatBId(other.id);
        } else if (initialMatchId) {
          const target = mList.find((m) => m.id === initialMatchId);
          if (target) {
            setSelectedMatch(target);
            setCustomMatAId(target.materialA.id);
            setCustomMatBId(target.materialB.id);
          }
        } else if (mList.length > 0) {
          setSelectedMatch(mList[0]);
          setCustomMatAId(mList[0].materialA.id);
          setCustomMatBId(mList[0].materialB.id);
        } else if (mats.length >= 2) {
          setCustomMatAId(mats[0].id);
          setCustomMatBId(mats[1].id);
        }
      } catch (err) {
        console.error("Failed to load match center data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [initialMatchId, queryMatA, queryMatB]);

  const handleSelectPreset = (m: MaterialMatch) => {
    setSelectedMatch(m);
    setCustomMatAId(m.materialA.id);
    setCustomMatBId(m.materialB.id);
    setErrorMessage(null);
    setActionSuccessMessage(null);
  };

  const handleRunAnalysis = async () => {
    if (!customMatAId || !customMatBId) {
      setErrorMessage("Please select both Material A and Material B.");
      return;
    }

    if (customMatAId === customMatBId) {
      setErrorMessage("Cannot compare a material with itself. Please select two distinct materials.");
      return;
    }

    setErrorMessage(null);
    setActionSuccessMessage(null);
    setAnalyzing(true);

    // Multi-step progress simulation for realistic intelligence workflow
    setAnalysisStep("Extracting technical parameters and catalog specifications...");
    setTimeout(() => {
      setAnalysisStep("Computing multi-signal heuristic alignment across 8 dimensions...");
    }, 300);
    setTimeout(() => {
      setAnalysisStep("Deriving deterministic relationship classification & rationale...");
    }, 600);

    setTimeout(async () => {
      try {
        const result = await materialService.analyzePair(customMatAId, customMatBId);
        setSelectedMatch(result);
        const updatedList = await materialService.getMatches();
        setMatches(updatedList);
      } catch (err: any) {
        setSelectedMatch(null);
        setErrorMessage(err.message || "Unable to analyze this material pair. Please try again.");
      } finally {
        setAnalyzing(false);
        setAnalysisStep("");
      }
    }, 850);
  };

  const openReviewModal = (status: ApprovalStatus) => {
    setTargetAction(status);
    if (status === "APPROVED") {
      setReviewComments("Confirmed catalog deduplication match. Approved for national code assignment.");
    } else if (status === "REJECTED") {
      setReviewComments("Rejected due to technical attribute divergence and non-interchangeability.");
    } else if (status === "MODIFIED") {
      setReviewComments("Reclassified relationship based on engineering review of operating specifications.");
    }
    setShowReviewModal(true);
  };

  const executeApprovalAction = async () => {
    if (!selectedMatch) return;
    setSubmittingAction(true);
    try {
      await materialService.updateApprovalStatus(
        selectedMatch.id,
        targetAction,
        reviewerName,
        reviewComments
      );

      setSelectedMatch((prev) =>
        prev
          ? {
              ...prev,
              status: targetAction,
              reviewedBy: reviewerName,
              reviewNotes: reviewComments,
            }
          : null
      );

      const updatedList = await materialService.getMatches();
      setMatches(updatedList);
      setShowReviewModal(false);

      if (targetAction === "APPROVED") {
        setActionSuccessMessage(
          `Decision Recorded: APPROVED. Mapped recommendation reference: ${selectedMatch.recommendedNmc}. Standard audit trail entry logged.`
        );
      } else if (targetAction === "REJECTED") {
        setActionSuccessMessage(
          `Decision Recorded: REJECTED. Material master records remain strictly segregated. Standard audit trail entry logged.`
        );
      } else {
        setActionSuccessMessage(
          `Decision Recorded: MODIFIED. Reclassification notes recorded in governance audit trail.`
        );
      }

      setTimeout(() => {
        setActionSuccessMessage(null);
      }, 5000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to record approval decision.");
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading Material Master Catalog & Match Center..." />;
  }

  const matA = selectedMatch?.materialA;
  const matB = selectedMatch?.materialB;
  const bd = selectedMatch?.breakdown;

  const filteredMaterialsA = allMaterials.filter(
    (m) =>
      !searchFilterA ||
      m.legacyCode.toLowerCase().includes(searchFilterA.toLowerCase()) ||
      m.rawDescription.toLowerCase().includes(searchFilterA.toLowerCase()) ||
      m.cpse.toLowerCase().includes(searchFilterA.toLowerCase())
  );

  const filteredMaterialsB = allMaterials.filter(
    (m) =>
      !searchFilterB ||
      m.legacyCode.toLowerCase().includes(searchFilterB.toLowerCase()) ||
      m.rawDescription.toLowerCase().includes(searchFilterB.toLowerCase()) ||
      m.cpse.toLowerCase().includes(searchFilterB.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Material Match & Deduplication Center"
        description="Multi-attribute engineering comparison, deterministic relationship classification, and explainable recommendations."
        badge="Demo Heuristic Engine"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-amber-50 text-amber-900 border border-amber-300 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Engine: Demo Heuristic
          </span>
          <span className="text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
            Demonstration Environment
          </span>
        </div>
      </PageHeader>

      {/* Step 1 & Step 2: Interactive Material Pair Selection */}
      <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Interactive Material Pair Analysis
            </h3>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Quick Presets:</span>
            {matches.slice(0, 5).map((m) => (
              <button
                key={m.id}
                onClick={() => handleSelectPreset(m)}
                className={`px-2.5 py-1 rounded font-mono text-[11px] border transition-colors whitespace-nowrap ${
                  selectedMatch?.id === m.id
                    ? "bg-blue-700 text-white border-blue-700 font-bold"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {m.materialA.cpse}:{m.materialA.legacyCode} ↔ {m.materialB.cpse}:{m.materialB.legacyCode}
              </button>
            ))}
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-md text-xs font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-100 items-start">
          {/* Material A Selector */}
          <div className="sm:col-span-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase text-slate-600 block">
                STEP 1: Select Material A (Source CPSE)
              </label>
              <input
                type="text"
                placeholder="Filter catalog..."
                value={searchFilterA}
                onChange={(e) => setSearchFilterA(e.target.value)}
                className="text-[11px] px-2 py-0.5 border border-slate-200 rounded w-28 text-slate-700"
              />
            </div>
            <select
              value={customMatAId}
              onChange={(e) => {
                const newId = e.target.value;
                setCustomMatAId(newId);
                if (selectedMatch && (selectedMatch.materialA.id !== newId || selectedMatch.materialB.id !== customMatBId)) {
                  setSelectedMatch(null);
                }
                setErrorMessage(null);
                setActionSuccessMessage(null);
              }}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
            >
              {filteredMaterialsA.map((m) => (
                <option key={m.id} value={m.id}>
                  [{m.cpse}] {m.legacyCode} — {m.rawDescription.slice(0, 50)}
                </option>
              ))}
            </select>
          </div>

          {/* Action Center / VS */}
          <div className="sm:col-span-2 text-center flex flex-col items-center justify-center pt-2 sm:pt-4">
            <span className="text-[11px] font-bold text-slate-400">VS</span>
            <button
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="mt-1 px-4 py-2 rounded bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyze Match</span>
                </>
              )}
            </button>
          </div>

          {/* Material B Selector */}
          <div className="sm:col-span-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase text-slate-600 block">
                STEP 2: Select Material B (Candidate Peer)
              </label>
              <input
                type="text"
                placeholder="Filter catalog..."
                value={searchFilterB}
                onChange={(e) => setSearchFilterB(e.target.value)}
                className="text-[11px] px-2 py-0.5 border border-slate-200 rounded w-28 text-slate-700"
              />
            </div>
            <select
              value={customMatBId}
              onChange={(e) => {
                const newId = e.target.value;
                setCustomMatBId(newId);
                if (selectedMatch && (selectedMatch.materialB.id !== newId || selectedMatch.materialA.id !== customMatAId)) {
                  setSelectedMatch(null);
                }
                setErrorMessage(null);
                setActionSuccessMessage(null);
              }}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
            >
              {filteredMaterialsB.map((m) => (
                <option key={m.id} value={m.id}>
                  [{m.cpse}] {m.legacyCode} — {m.rawDescription.slice(0, 50)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Step 4: Multi-Step Analysis Loading State */}
        {analyzing && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-900 flex items-center gap-2 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-blue-700" />
            <span className="font-semibold">{analysisStep}</span>
          </div>
        )}
      </div>

      {actionSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-md text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {selectedMatch && matA && matB && bd ? (
        <>
          {/* Side-by-Side Material Card Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Material A Card */}
        <div className="bg-white rounded-md border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-xs">
                {matA.cpse}
              </span>
              <span className="font-mono text-xs font-bold text-slate-800">
                {matA.legacyCode}
              </span>
            </div>
            <Link
              href={`/materials/${matA.id}`}
              className="text-[11px] font-semibold text-blue-700 hover:text-blue-900"
            >
              View Full Master →
            </Link>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Raw Catalog Description</span>
            <p className="text-xs font-bold text-slate-900 mt-0.5">{matA.rawDescription}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
            <div>
              <span className="text-slate-400 text-[11px] block">Category:</span>
              <span className="font-semibold text-slate-800">{matA.category}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">UOM:</span>
              <span className="font-mono font-semibold text-slate-800">{matA.uom}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Size / Rating:</span>
              <span className="font-semibold text-slate-800">{matA.sizeOrRating || "Standard"}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Material Grade:</span>
              <span className="font-semibold text-slate-800">{matA.materialGrade || "Standard"}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Manufacturer:</span>
              <span className="font-semibold text-slate-800">{matA.manufacturer || "Multiple"}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Standard:</span>
              <span className="font-semibold text-slate-800">{matA.standard || "N/A"}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 text-[11px] block">Existing National Code:</span>
              <span className="font-mono font-bold text-emerald-800">
                {matA.nationalMaterialCode || "Pending Standardization"}
              </span>
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
                {matB.legacyCode}
              </span>
            </div>
            <Link
              href={`/materials/${matB.id}`}
              className="text-[11px] font-semibold text-blue-700 hover:text-blue-900"
            >
              View Full Master →
            </Link>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Raw Catalog Description</span>
            <p className="text-xs font-bold text-slate-900 mt-0.5">{matB.rawDescription}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
            <div>
              <span className="text-slate-400 text-[11px] block">Category:</span>
              <span className="font-semibold text-slate-800">{matB.category}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">UOM:</span>
              <span className="font-mono font-semibold text-slate-800">{matB.uom}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Size / Rating:</span>
              <span className="font-semibold text-slate-800">{matB.sizeOrRating || "Standard"}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Material Grade:</span>
              <span className="font-semibold text-slate-800">{matB.materialGrade || "Standard"}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Manufacturer:</span>
              <span className="font-semibold text-slate-800">{matB.manufacturer || "Multiple"}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Standard:</span>
              <span className="font-semibold text-slate-800">{matB.standard || "N/A"}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 text-[11px] block">Existing National Code:</span>
              <span className="font-mono font-bold text-emerald-800">
                {matB.nationalMaterialCode || "Pending Standardization"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Step 5: Match Result Banner */}
      <div className="bg-white rounded-md border border-slate-200 p-5 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                STEP 5: Deterministic Relationship Verdict
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                {selectedMatch.engine === "MOCK_HEURISTIC" ? "Demo Heuristic Engine" : (selectedMatch.engine || "Demo Heuristic Engine")}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <StatusBadge status={selectedMatch.relationship} size="md" />
              <div className="flex items-center gap-1.5">
                <ConfidenceBadge score={selectedMatch.confidence} size="lg" />
                <span className="text-[11px] font-medium text-slate-500">
                  (Heuristic confidence score)
                </span>
              </div>
            </div>
          </div>

          {/* Step 9: Standardization Recommendation */}
          <div className="bg-slate-50 p-3.5 rounded border border-slate-200 sm:text-right max-w-md">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">
              STEP 9: Standardization Recommendation
            </span>
            <span className="font-mono font-bold text-emerald-800 text-sm block mt-0.5">
              {selectedMatch.recommendedNmc}
            </span>
            <div className="text-[10px] text-slate-500 mt-1">
              {selectedMatch.recommendedNmc.startsWith("NMC-")
                ? "Reference to existing registered National Material Code."
                : "Heuristic recommendation: Official National Material Code pending officer sign-off."}
            </div>
          </div>
        </div>

        {/* Step 6: Multi-Signal Match Breakdown Bars */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-800 mb-3 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-blue-700" />
            <span>STEP 6: Multi-Signal Match Breakdown (8 Dimensions)</span>
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">Description Similarity</span>
              <span className="font-mono text-base font-bold text-slate-800">
                {bd.descriptionSimilarity}%
              </span>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full"
                  style={{ width: `${bd.descriptionSimilarity}%` }}
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">Specification Similarity</span>
              <span className="font-mono text-base font-bold text-slate-800">
                {bd.specificationSimilarity}%
              </span>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full"
                  style={{ width: `${bd.specificationSimilarity}%` }}
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">Overall Attributes</span>
              <span className="font-mono text-base font-bold text-slate-800">
                {bd.attributeSimilarity}%
              </span>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full"
                  style={{ width: `${bd.attributeSimilarity}%` }}
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">UOM Compatibility</span>
              <span className="font-mono text-base font-bold text-slate-800">
                {bd.uomCompatibility}%
              </span>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full"
                  style={{ width: `${bd.uomCompatibility}%` }}
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">Family / Category</span>
              <span className="font-mono text-base font-bold text-slate-800">
                {bd.familyCompatibility != null ? `${bd.familyCompatibility}%` : "N/A"}
              </span>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full"
                  style={{ width: `${bd.familyCompatibility ?? 0}%` }}
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">Size / Rating</span>
              <span className="font-mono text-base font-bold text-slate-800">
                {bd.sizeRatingCompatibility != null ? `${bd.sizeRatingCompatibility}%` : "N/A"}
              </span>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full"
                  style={{ width: `${bd.sizeRatingCompatibility ?? 0}%` }}
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">Material Grade</span>
              <span className="font-mono text-base font-bold text-slate-800">
                {bd.materialGradeCompatibility != null ? `${bd.materialGradeCompatibility}%` : "N/A"}
              </span>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-purple-600 h-full rounded-full"
                  style={{ width: `${bd.materialGradeCompatibility ?? 0}%` }}
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">Manufacturer Match</span>
              <span className="font-mono text-base font-bold text-slate-800">
                {bd.manufacturerMatch}%
              </span>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-purple-600 h-full rounded-full"
                  style={{ width: `${bd.manufacturerMatch}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 7 & Step 8: Explainability Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Step 7: Why This Match? */}
          <div className="p-4 rounded-md bg-emerald-50/70 border border-emerald-200 space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-700" />
              <span>STEP 7: Why This Match? (Explainable Rationale)</span>
            </h5>
            <ul className="space-y-1.5 text-xs text-emerald-950">
              {selectedMatch.rationale.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Step 8: Key Technical Differences */}
          <div className="p-4 rounded-md bg-amber-50/70 border border-amber-200 space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              <span>STEP 8: Key Technical Differences</span>
            </h5>
            <ul className="space-y-1.5 text-xs text-amber-950">
              {selectedMatch.detectedDifferences.map((d, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-700 font-bold">•</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Step 10: Human Review Gate */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Governance Review Status: </span>
            <StatusBadge status={selectedMatch.status} />
            {selectedMatch.reviewedBy && (
              <span className="ml-2 font-medium text-slate-800">
                • Verified by {selectedMatch.reviewedBy}
              </span>
            )}
            {selectedMatch.reviewNotes && (
              <p className="text-[11px] text-slate-500 mt-1 italic">
                &ldquo;{selectedMatch.reviewNotes}&rdquo;
              </p>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => openReviewModal("REJECTED")}
              className="px-3.5 py-2 text-xs font-semibold rounded border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 flex items-center gap-1.5 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject Match</span>
            </button>

            <button
              onClick={() => openReviewModal("MODIFIED")}
              className="px-3.5 py-2 text-xs font-semibold rounded border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Modify / Reclassify</span>
            </button>

            <button
              onClick={() => openReviewModal("APPROVED")}
              className="px-4 py-2 text-xs font-bold rounded bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve Recommendation</span>
            </button>
          </div>
        </div>
      </div>
        </>
      ) : (
        <div className="bg-white rounded-md border border-slate-200 p-10 text-center shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">
            Ready for Material Pair Comparison
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Select Material A and Material B using the selectors above, then click <strong className="text-slate-700">Analyze Match</strong> to evaluate multi-attribute engineering alignment and generate codification recommendations.
          </p>
        </div>
      )}

      {/* Review Decision Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-700" />
                <span>Record Human Governance Decision: {targetAction}</span>
              </h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Reviewing Officer Name
                </label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Officer Designation / Role
                </label>
                <input
                  type="text"
                  value={reviewerRole}
                  onChange={(e) => setReviewerRole(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Audit Sign-Off Notes / Justification
                </label>
                <textarea
                  rows={3}
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded text-slate-800 font-medium focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600">
                <strong>Governance Audit Trail Note:</strong> Submitting this decision will record an
                audit entry (
                <span className="font-mono font-bold text-blue-800">
                  {targetAction === "APPROVED"
                    ? "APPROVE_MAPPING"
                    : targetAction === "REJECTED"
                    ? "REJECT_MAPPING"
                    : "MODIFY_MAPPING"}
                </span>
                ) in PostgreSQL with complete before/after state snapshots.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-3.5 py-1.5 border border-slate-200 text-slate-600 rounded text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={executeApprovalAction}
                disabled={submittingAction}
                className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-bold shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {submittingAction ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Signing off...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Decision</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MatchCenterPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading Material Match Center..." />}>
      <MatchCenterContent />
    </Suspense>
  );
}

