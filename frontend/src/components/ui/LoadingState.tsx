import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  subtext?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading platform data...",
  subtext = "Fetching records from local service store",
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-md border border-slate-200 text-center">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
      <p className="text-sm font-semibold text-slate-800">{message}</p>
      {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
    </div>
  );
};
