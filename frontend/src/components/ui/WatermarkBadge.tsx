import React from "react";
import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface WatermarkBadgeProps {
  className?: string;
  variant?: "subtle" | "banner";
}

export const WatermarkBadge: React.FC<WatermarkBadgeProps> = ({ className, variant = "subtle" }) => {
  if (variant === "banner") {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-xs text-amber-900 flex items-center justify-between">
        <div className="flex items-center gap-2 font-medium">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
          <span>SYNTHETIC DEMO ENVIRONMENT — SIH PS 26099 PROTOTYPE</span>
        </div>
        <span className="text-[11px] text-amber-700">All CPSE data and metrics simulated for demonstration</span>
      </div>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider bg-slate-100 text-slate-600 border border-slate-300 uppercase",
        className
      )}
    >
      <ShieldAlert className="w-3 h-3 text-slate-500" />
      DEMO DATA
    </span>
  );
};
