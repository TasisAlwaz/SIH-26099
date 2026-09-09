import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  trend?: string;
  badge?: string;
  className?: string;
  isMonetary?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
  badge,
  className,
}) => {
  return (
    <div
      className={cn(
        "bg-white rounded-md border border-slate-200 p-4 shadow-sm hover:border-slate-300 transition-colors",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
        <div className="p-2 rounded bg-slate-50 border border-slate-100 text-slate-700">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-2xl font-bold tracking-tight text-slate-900 font-mono">{value}</p>
        {badge && (
          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
            {badge}
          </span>
        )}
      </div>
      {(subtext || trend) && (
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          {subtext && <span>{subtext}</span>}
          {trend && <span className="font-medium text-emerald-600 font-mono">{trend}</span>}
        </div>
      )}
    </div>
  );
};
