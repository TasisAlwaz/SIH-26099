"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  Sparkles,
  CheckSquare,
  Globe2,
  Building2,
  UploadCloud,
  BarChart3,
  History,
  Settings,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Material Explorer", href: "/materials", icon: Boxes },
  { name: "AI Match Center", href: "/matches", icon: Sparkles, badge: "AI Core" },
  { name: "Approval Queue", href: "/approvals", icon: CheckSquare, badgeCount: 3 },
  { name: "National Master", href: "/national-materials", icon: Globe2 },
  { name: "CPSE Management", href: "/cpses", icon: Building2 },
  { name: "Data Upload", href: "/upload", icon: UploadCloud },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Audit Trail", href: "/audit", icon: History },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-slate-900 text-slate-200 border-r border-slate-800 transition-transform duration-200 md:translate-x-0 md:static",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-5 border-b border-slate-800 bg-slate-950/60 gap-3">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-black text-sm tracking-wider shadow-inner">
            NM
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white text-sm tracking-wide leading-none">
              N-MAT
            </span>
            <span className="text-[10px] text-blue-400 font-medium tracking-tight mt-1 uppercase">
              SIH 26099 • Enterprise
            </span>
          </div>
        </div>

        {/* Sovereign Mandate Banner */}
        <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800/80">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-[11px] font-medium leading-tight text-slate-300">
              National Material Intelligence
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Operational Modules
          </p>
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors",
                  isActive
                    ? "bg-blue-600/90 text-white font-semibold shadow-sm"
                    : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors",
                      isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                    )}
                  />
                  <span>{item.name}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider bg-blue-500/30 text-blue-200 rounded border border-blue-400/30">
                      {item.badge}
                    </span>
                  )}
                  {item.badgeCount && (
                    <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold bg-amber-500 text-slate-950 rounded-full">
                      {item.badgeCount}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-200" />}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300">Phase 2 Prototype</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
              AI: MOCK
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            Government CPSE Material Harmonization
          </p>
        </div>
      </aside>
    </>
  );
};
