import React, { useRef, useEffect } from "react";
import {
  Sparkles,
  PanelLeft,
  User,
  Wand2,
  Check,
  ChevronDown,
  ChevronRight,
  Play,
  CornerDownLeft,
} from "lucide-react";
import { AnalysisView } from "./AnalysisView";
import { AppStep, AnalysisResult, PatchPlanResult } from "../types";

interface AIPanelProps {
  width: number;
  step: AppStep;
  analysis: AnalysisResult | null;
  patchPlan: PatchPlanResult | null;
  currentScenario: string | null;
  failureInput: string;
  setFailureInput: (value: string) => void;
  promptInput: string;
  isPatchExpanded: boolean;
  setIsPatchExpanded: (value: boolean) => void;
  appliedIndices: Set<number>;
  processingIndex: number | null;
  error: string | null;
  modelReasoning: "low" | "medium" | "high";
  setModelReasoning: (value: "low" | "medium" | "high") => void;
  handleRun: () => void;
  handleAccept: () => void;
  handleApplySinglePatch: (index: number) => void;
}

export const AIPanel: React.FC<AIPanelProps> = ({
  width,
  step,
  analysis,
  patchPlan,
  currentScenario,
  failureInput,
  setFailureInput,
  promptInput,
  isPatchExpanded,
  setIsPatchExpanded,
  appliedIndices,
  processingIndex,
  error,
  modelReasoning,
  setModelReasoning,
  handleRun,
  handleAccept,
  handleApplySinglePatch,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = React.useState(false);

  useEffect(() => {
    if (step === AppStep.ANALYZING || step === AppStep.REVIEW) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [step, analysis, patchPlan, currentScenario]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      style={{ width }}
      className="bg-[#09090b] border-l border-white/10 flex flex-col shrink-0 h-full"
    >
      {/* AI Header */}
      <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 shrink-0 bg-[#09090b]">
        <span className="text-xs font-medium text-gray-300 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> AI Assistant
        </span>
        <div className="flex gap-2">
          <PanelLeft className="w-3.5 h-3.5 text-gray-500 hover:text-gray-300 cursor-pointer" />
        </div>
      </div>

      {/* AI Content (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-800">
        {/* Initial State */}
        {step === AppStep.INPUT && !analysis && (
          <div className="text-center py-12 text-gray-600">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-3 border border-white/5 shadow-inner">
              <Wand2 className="w-6 h-6 opacity-50" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              How can I help improve your prompt?
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Describe a failure case or paste a bad log.
            </p>
          </div>
        )}

        {/* Current Scenario (User Bubble) */}
        {currentScenario && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 mb-6">
            <div className="flex justify-end mb-2 px-1">
              <span className="text-[10px] text-gray-500 flex items-center gap-1 uppercase tracking-wider font-semibold">
                <User className="w-3 h-3" /> You
              </span>
            </div>
            <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl rounded-tr-sm p-4 shadow-sm">
              <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                {currentScenario}
              </p>
            </div>
          </div>
        )}

        {/* Analysis Result */}
        {(step === AppStep.ANALYZING || analysis) && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <AnalysisView
              analysis={analysis}
              isAnalyzing={step === AppStep.ANALYZING}
            />
          </div>
        )}

        {/* Patch Notes (Collapsible) */}
        {(step === AppStep.REVIEW ||
          step === AppStep.PATCHING ||
          step === AppStep.COMPLETE ||
          patchPlan) && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Patch Notes List */}
            {patchPlan && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl overflow-hidden">
                <button
                  onClick={() => setIsPatchExpanded(!isPatchExpanded)}
                  className="w-full flex items-center justify-between p-4 hover:bg-emerald-500/5 transition-colors"
                >
                  <h4 className="text-xs font-medium text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
                    <Check className="w-3 h-3" /> Proposed Changes
                  </h4>
                  {isPatchExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-emerald-500/50" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-500/50" />
                  )}
                </button>

                {isPatchExpanded && (
                  <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
                    <ul className="space-y-3 px-1">
                      {patchPlan.patchNotes.map((note, i) => {
                        const isApplied = appliedIndices.has(i);
                        const isProcessing = processingIndex === i;

                        return (
                          <li
                            key={i}
                            className={`group flex items-start justify-between gap-4 p-3 rounded-lg border transition-all ${
                              isApplied
                                ? "bg-emerald-500/10 border-emerald-500/20"
                                : "bg-black/20 border-white/5 hover:border-white/10 hover:bg-black/40"
                            }`}
                          >
                            <span
                              className={`text-xs leading-relaxed ${
                                isApplied
                                  ? "text-emerald-200/70"
                                  : "text-gray-300"
                              }`}
                            >
                              {note}
                            </span>

                            <div className="shrink-0 pt-0.5">
                              {isProcessing ? (
                                <div className="px-3 py-1.5 rounded-md bg-white/5 flex items-center justify-center">
                                  <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                              ) : isApplied ? (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 select-none">
                                  <Check className="w-3.5 h-3.5" />
                                  <span className="text-[10px] font-medium uppercase tracking-wide">
                                    Applied
                                  </span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleApplySinglePatch(i)}
                                  disabled={processingIndex !== null}
                                  className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-500/10 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-500/20 hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95"
                                  title="Apply this change"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  <span className="text-[10px] font-bold uppercase tracking-wide">
                                    Apply
                                  </span>
                                </button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    {appliedIndices.size > 0 && (
                      <div className="mt-3 pt-3 border-t border-emerald-500/10 text-[10px] text-emerald-500/50 flex items-center gap-2">
                        <Check className="w-3 h-3" />
                        Applied changes are reflected immediately in the System
                        Prompt.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Chat Input / Action Bar (Bottom) */}
      <div className="p-4 border-t border-white/10 bg-[#09090b]">
        {/* Model Selector Bar */}
        <div className="flex justify-between items-center mb-3 px-1">
          <div className="flex items-center gap-2 relative" ref={dropdownRef}>
            <button
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 transition-colors text-xs text-gray-400 border border-white/5 hover:border-white/10"
            >
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Model Reasoning: {modelReasoning}</span>
              <ChevronDown className="w-3 h-3 opacity-50" />
            </button>

            {/* Dropdown Menu (Upwards) */}
            {isModelDropdownOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#1e1e1e] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider bg-[#252529] border-b border-white/5">
                  Reasoning Effort
                </div>
                <div className="p-1">
                  {(["low", "medium", "high"] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => {
                        setModelReasoning(level);
                        setIsModelDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-md transition-colors ${
                        modelReasoning === level
                          ? "bg-indigo-500/10 text-indigo-300"
                          : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                      }`}
                    >
                      <span className="capitalize">{level}</span>
                      {modelReasoning === level && (
                        <Check className="w-3 h-3" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="relative bg-[#1e1e1e] rounded-xl border border-white/10 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all shadow-sm">
          <textarea
            value={failureInput}
            onChange={(e) => setFailureInput(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();

                if (
                  step === AppStep.ANALYZING ||
                  step === AppStep.PATCHING ||
                  processingIndex !== null
                ) {
                  return;
                }

                if (step === AppStep.REVIEW) {
                  if (failureInput.trim()) {
                    handleRun();
                  } else {
                    handleAccept();
                  }
                } else {
                  handleRun();
                }
              }
            }}
            className="w-full bg-transparent p-3 pr-10 font-mono text-xs text-gray-300 focus:outline-none resize-none h-20 placeholder:text-gray-600 leading-relaxed scrollbar-thin scrollbar-thumb-gray-700"
            placeholder="Describe the issue or paste failure logs here..."
            spellCheck={false}
            disabled={
              step === AppStep.ANALYZING ||
              step === AppStep.PATCHING ||
              processingIndex !== null
            }
          />

          {/* Action Button inside input */}
          <div className="absolute bottom-2 right-2">
            {step === AppStep.ANALYZING ||
            step === AppStep.PATCHING ||
            processingIndex !== null ? (
              <div className="p-1.5 rounded-lg bg-white/5 text-gray-500 cursor-wait">
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : step === AppStep.REVIEW ? (
              <button
                onClick={handleAccept}
                className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                title="Finish Review"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleRun}
                disabled={!promptInput.trim()}
                className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none group"
              >
                <CornerDownLeft className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-3 text-xs text-red-400 font-mono text-center bg-red-500/10 p-2 rounded border border-red-500/20 animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
