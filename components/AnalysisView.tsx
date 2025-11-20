import React, { useState } from "react";
import { AnalysisResult } from "../types";
import {
  Search,
  Quote,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

interface AnalysisViewProps {
  analysis: AnalysisResult | null;
  isAnalyzing: boolean;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  analysis,
  isAnalyzing,
}) => {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);

  if (isAnalyzing) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 animate-pulse p-12 border border-dashed border-gray-800/50 rounded-xl bg-gray-900/30">
        <div className="p-4 bg-indigo-500/10 rounded-full">
          <Search className="w-8 h-8 text-indigo-400 animate-bounce" />
        </div>
        <div className="text-center">
          <h3 className="text-indigo-300 font-medium text-lg">
            Analyzing Prompt
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            Detecting failure patterns and contradictions...
          </p>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-4">
      {/* High Level Summary - Collapsible */}
      <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
        <button
          onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-indigo-500/10 rounded-md border border-indigo-500/20">
              <Search className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-200">
              Analysis Summary
            </h3>
          </div>
          {isSummaryExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
          )}
        </button>

        {isSummaryExpanded && (
          <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 duration-200">
            <div className="pt-2 border-t border-white/5">
              <p className="text-gray-400 leading-relaxed text-xs">
                {analysis.rawAnalysis}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Failure Modes */}
      <div className="space-y-3 pt-2">
        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-1">
          Detected Issues ({analysis.failureModes?.length || 0})
        </h4>

        <div className="grid gap-2">
          {analysis.failureModes?.map((mode, idx) => (
            <div
              key={idx}
              className="bg-[#161b22] rounded-xl border border-red-900/20 overflow-hidden shadow-sm transition-all hover:border-red-900/40"
            >
              {/* Header - Click to Expand */}
              <button
                onClick={() => setExpanded(expanded === idx ? null : idx)}
                className="w-full text-left p-3 border-b border-white/5 bg-gradient-to-r from-red-900/10 to-transparent hover:from-red-900/20 transition-colors flex items-start gap-3"
              >
                <div className="mt-0.5 p-1 bg-red-500/10 rounded flex-shrink-0">
                  {expanded === idx ? (
                    <ChevronDown className="w-3 h-3 text-red-400" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-red-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-red-200 text-sm truncate">
                    {mode.name}
                  </h4>
                </div>
              </button>

              {/* Content - Collapsible */}
              {expanded === idx && (
                <div className="p-4 bg-black/20 animate-in slide-in-from-top-2 duration-200">
                  <p className="text-gray-300 text-xs mb-4 leading-relaxed border-b border-white/5 pb-3">
                    {mode.description}
                  </p>

                  {Array.isArray(mode.drivers) && mode.drivers.length > 0 && (
                    <div className="space-y-3">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        Drivers
                        <div className="h-[1px] flex-1 bg-white/5"></div>
                      </span>

                      <div className="space-y-2">
                        {mode.drivers.map((driver, dIdx) => (
                          <div key={dIdx} className="grid gap-2 relative">
                            {/* Code Snippet */}
                            <div className="flex items-start gap-2">
                              <div className="mt-1">
                                <Quote className="w-2.5 h-2.5 text-gray-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="bg-black/40 border border-white/5 rounded px-2 py-1.5 font-mono text-[11px] text-red-200/80 break-words shadow-inner">
                                  "{driver.line}"
                                </div>
                                <p className="text-[11px] text-gray-500 mt-1.5 ml-1 italic">
                                  ↳ {driver.why}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
