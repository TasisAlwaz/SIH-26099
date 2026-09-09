import React from "react";
import { WatermarkBadge } from "./WatermarkBadge";

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  badge,
  children,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-slate-200 gap-4">
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl font-sans">
            {title}
          </h1>
          {badge && (
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-50 text-blue-800 border border-blue-200">
              {badge}
            </span>
          )}
          <WatermarkBadge />
        </div>
        {description && (
          <p className="mt-1 text-sm text-slate-600 max-w-3xl">
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-2.5">{children}</div>}
    </div>
  );
};
