import React from "react";
import { AnalysisResult } from "../types";
import { AlertTriangle, Search, ArrowRight, Quote } from "lucide-react";

interface AnalysisViewProps {
  analysis: AnalysisResult | null;
  isAnalyzing: boolean;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  analysis,
  isAnalyzing,
}) => {
  if (isAnalyzing) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 animate-pulse p-12 border border-gray-800/50 rounded-xl bg-gray-900/30 backdrop-blur-sm">
        <div className="p-4 bg-indigo-500/10 rounded-full">
          <Search className="w-8 h-8 text-indigo-400 animate-bounce" />
        </div>
        <div className="text-center">
          <h3 className="text-indigo-300 font-medium text-lg">
            Analyzing System Prompt
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            Identifying failure patterns and contradictions...
          </p>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-6">
      {/* High Level Summary */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-900/50 rounded-xl border border-gray-800 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
            <Search className="w-5 h-5 text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-100">
            Diagnosis Summary
          </h3>
        </div>

        <div className="prose prose-invert max-w-none">
          <p className="text-gray-300 leading-relaxed text-sm">
            {analysis.rawAnalysis}
          </p>
        </div>
      </div>

      {/* Failure Modes */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
          Detected Issues ({analysis.failureModes?.length || 0})
        </h4>

        <div className="grid gap-5">
          {analysis.failureModes?.map((mode, idx) => (
            <div
              key={idx}
              className="bg-[#161b22] rounded-xl border border-red-900/20 overflow-hidden shadow-sm transition-all hover:border-red-900/40 hover:shadow-md group"
            >
              {/* Header */}
              <div className="p-5 border-b border-gray-800/50 bg-gradient-to-r from-red-950/10 to-transparent">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-1.5 bg-red-500/10 rounded-md">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-200 text-base">
                      {mode.name}
                    </h4>
                    <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                      {mode.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Drivers */}
              {Array.isArray(mode.drivers) && mode.drivers.length > 0 && (
                <div className="bg-[#0d1117]/50 p-5 space-y-4">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    Contributing Factors
                    <div className="h-[1px] flex-1 bg-gray-800/50"></div>
                  </span>

                  <div className="space-y-3">
                    {mode.drivers.map((driver, dIdx) => (
                      <div key={dIdx} className="grid gap-3 relative">
                        {/* Connection Line (visual decoration) */}
                        {dIdx !== mode.drivers.length - 1 && (
                          <div className="absolute left-[11px] top-8 bottom-[-12px] w-[1px] bg-gray-800/50 border-l border-dashed border-gray-700 hidden sm:block"></div>
                        )}

                        {/* Code Snippet */}
                        <div className="relative">
                          <div className="flex items-start gap-3">
                            <div className="mt-1.5">
                              <Quote className="w-3 h-3 text-gray-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="bg-[#0d1117] border border-gray-800 rounded-md px-3 py-2.5 font-mono text-xs text-red-200/90 break-words shadow-inner">
                                "{driver.line}"
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Explanation */}
                        <div className="flex items-start gap-3 pl-6 sm:pl-0">
                          <div className="w-6 flex justify-center hidden sm:flex">
                            <ArrowRight className="w-3 h-3 text-gray-600 mt-1" />
                          </div>
                          <p className="text-xs text-gray-400 italic leading-relaxed">
                            {driver.why}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
