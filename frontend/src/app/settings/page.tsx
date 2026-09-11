"use client";

import React, { useState } from "react";
import {
  Settings,
  Cpu,
  User,
  Sliders,
  ShieldCheck,
  AlertCircle,
  Database,
  CheckCircle2,
} from "lucide-react";

import { PageHeader } from "@/components/ui/PageHeader";

export default function SettingsPage() {
  const [density, setDensity] = useState<"compact" | "normal">("compact");
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Platform Settings & System Configuration"
        description="User credentials, matching engine configuration, and display preferences."
      />

      {/* 1. Engine Mode Specification */}
      <div className="bg-white rounded-md border border-amber-300 p-5 shadow-sm space-y-4 bg-amber-50/20">
        <div className="flex items-center justify-between pb-3 border-b border-amber-200">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-700" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-950">
              Matching Engine Configuration
            </h3>
          </div>
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-amber-100 text-amber-900 border border-amber-300">
            ENGINE: DEMO HEURISTIC
          </span>
        </div>

        <div className="p-4 rounded bg-white border border-amber-200 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Matching Engine Architecture</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            BharatMaterials utilizes a deterministic heuristic matching engine to evaluate multi-attribute similarities, classify item relationships, and support human-in-the-loop review workflows.
          </p>
          <p className="text-xs font-semibold text-slate-800">
            Machine learning inference is planned for future integration following dataset evaluation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
          <div className="p-3 bg-white rounded border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Engine</span>
            <span className="font-mono font-bold text-slate-800 mt-0.5 block">Demo Heuristic Engine</span>
          </div>
          <div className="p-3 bg-white rounded border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Future ML Engine</span>
            <span className="font-mono font-bold text-blue-700 mt-0.5 block">Planned — to be selected after dataset evaluation</span>
          </div>
        </div>
      </div>

      {/* 2. User Profile */}
      <div className="bg-white rounded-md border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <User className="w-4 h-4 text-slate-600" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Authenticated Officer Profile
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-500 font-medium block mb-1">Full Name</label>
            <input
              type="text"
              readOnly
              value="S. K. Sharma"
              className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 font-semibold"
            />
          </div>
          <div>
            <label className="text-slate-500 font-medium block mb-1">Assigned Role</label>
            <input
              type="text"
              readOnly
              value="Chief Procurement Officer (CPO)"
              className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 font-semibold"
            />
          </div>
          <div>
            <label className="text-slate-500 font-medium block mb-1">Enterprise Affinity</label>
            <input
              type="text"
              readOnly
              value="IOCL / Inter-CPSE Harmonization Taskforce"
              className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 font-semibold"
            />
          </div>
          <div>
            <label className="text-slate-500 font-medium block mb-1">Security Clearance</label>
            <input
              type="text"
              readOnly
              value="Level 4 (National Master Write Authorization)"
              className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 font-semibold"
            />
          </div>
        </div>
      </div>

      {/* 3. System Preferences & Demo Mode */}
      <div className="bg-white rounded-md border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Sliders className="w-4 h-4 text-slate-600" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Display Preferences & Demo Telemetry
          </h3>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
            <div>
              <span className="font-bold text-slate-800 block">Table Display Density</span>
              <span className="text-slate-500">Dense layout optimized for large enterprise material masters</span>
            </div>
            <div className="flex rounded border border-slate-300 overflow-hidden">
              <button
                onClick={() => setDensity("compact")}
                className={`px-3 py-1 font-semibold ${
                  density === "compact" ? "bg-blue-700 text-white" : "bg-white text-slate-700"
                }`}
              >
                Compact (High Density)
              </button>
              <button
                onClick={() => setDensity("normal")}
                className={`px-3 py-1 font-semibold ${
                  density === "normal" ? "bg-blue-700 text-white" : "bg-white text-slate-700"
                }`}
              >
                Normal
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
            <div>
              <span className="font-bold text-slate-800 block">Demonstration Watermark Badges</span>
              <span className="text-slate-500">
                Display demonstration watermark tags across interface
              </span>
            </div>
            <span className="font-mono font-bold text-emerald-700 text-xs px-2.5 py-1 bg-emerald-50 rounded border border-emerald-200">
              Enforced (Always ON)
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
            <div>
              <span className="font-bold text-slate-800 block">Review Queue Notifications</span>
              <span className="text-slate-500">Simulate browser alerts on high-confidence candidate pairs</span>
            </div>
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
