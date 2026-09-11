"use client";

import React from "react";
import { Menu, Search, UserCheck, Cpu, Terminal } from "lucide-react";
import Link from "next/link";

interface TopBarProps {
  onOpenSidebar: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenSidebar }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Mobile Toggle & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenSidebar}
          aria-label="Toggle navigation menu"
          className="p-2 -ml-2 rounded text-slate-600 hover:bg-slate-100 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Legacy Code, NMC, or Description (e.g. 6205, SS316)..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Right Controls: AI status, role info */}
      <div className="flex items-center gap-3">
        {/* Engine Status */}
        <Link
          href="/settings"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs hover:bg-amber-100 transition-colors"
          title="View matching engine configuration"
        >
          <Cpu className="w-3.5 h-3.5 text-amber-700" />
          <span className="font-semibold text-[11px] uppercase tracking-wider">Engine: Demo</span>
        </Link>

        {/* Platform Tag */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono">
          <Terminal className="w-3.5 h-3.5 text-slate-500" />
          <span>BharatMaterials</span>
        </div>

        {/* User Identity / Role */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold font-mono">
            PO
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-800 leading-tight">
              S. K. Sharma
            </span>
            <span className="text-[10px] text-slate-500 leading-tight">
              Chief Procurement Officer
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
