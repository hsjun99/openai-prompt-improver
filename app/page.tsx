"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Wand2,
  Play,
  RotateCcw,
  GitCompare,
  Terminal,
  FileJson,
  ChevronRight,
  Sparkles,
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

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step === AppStep.COMPLETE && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [step]);

  const handleRun = async () => {
    if (!promptInput.trim()) return;

    setError(null);
    setStep(AppStep.ANALYZING);
    setAnalysis(null);
    setPatchPlan(null);
    setPatch(null);

    try {
      // Step 1: Analyze
      const analysisResult = await analyzePromptAction(
        promptInput,
        failureInput
      );
      setAnalysis(analysisResult);

      // Step 2: Plan patch (patch notes only)
      setStep(AppStep.PATCHING);
      const plan = await planPatchAction(promptInput, analysisResult);
      setPatchPlan(plan);

      // Step 3: Apply patch (diff-based) to produce revised prompt for diff view
      const patchResult = await patchPromptAction(
        promptInput,
        analysisResult,
        plan
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
  };

  const handleAccept = () => {
    if (patch) {
      setPromptInput(patch.revisedPrompt);
      setStep(AppStep.INPUT);
      setAnalysis(null);
      setPatch(null);
      setError(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-300 selection:bg-indigo-500/30 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0d1117]/90 backdrop-blur supports-[backdrop-filter]:bg-[#0d1117]/60 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600/10 border border-indigo-500/20 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/20">
              <Wand2 className="text-indigo-400 w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-100 tracking-tight">
                VoxAI Prompt Studio
              </h1>
              <div className="text-[10px] text-gray-500 font-mono tracking-wider uppercase">
                System Prompt Optimizer
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center bg-gray-900/50 border border-gray-800/50 rounded-full px-4 py-1.5">
            <div
              className={`flex items-center gap-2 text-xs font-medium transition-colors ${
                step === AppStep.INPUT ? "text-indigo-400" : "text-gray-500"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${
                  step === AppStep.INPUT
                    ? "border-indigo-500/50 bg-indigo-500/10"
                    : "border-gray-700 bg-gray-800"
                }`}
              >
                1
              </span>
              Input
            </div>
            <ChevronRight className="w-3 h-3 text-gray-700 mx-2" />
            <div
              className={`flex items-center gap-2 text-xs font-medium transition-colors ${
                step === AppStep.ANALYZING || step === AppStep.PATCHING
                  ? "text-indigo-400"
                  : "text-gray-500"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${
                  step === AppStep.ANALYZING || step === AppStep.PATCHING
                    ? "border-indigo-500/50 bg-indigo-500/10"
                    : "border-gray-700 bg-gray-800"
                }`}
              >
                {step === AppStep.ANALYZING || step === AppStep.PATCHING ? (
                  <RotateCcw className="w-3 h-3 animate-spin" />
                ) : (
                  "2"
                )}
              </span>
              Optimize
            </div>
            <ChevronRight className="w-3 h-3 text-gray-700 mx-2" />
            <div
              className={`flex items-center gap-2 text-xs font-medium transition-colors ${
                step === AppStep.COMPLETE ? "text-emerald-400" : "text-gray-500"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${
                  step === AppStep.COMPLETE
                    ? "border-emerald-500/50 bg-emerald-500/10"
                    : "border-gray-700 bg-gray-800"
                }`}
              >
                3
              </span>
              Review
            </div>
          </div>

          {/* Right side spacer or secondary actions */}
          <div className="w-[140px]"></div>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] mx-auto w-full px-6 py-8 grid lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Inputs & Controls */}
        <div
          className={`flex flex-col gap-6 transition-all duration-500 ${
            step === AppStep.COMPLETE ? "hidden" : "lg:col-span-5 col-span-12"
          }`}
        >
          <div className="bg-[#161b22] border border-gray-800 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-12rem)] shadow-sm">
            {/* Prompt Editor Section */}
            <div className="flex-1 flex flex-col border-b border-gray-800 min-h-0">
              <div className="px-4 py-3 bg-gray-900/50 border-b border-gray-800 flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  System Prompt
                </label>
                <span className="text-[10px] text-gray-600 font-mono">
                  markdown
                </span>
              </div>
              <div className="relative flex-1 group">
                <textarea
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  className="absolute inset-0 w-full h-full bg-[#0d1117] p-4 font-mono text-sm text-gray-300 resize-none focus:outline-none focus:bg-[#0d1117] leading-relaxed selection:bg-indigo-500/20"
                  placeholder="// Paste your system prompt here..."
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Context/Failure Section */}
            <div className="h-1/3 flex flex-col min-h-0">
              <div className="px-4 py-3 bg-gray-900/50 border-b border-gray-800 flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <FileJson className="w-3.5 h-3.5 text-amber-400" />
                  Context / Logs
                </label>
                <span className="text-[10px] text-gray-600 font-mono">
                  optional
                </span>
              </div>
              <div className="relative flex-1 group">
                <textarea
                  value={failureInput}
                  onChange={(e) => setFailureInput(e.target.value)}
                  className="absolute inset-0 w-full h-full bg-[#0d1117] p-4 font-mono text-sm text-gray-300 resize-none focus:outline-none focus:bg-[#0d1117] leading-relaxed selection:bg-amber-500/20"
                  placeholder="// Paste failure logs, user feedback, or describe specific issues to fix..."
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-4 bg-gray-900/30 border-t border-gray-800">
              {step === AppStep.INPUT || step === AppStep.ERROR ? (
                <button
                  onClick={handleRun}
                  disabled={!promptInput.trim()}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none shadow-lg shadow-indigo-900/20"
                >
                  <Sparkles className="w-4 h-4 fill-current" />
                  Analyze & Optimize
                </button>
              ) : (
                <div className="w-full py-3.5 bg-gray-800/50 border border-gray-700/50 text-gray-300 rounded-lg font-medium flex items-center justify-center gap-3 cursor-wait">
                  <div className="relative w-4 h-4">
                    <div className="absolute inset-0 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                  </div>
                  {step === AppStep.ANALYZING
                    ? "Analyzing patterns..."
                    : "Generating improved prompt..."}
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-mono flex items-start gap-2">
                  <span className="font-bold">Error:</span> {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Visualization */}
        <div
          className={`flex flex-col gap-6 transition-all duration-500 ${
            step === AppStep.COMPLETE
              ? "col-span-12"
              : "lg:col-span-7 col-span-12"
          } ${
            step === AppStep.INPUT
              ? "hidden lg:flex lg:opacity-40 lg:scale-95 lg:blur-[2px] pointer-events-none grayscale transition-all duration-1000"
              : "opacity-100 scale-100 blur-0 grayscale-0"
          }`}
        >
          {/* Analysis Card */}
          {(step === AppStep.ANALYZING ||
            step === AppStep.PATCHING ||
            step === AppStep.COMPLETE) && (
            <AnalysisView
              analysis={analysis}
              isAnalyzing={step === AppStep.ANALYZING}
            />
          )}

          {/* Diff View */}
          {(step === AppStep.PATCHING || step === AppStep.COMPLETE) && (
            <div className="flex-1 flex flex-col min-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-700">
              {step === AppStep.PATCHING ? (
                <div className="h-64 flex flex-col items-center justify-center space-y-4 p-12 border border-gray-800 rounded-xl bg-gray-900/30 border-dashed">
                  <Wand2 className="w-10 h-10 text-indigo-500 animate-pulse" />
                  <p className="text-indigo-300/80 font-mono text-sm">
                    Applying surgical patches...
                  </p>
                </div>
              ) : (
                patch && (
                  <>
                    {/* Patch Notes */}
                    <div className="mb-8">
                      <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                          Proposed Changes
                        </h3>
                        <div className="h-[1px] flex-1 bg-gray-800"></div>
                      </div>

                      <div className="grid gap-3">
                        {patch.patchNotes?.map((note, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 text-sm text-emerald-100/90 bg-emerald-900/10 p-3 rounded-lg border border-emerald-900/30"
                          >
                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] flex-shrink-0"></div>
                            <span className="leading-relaxed">{note}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Header for Review */}
                    <div className="flex items-center justify-between mb-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800 backdrop-blur-sm sticky top-20 z-10 shadow-xl">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                          <GitCompare className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-200">
                            Diff Review
                          </div>
                          <div className="text-[10px] text-emerald-500/80 font-mono">
                            Ready to apply
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleReset}
                          className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-lg"
                        >
                          Discard
                        </button>
                        <button
                          onClick={handleAccept}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-emerald-900/20 flex items-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <GitCompare className="w-3.5 h-3.5" />
                          Accept Changes
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col shadow-2xl rounded-xl overflow-hidden border border-gray-800">
                      <DiffViewer
                        original={promptInput}
                        modified={patch.revisedPrompt}
                      />
                    </div>
                    <div ref={bottomRef} className="h-20" />
                  </>
                )
              )}
            </div>
          )}

          {/* Empty State / Placeholder for Right Column */}
          {step === AppStep.INPUT && (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-6 border-2 border-gray-800 border-dashed rounded-xl bg-gray-900/20">
              <div className="w-20 h-20 rounded-full bg-gray-800/50 flex items-center justify-center">
                <GitCompare className="w-10 h-10 opacity-20" />
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-500">No Analysis Yet</p>
                <p className="text-sm text-gray-600 mt-1">
                  Enter a system prompt to begin optimization
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
