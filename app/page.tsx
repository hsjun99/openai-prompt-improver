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
  CheckSquare,
  Square,
  Plus,
  User,
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

  // New State: Store user's failure scenario description for display
  const [currentScenario, setCurrentScenario] = useState<string | null>(null);

  const [step, setStep] = useState<AppStep>(AppStep.INPUT);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [patchPlan, setPatchPlan] = useState<PatchPlanResult | null>(null);
  const [patch, setPatch] = useState<PatchResult | null>(null);

  // Removed bulk selection state in favor of individual tracking
  const [appliedIndices, setAppliedIndices] = useState<Set<number>>(new Set());
  const [processingIndex, setProcessingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [diffOriginal, setDiffOriginal] = useState<string | null>(null);

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
  const lineNumbersRef = useRef<HTMLDivElement>(null);

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

    // Move input to scenario display state and clear input
    setCurrentScenario(failureInput);
    setFailureInput("");

    setError(null);
    setStep(AppStep.ANALYZING);
    setAnalysis(null);
    setPatchPlan(null);
    setPatch(null);
    setAppliedIndices(new Set());
    setDiffOriginal(promptInput); // Keep original for diffing accumulated changes
    setActiveView("editor"); // Reset to editor while working

    try {
      // Step 1: Analyze
      const inputToProcess = failureInput;

      const analysisResult = await analyzePromptAction(
        promptInput,
        inputToProcess,
        modelReasoning
      );
      setAnalysis(analysisResult);

      // Step 2: Plan patch (patch notes only)
      const plan = await planPatchAction(
        promptInput,
        analysisResult,
        modelReasoning
      );
      setPatchPlan(plan);

      setStep(AppStep.REVIEW);
      setIsPatchExpanded(true);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      setStep(AppStep.ERROR);
      // Restore input if error
      setFailureInput(currentScenario || failureInput);
      setCurrentScenario(null);
    }
  };

  const handleApplySinglePatch = async (index: number) => {
    if (!analysis || !patchPlan || processingIndex !== null) return;

    setProcessingIndex(index);
    setError(null);

    try {
      const note = patchPlan.patchNotes[index];

      // Step 3: Apply specific patch
      // We pass only the single note, but we use the CURRENT promptInput
      // because previous patches might have already modified it.
      const patchResult = await patchPromptAction(
        promptInput,
        analysis,
        { patchNotes: [note] },
        modelReasoning
      );

      // Update editor content immediately
      setPromptInput(patchResult.revisedPrompt);

      // Set diff context so DiffViewer works
      // We do NOT update diffOriginal here, because we want to show
      // accumulated changes from the start of the analysis session.
      setPatch(patchResult);

      // Mark as applied
      setAppliedIndices((prev) => {
        const next = new Set(prev);
        next.add(index);
        return next;
      });

      // We do NOT switch to Diff View or Complete state
      // We stay in REVIEW so user can apply more patches.
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to apply patch");
    } finally {
      setProcessingIndex(null);
    }
  };

  const handleReset = () => {
    setStep(AppStep.INPUT);
    setAnalysis(null);
    setPatchPlan(null);
    setPatch(null);
    setAppliedIndices(new Set());
    setDiffOriginal(null);
    setError(null);
    setCurrentScenario(null); // Clear the scenario bubble
    setFailureInput("");
    setActiveView("editor");
  };

  const handleAccept = () => {
    // In the new flow, "Accept" is redundant if we are applying live,
    // but maybe we want a "Done" button to clear the AI panel state?
    // For now, let's just treat it as "Clear AI State".
    setStep(AppStep.INPUT);
    setAnalysis(null);
    setPatchPlan(null);
    setPatch(null);
    setDiffOriginal(null);
    setError(null);
    setCurrentScenario(null); // Clear the scenario bubble
    setFailureInput("");
    setActiveView("editor");
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
          <div className="flex items-center gap-2 text-xs text-gray-500 px-2 py-1 bg-white/5 rounded border border-white/10">
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
                    original={diffOriginal || promptInput}
                    modified={patch.revisedPrompt}
                    onRevert={(newPrompt) => {
                      // Handle Undo: Update promptInput with reverted content
                      setPromptInput(newPrompt);
                      // Note: Ideally we should also update 'patch.revisedPrompt'
                      // to reflect the change in the diff viewer immediately.
                      if (patch) {
                        setPatch({
                          ...patch,
                          revisedPrompt: newPrompt,
                        });
                      }
                    }}
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
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Editor Mode */
              <>
                {/* Line Numbers */}
                <div
                  ref={lineNumbersRef}
                  className="w-12 bg-[#09090b] border-r border-white/5 flex flex-col items-end pt-4 pr-3 text-gray-600 font-mono text-sm leading-6 select-none shrink-0 overflow-hidden"
                >
                  {Array.from({
                    length: Math.max(promptInput.split("\n").length, 30),
                  }).map((_, i) => (
                    <div key={i} className="h-6">
                      {i + 1}
                    </div>
                  ))}
                </div>

                {/* Text Area */}
                <div className="flex-1 relative">
                  <textarea
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    onScroll={(e) => {
                      if (lineNumbersRef.current) {
                        lineNumbersRef.current.scrollTop =
                          e.currentTarget.scrollTop;
                      }
                    }}
                    className="absolute inset-0 w-full h-full bg-[#1e1e1e] p-4 font-mono text-sm text-gray-300 resize-none focus:outline-none leading-6 whitespace-pre overflow-auto selection:bg-indigo-500/20 scrollbar-thin scrollbar-thumb-gray-700"
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

            {/* Current Scenario (User Bubble) */}
            {currentScenario && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 mb-6">
                <div className="flex justify-end mb-2 px-1">
                  <span className="text-[10px] text-gray-500 flex items-center gap-1">
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
                        <ul className="space-y-3 px-4 pb-4">
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
                                  className={`text-sm leading-relaxed ${
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
                                      <span className="text-xs font-medium">
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
                          <div className="mt-3 pt-3 border-t border-emerald-500/10 text-xs text-emerald-500/50">
                            Applied changes are reflected immediately in the
                            System Prompt.
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
            {/* Model Selector Bar - Moved HERE */}
            <div className="flex justify-between items-center mb-3 px-1">
              <div
                className="flex items-center gap-2 relative"
                ref={dropdownRef}
              >
                <button
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 transition-colors text-xs text-gray-400 border border-white/5"
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
                className="w-full bg-transparent p-3 pr-10 font-mono text-sm text-gray-300 focus:outline-none resize-none h-20 placeholder:text-gray-600 leading-relaxed"
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
      </div>
    </div>
  );
}
