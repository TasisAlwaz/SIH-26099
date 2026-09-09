import React from "react";
import { cn } from "@/lib/utils";

interface ConfidenceBadgeProps {
  score?: number | null; // 0 to 100
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  score,
  showLabel = true,
  size = "md",
  className,
}) => {
  if (score == null) {
    return (
      <span className={cn("inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500 font-mono", className)}>
        N/A
      </span>
    );
  }

  let color = "bg-rose-50 text-rose-700 border-rose-300";
  let dotColor = "bg-rose-500";

  if (score >= 90) {
    color = "bg-emerald-50 text-emerald-800 border-emerald-300";
    dotColor = "bg-emerald-600";
  } else if (score >= 75) {
    color = "bg-amber-50 text-amber-800 border-amber-300";
    dotColor = "bg-amber-600";
  } else if (score >= 50) {
    color = "bg-indigo-50 text-indigo-800 border-indigo-300";
    dotColor = "bg-indigo-600";
  }

  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-xs font-medium",
    md: "px-2.5 py-1 text-xs font-semibold",
    lg: "px-3.5 py-1.5 text-sm font-bold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-mono tracking-tight",
        color,
        sizeClasses[size],
        className
      )}
    >
      <span className={cn("rounded-full", dotColor, size === "lg" ? "w-2.5 h-2.5" : "w-1.5 h-1.5")} />
      {showLabel && <span className="font-sans text-[11px] font-normal opacity-80">AI Confidence:</span>}
      <span>{score.toFixed(1)}%</span>
    </span>
  );
};
