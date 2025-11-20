import React, { useState } from "react";
import { AnalysisResult } from "../types";
import {
  AlertTriangle,
  Search,
  ArrowRight,
  Quote,
  ChevronDown,
  ChevronRight,
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
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  if (isAnalyzing) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 animate-pulse p-12 border border-gray-800/50 rounded-xl bg-gray-900/30 backdrop-blur-sm">
        <div className="p-4 bg-indigo-500/10 rounded-full">
          <Search className="w-8 h-8 text-indigo-400 animate-bounce" />
        </div>
        <div className="text-center">
          <h3 className="text-indigo-300 font-medium text-lg">
            시스템 프롬프트 분석 중
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            실패 패턴과 모순점을 찾는 중입니다...
          </p>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-4">
      {/* High Level Summary - Collapsible */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-900/50 rounded-xl border border-gray-800 shadow-sm overflow-hidden">
        <button
          onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-800/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-indigo-500/10 rounded-md border border-indigo-500/20">
              <Search className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <h3 className="text-base font-bold text-gray-100">진단 요약</h3>
          </div>
          {isSummaryExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
          )}
        </button>

        {isSummaryExpanded && (
          <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 duration-200">
            <div className="prose prose-invert max-w-none pt-2 border-t border-gray-800/50">
              <p className="text-gray-300 leading-relaxed text-sm">
                {analysis.rawAnalysis}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Failure Modes */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
          감지된 문제점 ({analysis.failureModes?.length || 0})
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
                className="w-full text-left p-3 border-b border-gray-800/50 bg-gradient-to-r from-red-950/10 to-transparent hover:bg-red-950/20 transition-colors flex items-start gap-3"
              >
                <div className="mt-0.5 p-1 bg-red-500/10 rounded flex-shrink-0">
                  {expanded === idx ? (
                    <ChevronDown className="w-3 h-3 text-red-400" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-red-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-red-200 text-sm truncate">
                    {mode.name}
                  </h4>
                </div>
              </button>

              {/* Content - Collapsible */}
              {expanded === idx && (
                <div className="p-4 bg-[#0d1117]/30 animate-in slide-in-from-top-2 duration-200">
                  <p className="text-gray-300 text-sm mb-4 leading-relaxed border-b border-gray-800/50 pb-3">
                    {mode.description}
                  </p>

                  {Array.isArray(mode.drivers) && mode.drivers.length > 0 && (
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        원인 분석 (Drivers)
                        <div className="h-[1px] flex-1 bg-gray-800/50"></div>
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
                                <div className="bg-[#0d1117] border border-gray-800 rounded px-2 py-1.5 font-mono text-xs text-red-200/90 break-words shadow-inner">
                                  "{driver.line}"
                                </div>
                                <p className="text-xs text-gray-400 mt-1.5 ml-1 italic">
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
