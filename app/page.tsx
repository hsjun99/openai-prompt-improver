"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Wand2,
  Play,
  RotateCcw,
  GitCompare,
  Terminal,
  FileJson,
  ChevronRight,
  ChevronDown,
  Sparkles,
  FileText,
  MessageSquare,
  Layout,
  Settings,
  PanelLeft,
  X,
  Check,
  Activity,
  Command,
  Send,
  CornerDownLeft,
} from "lucide-react";
import {
  analyzePromptAction,
  planPatchAction,
  patchPromptAction,
} from "./actions";
import {
  AppStep,
  AnalysisResult,
  PatchPlanResult,
  PatchResult,
} from "../types";
import { DiffViewer } from "../components/DiffViewer";
import { AnalysisView } from "../components/AnalysisView";

export default function Page() {
  const [promptInput, setPromptInput] = useState(
    `You are a helpful AI assistant.`
  );
  const [failureInput, setFailureInput] = useState("");

  const [step, setStep] = useState<AppStep>(AppStep.INPUT);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [patchPlan, setPatchPlan] = useState<PatchPlanResult | null>(null);
  const [patch, setPatch] = useState<PatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // "editor" = normal editing, "diff" = reviewing changes
  const [activeView, setActiveView] = useState<"editor" | "diff">("editor");

  // Collapsible state for patch notes
  const [isPatchExpanded, setIsPatchExpanded] = useState(true);

  // Resizable Panel State
  const [rightPanelWidth, setRightPanelWidth] = useState(400);
  const [isDragging, setIsDragging] = useState(false);

  // Model Selection State
  const [modelReasoning, setModelReasoning] = useState<
    "low" | "medium" | "high"
  >("low");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        // Calculate new width from right edge of window
        const newWidth = window.innerWidth - e.clientX;
        // Min/Max constraints
        if (newWidth > 300 && newWidth < 800) {
          setRightPanelWidth(newWidth);
        }
      }
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

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

  useEffect(() => {
    // Auto-switch to diff view when a patch is ready
    if (patch) {
      setActiveView("diff");
    }
  }, [patch]);

  const handleRun = async () => {
    if (!promptInput.trim()) return;

    setError(null);
    setStep(AppStep.ANALYZING);
    setAnalysis(null);
    setPatchPlan(null);
    setPatch(null);
    setActiveView("editor"); // Reset to editor while working

    try {
      // Step 1: Analyze
      const analysisResult = await analyzePromptAction(
        promptInput,
        failureInput,
        modelReasoning
      );
      setAnalysis(analysisResult);

      // Step 2: Plan patch (patch notes only)
      setStep(AppStep.PATCHING);
      const plan = await planPatchAction(
        promptInput,
        analysisResult,
        modelReasoning
      );
      setPatchPlan(plan);

      // Step 3: Apply patch (diff-based) to produce revised prompt for diff view
      const patchResult = await patchPromptAction(
        promptInput,
        analysisResult,
        plan,
        modelReasoning
      );
      setPatch(patchResult);

      // Step 4: Ready for user review / accept
      setStep(AppStep.COMPLETE);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      setStep(AppStep.ERROR);
    }
  };

  const handleReset = () => {
    setStep(AppStep.INPUT);
    setAnalysis(null);
    setPatchPlan(null);
    setPatch(null);
    setError(null);
    setActiveView("editor");
  };

  const handleAccept = () => {
    if (patch) {
      setPromptInput(patch.revisedPrompt);
      setStep(AppStep.INPUT);
      setAnalysis(null);
      setPatch(null);
      setError(null);
      setActiveView("editor");
    }
  };

  return (
    <div
      className={`h-screen bg-[#09090b] text-gray-300 selection:bg-indigo-500/30 flex flex-col font-sans overflow-hidden ${
        isDragging ? "cursor-col-resize select-none" : ""
      }`}
    >
      {/* Top Bar */}
      <header className="h-10 bg-[#09090b] border-b border-white/10 flex items-center justify-between px-4 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="flex gap-2 group">
            <div className="w-3 h-3 rounded-full bg-red-500/20 group-hover:bg-red-500 transition-colors border border-red-500/30"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/20 group-hover:bg-amber-500 transition-colors border border-amber-500/30"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/20 group-hover:bg-emerald-500 transition-colors border border-emerald-500/30"></div>
          </div>
          <div className="h-4 w-[1px] bg-white/10 mx-2"></div>
          <span className="text-xs font-medium text-gray-400 flex items-center gap-2">
            <Terminal className="w-3 h-3" /> VoxAI Prompt Studio
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[10px] text-gray-500 px-2 py-1 bg-white/5 rounded border border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            gpt-5.1
          </div>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 relative">
        {/* Main Area (Left) - Editor OR Diff View */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0c0c0e]">
          {/* Toolbar */}
          <div className="h-12 bg-[#09090b] border-b border-white/10 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2">
              {/* View Switcher */}
              <div className="flex items-center bg-white/5 p-0.5 rounded-lg border border-white/5 mr-2">
                <button
                  onClick={() => setActiveView("editor")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${
                    activeView === "editor"
                      ? "bg-[#1e1e1e] text-white shadow-sm ring-1 ring-white/10"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  System Prompt
                </button>
                {patch && (
                  <button
                    onClick={() => setActiveView("diff")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${
                      activeView === "diff"
                        ? "bg-[#1e1e1e] text-white shadow-sm ring-1 ring-white/10"
                        : "text-emerald-400 hover:text-emerald-300"
                    }`}
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    Diff Review
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 relative bg-[#1e1e1e] flex min-h-0">
            {activeView === "diff" && patch ? (
              /* Diff View Mode */
              <div className="flex-1 flex flex-col h-full">
                <div className="flex-1 relative overflow-hidden">
                  <DiffViewer
                    original={promptInput}
                    modified={patch.revisedPrompt}
                  />
                </div>

                {/* Diff Actions Footer */}
                <div className="h-16 bg-[#09090b] border-t border-white/10 flex items-center justify-end px-6 gap-3 shrink-0 z-10">
                  <span className="text-xs text-gray-500 mr-auto flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    Reviewing suggested changes
                  </span>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-md transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleAccept}
                    className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Accept Changes
                  </button>
                </div>
              </div>
            ) : (
              /* Editor Mode */
              <>
                {/* Line Numbers */}
                <div className="w-12 bg-[#09090b] border-r border-white/5 flex flex-col items-end pt-4 pr-3 gap-[2px] text-gray-700 font-mono text-xs select-none shrink-0">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>

                {/* Text Area */}
                <div className="flex-1 relative">
                  <textarea
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    className="absolute inset-0 w-full h-full bg-[#1e1e1e] p-4 font-mono text-sm text-gray-300 resize-none focus:outline-none leading-relaxed selection:bg-indigo-500/20 scrollbar-thin scrollbar-thumb-gray-700"
                    placeholder="// Paste your system prompt here..."
                    spellCheck={false}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          className={`w-[1px] hover:w-[4px] group cursor-col-resize bg-white/10 hover:bg-indigo-500 transition-all z-50 flex flex-col justify-center items-center relative ${
            isDragging ? "!w-[4px] !bg-indigo-500" : ""
          }`}
        >
          {/* Invisible hit area for easier grabbing */}
          <div className="absolute inset-y-0 -left-2 -right-2 z-10 bg-transparent"></div>
        </div>

        {/* AI Pane (Right) */}
        <div
          style={{ width: rightPanelWidth }}
          className="bg-[#09090b] border-l border-white/10 flex flex-col shrink-0"
        >
          {/* AI Header */}
          <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 shrink-0">
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
              <div className="text-center py-8 text-gray-600">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-3 border border-white/5">
                  <Wand2 className="w-6 h-6 opacity-50" />
                </div>
                <p className="text-sm font-medium text-gray-500">
                  Ready to optimize
                </p>
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
            {(step === AppStep.PATCHING || patch) && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Patching Loading State */}
                {step === AppStep.PATCHING && (
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10 flex items-center gap-3">
                    <RotateCcw className="w-4 h-4 text-indigo-400 animate-spin" />
                    <span className="text-xs text-gray-400">
                      Generating patches...
                    </span>
                  </div>
                )}

                {/* Patch Notes List */}
                {patch && (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setIsPatchExpanded(!isPatchExpanded)}
                      className="w-full flex items-center justify-between p-4 hover:bg-emerald-500/5 transition-colors"
                    >
                      <h4 className="text-xs font-medium text-emerald-400 flex items-center gap-2">
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
                        <ul className="space-y-2">
                          {patch.patchNotes?.map((note, i) => (
                            <li
                              key={i}
                              className="text-[11px] text-emerald-200/70 pl-3 border-l-2 border-emerald-500/20 leading-relaxed"
                            >
                              {note}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-3 pt-3 border-t border-emerald-500/10 text-[10px] text-emerald-500/50">
                          Check the Diff View on the left to review details.
                        </div>
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
            {/* Model Selector Bar - Moved HERE */}
            <div className="flex justify-between items-center mb-3 px-1">
              <div
                className="flex items-center gap-2 relative"
                ref={dropdownRef}
              >
                <button
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 transition-colors text-[10px] text-gray-400 border border-white/5"
                >
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>gpt-5.1 ({modelReasoning})</span>
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

            <div className="relative bg-[#1e1e1e] rounded-xl border border-white/10 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all shadow-sm">
              <textarea
                value={failureInput}
                onChange={(e) => setFailureInput(e.target.value)}
                className="w-full bg-transparent p-3 pr-10 font-mono text-xs text-gray-300 focus:outline-none resize-none h-20 placeholder:text-gray-600 leading-relaxed"
                placeholder="Describe the issue or paste failure logs here..."
                spellCheck={false}
              />

              {/* Action Button inside input */}
              <div className="absolute bottom-2 right-2">
                {step === AppStep.ANALYZING || step === AppStep.PATCHING ? (
                  <div className="p-1.5 rounded-lg bg-white/5 text-gray-500 cursor-wait">
                    <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <button
                    onClick={handleRun}
                    disabled={!promptInput.trim()}
                    className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none group"
                  >
                    {step === AppStep.COMPLETE ? (
                      <RotateCcw className="w-3.5 h-3.5" />
                    ) : (
                      <CornerDownLeft className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-3 text-[10px] text-red-400 font-mono text-center bg-red-500/10 p-2 rounded border border-red-500/20 animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
