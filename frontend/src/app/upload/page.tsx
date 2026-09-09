"use client";

import React, { useState } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Eye,
  ShieldAlert,
  Loader2,
} from "lucide-react";

import { PageHeader } from "@/components/ui/PageHeader";
import { WatermarkBadge } from "@/components/ui/WatermarkBadge";

type UploadStage = "IDLE" | "VALIDATING" | "COLUMN_MAPPING" | "NORMALIZATION_PREVIEW" | "READY";

export default function DataUploadPage() {
  const [selectedCpse, setSelectedCpse] = useState("IOCL");
  const [fileName, setFileName] = useState<string | null>(null);
  const [stage, setStage] = useState<UploadStage>("IDLE");
  const [validationProgress, setValidationProgress] = useState(0);

  const handleSimulateFileSelect = (name: string) => {
    setFileName(name);
    setStage("VALIDATING");
    setValidationProgress(15);

    // Simulate multi-step validation
    setTimeout(() => setValidationProgress(45), 300);
    setTimeout(() => setValidationProgress(85), 600);
    setTimeout(() => {
      setValidationProgress(100);
      setStage("COLUMN_MAPPING");
    }, 900);
  };

  const handleReset = () => {
    setFileName(null);
    setStage("IDLE");
    setValidationProgress(0);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="CPSE Material Catalog Upload"
        description="Ingest legacy enterprise inventory dumps (CSV / Excel). Multi-stage schema validation, automated column detection, and normalization preview."
        badge="Ingestion Simulator"
      />

      {/* Honesty Banner */}
      <div className="p-3.5 bg-blue-50/70 rounded-md border border-blue-200 text-xs text-blue-950 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Phase 2 Mock Workflow:</span> This ingestion pipeline demonstrates the frontend user flow (validation, column detection, attribute parsing, and normalization preview). Real backend file processing and database persistence will be implemented in Phase 3.
        </div>
      </div>

      {/* Stage Progress Stepper */}
      <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between max-w-3xl mx-auto text-xs">
          {[
            { id: "IDLE", label: "1. File Selection" },
            { id: "VALIDATING", label: "2. Schema Validation" },
            { id: "COLUMN_MAPPING", label: "3. Column Detection" },
            { id: "NORMALIZATION_PREVIEW", label: "4. Normalization" },
            { id: "READY", label: "5. Ingestion Gate" },
          ].map((s, idx) => {
            const isPassed =
              (s.id === "IDLE" && stage !== "IDLE") ||
              (s.id === "VALIDATING" && ["COLUMN_MAPPING", "NORMALIZATION_PREVIEW", "READY"].includes(stage)) ||
              (s.id === "COLUMN_MAPPING" && ["NORMALIZATION_PREVIEW", "READY"].includes(stage)) ||
              (s.id === "NORMALIZATION_PREVIEW" && stage === "READY");
            const isCurrent = stage === s.id;

            return (
              <div key={s.id} className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold ${
                    isPassed
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                      ? "bg-blue-600 text-white animate-pulse"
                      : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}
                >
                  {isPassed ? "✓" : idx + 1}
                </div>
                <span
                  className={`font-semibold hidden sm:inline ${
                    isCurrent ? "text-blue-700" : isPassed ? "text-slate-800" : "text-slate-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage 1: File Selection & CPSE Selector */}
      {stage === "IDLE" && (
        <div className="bg-white p-6 rounded-md border border-slate-200 shadow-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 uppercase tracking-wider">
                Target CPSE Enterprise
              </label>
              <select
                value={selectedCpse}
                onChange={(e) => setSelectedCpse(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-2.5 font-medium text-slate-900"
              >
                <option value="IOCL">IOCL — Indian Oil Corporation Limited</option>
                <option value="NTPC">NTPC — NTPC Limited</option>
                <option value="SAIL">SAIL — Steel Authority of India Limited</option>
                <option value="HPCL">HPCL — Hindustan Petroleum Corp Ltd</option>
                <option value="BPCL">BPCL — Bharat Petroleum Corp Ltd</option>
                <option value="CPCL">CPCL — Chennai Petroleum Corp Ltd</option>
                <option value="ONGC">ONGC — Oil and Natural Gas Corporation</option>
                <option value="GAIL">GAIL — GAIL (India) Limited</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 uppercase tracking-wider">
                Catalog Source Schema
              </label>
              <select className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-2.5 font-medium text-slate-900">
                <option>SAP ERP Material Master Dump (MARA / MARC)</option>
                <option>Oracle EBS Item Master Export</option>
                <option>Custom Industrial CSV / Excel Template</option>
              </select>
            </div>
          </div>

          {/* Drag and Drop Zone */}
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-500 bg-slate-50/50 transition-colors">
            <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">
              Drag & Drop Legacy CPSE Catalog File
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Supported formats: .CSV, .XLSX (up to 50,000 material rows per batch)
            </p>

            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => handleSimulateFileSelect(`${selectedCpse}_SAP_Spares_Export_2026.csv`)}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Simulate Standard CPSE Upload</span>
              </button>

              <button
                onClick={() => handleSimulateFileSelect("IOCL_Refinery_Bearings_Batch_406.csv")}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold border border-slate-200 transition-colors"
              >
                Sample Dataset (406 Bearing Records)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stage 2: Validating */}
      {stage === "VALIDATING" && (
        <div className="bg-white p-12 rounded-md border border-slate-200 shadow-sm text-center space-y-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
          <h3 className="text-base font-bold text-slate-900">
            Validating Ingestion Schema: {fileName}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Checking header integrity, character encodings, delimiter structure, and mandatory columns (legacy_code, description, uom)...
          </p>
          <div className="max-w-xs mx-auto bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${validationProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Stage 3: Column Detection */}
      {stage === "COLUMN_MAPPING" && (
        <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Automated Column Mapping Detection
              </h3>
              <p className="text-xs text-slate-500">
                AI has auto-detected schema fields from <strong>{fileName}</strong> with 100% confidence.
              </p>
            </div>
            <button
              onClick={() => setStage("NORMALIZATION_PREVIEW")}
              className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded flex items-center gap-1.5 shadow-sm"
            >
              <span>Confirm & Preview Normalization</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {[
              { source: "MATNR / material_code", target: "Legacy Material Code", sample: "BRG-00142" },
              { source: "MAKTX / description", target: "Raw Item Description", sample: "SKF BALL BEARING 6205 2RS" },
              { source: "MEINS / uom", target: "Unit of Measurement", sample: "NOS" },
              { source: "HERST / manufacturer", target: "Manufacturer / Brand", sample: "SKF" },
              { source: "NORMT / standard", target: "Engineering Standard", sample: "DIN 625" },
              { source: "WRKST / material_grade", target: "Metallurgical Grade", sample: "100Cr6" },
            ].map((col, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Source Column</span>
                <span className="font-mono font-bold text-slate-800 block">{col.source}</span>
                <span className="text-[10px] text-blue-700 font-semibold block">Maps to: {col.target}</span>
                <span className="text-[10px] text-slate-500 block truncate">Sample: {col.sample}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stage 4: Normalization Preview */}
      {stage === "NORMALIZATION_PREVIEW" && (
        <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                AI Normalization Preview (Top Sample Rows)
              </h3>
              <p className="text-xs text-slate-500">
                Rule-based regex & NLP parsers transform noisy descriptions into structured parameters.
              </p>
            </div>
            <button
              onClick={() => setStage("READY")}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded flex items-center gap-1.5 shadow-sm"
            >
              <span>Stage Ingestion Batch</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Raw Input Description</th>
                  <th className="py-2.5 px-4">AI-Normalized Description</th>
                  <th className="py-2.5 px-4">Extracted Attributes</th>
                  <th className="py-2.5 px-4">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-mono text-[11px] max-w-xs text-slate-600">
                    BALL VALVVE 2&quot; WCB 300#
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-blue-900 max-w-sm">
                    BALL VALVE, 2 INCH NB, BODY ASTM A216 WCB, CLASS 300#
                  </td>
                  <td className="py-2.5 px-4 text-[11px] font-mono text-slate-600">
                    Size: 2&quot; | Rating: 300# | MOC: WCB
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[10px]">
                      Valve
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-mono text-[11px] max-w-xs text-slate-600">
                    HEX BOLTT CS 3/4&quot;*40
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-blue-900 max-w-sm">
                    HEX BOLT, 3/4 INCH X 40 MM, CARBON STEEL
                  </td>
                  <td className="py-2.5 px-4 text-[11px] font-mono text-slate-600">
                    Dia: 3/4&quot; | Length: 40mm | MOC: CS
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[10px]">
                      Fastener
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stage 5: Ready for Ingestion */}
      {stage === "READY" && (
        <div className="bg-white p-8 rounded-md border border-emerald-300 shadow-sm text-center space-y-4 bg-emerald-50/20">
          <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Catalog Batch Validated & Ready for Ingestion
          </h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            All 406 records from <strong>{fileName}</strong> have been normalized and queued for AI deduplication against the National Material Master index.
          </p>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-300"
            >
              Upload Another Batch
            </button>
            <button
              onClick={() => (window.location.href = "/matches")}
              className="px-4 py-2 rounded text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white transition-colors shadow-sm"
            >
              Proceed to AI Match Center
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
