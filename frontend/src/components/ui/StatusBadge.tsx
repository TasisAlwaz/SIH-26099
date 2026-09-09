import React from "react";
import { MatchRelationship, ApprovalStatus, MaterialStatus } from "@/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status?: MatchRelationship | ApprovalStatus | MaterialStatus | string | null;
  size?: "sm" | "md";
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = "sm", className }) => {
  let colorClass = "bg-slate-100 text-slate-700 border-slate-300";

  switch (status) {
    case "IDENTICAL":
      colorClass = "bg-emerald-50 text-emerald-800 border-emerald-300";
      break;
    case "DUPLICATE":
      colorClass = "bg-amber-50 text-amber-800 border-amber-300";
      break;
    case "NEAR_DUPLICATE":
      colorClass = "bg-indigo-50 text-indigo-800 border-indigo-300";
      break;
    case "FUNCTIONALLY_EQUIVALENT":
      colorClass = "bg-sky-50 text-sky-800 border-sky-300";
      break;
    case "NOT_EQUIVALENT":
      colorClass = "bg-rose-50 text-rose-800 border-rose-300";
      break;
    case "APPROVED":
    case "STANDARDIZED":
    case "ACTIVE":
      colorClass = "bg-emerald-50 text-emerald-700 border-emerald-300";
      break;
    case "PENDING":
    case "PENDING_REVIEW":
    case "UNDER_REVIEW":
      colorClass = "bg-amber-50 text-amber-700 border-amber-300";
      break;
    case "REJECTED":
    case "FLAGGED":
      colorClass = "bg-rose-50 text-rose-700 border-rose-300";
      break;
    case "UNMATCHED":
      colorClass = "bg-slate-100 text-slate-600 border-slate-300";
      break;
  }

  const formatText = (text: string | null | undefined) => {
    if (!text) return "N/A";
    return String(text).replace(/_/g, " ");
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium uppercase tracking-wider rounded border",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs font-semibold",
        colorClass,
        className
      )}
    >
      {formatText(status)}
    </span>
  );
};
