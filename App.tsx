import React, { useState, useRef, useEffect } from "react";
import {
  Wand2,
  Play,
  RotateCcw,
  GitCompare,
  Terminal,
  FileJson,
} from "lucide-react";
import {
  analyzePrompt,
  planPatch,
  patchPrompt,
} from "./services/openaiService";
import { AppStep, AnalysisResult, PatchPlanResult, PatchResult } from "./types";
import { DiffViewer } from "./components/DiffViewer";
import { AnalysisView } from "./components/AnalysisView";

export default function App() {
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
      const analysisResult = await analyzePrompt(promptInput, failureInput);
      setAnalysis(analysisResult);

      // Step 2: Plan patch (patch notes only)
      setStep(AppStep.PATCHING);
      const plan = await planPatch(promptInput, analysisResult);
      setPatchPlan(plan);

      // Step 3: Apply patch (diff-based) to produce revised prompt for diff view
      const patchResult = await patchPrompt(promptInput, analysisResult, plan);
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
    <div className="min-h-screen bg-[#0d1117] text-gray-300 selection:bg-indigo-500/30 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0d1117]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Wand2 className="text-white w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              MetaPrompt Studio
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <span
              className={`flex items-center gap-2 ${
                step === AppStep.INPUT ? "text-indigo-400" : "text-gray-600"
              }`}
            >
              <Terminal className="w-4 h-4" /> Input
            </span>
            <div className="w-8 h-[1px] bg-gray-800"></div>
            <span
              className={`flex items-center gap-2 ${
                step === AppStep.ANALYZING || step === AppStep.PATCHING
                  ? "text-indigo-400"
                  : "text-gray-600"
              }`}
            >
              <div
                className={
                  step === AppStep.ANALYZING || step === AppStep.PATCHING
                    ? "animate-spin"
                    : ""
                }
              >
                <RotateCcw className="w-4 h-4" />
              </div>
              Optimize
            </span>
            <div className="w-8 h-[1px] bg-gray-800"></div>
            <span
              className={`flex items-center gap-2 ${
                step === AppStep.COMPLETE ? "text-emerald-400" : "text-gray-600"
              }`}
            >
              <GitCompare className="w-4 h-4" /> Review
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 grid lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Inputs & Controls */}
        <div
          className={`flex flex-col gap-6 ${
            step === AppStep.COMPLETE ? "hidden" : "lg:col-span-4 col-span-12"
          }`}
        >
          {/* System Prompt Input */}
          <div className="space-y-2 flex flex-col flex-1 min-h-[300px]">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-3 h-3" /> System Prompt
            </label>
            <textarea
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              className="flex-1 w-full bg-[#161b22] border border-gray-700 rounded-lg p-4 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none text-gray-200"
              placeholder="Paste your current system prompt here..."
            />
          </div>

          {/* Failure Context Input */}
          <div className="space-y-2 flex flex-col h-1/3 min-h-[200px]">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <FileJson className="w-3 h-3" /> Context / Failures (Optional)
            </label>
            <textarea
              value={failureInput}
              onChange={(e) => setFailureInput(e.target.value)}
              className="flex-1 w-full bg-[#161b22] border border-gray-700 rounded-lg p-4 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none text-gray-200"
              placeholder="Paste failure logs, user feedback, or describe the issue..."
            />
          </div>

          {/* Action Bar */}
          <div className="pt-4">
            {step === AppStep.INPUT || step === AppStep.ERROR ? (
              <button
                onClick={handleRun}
                disabled={!promptInput.trim()}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/20"
              >
                <Play className="w-4 h-4 fill-current" /> Start Metaprompting
              </button>
            ) : (
              <div className="w-full py-3 bg-gray-800 text-gray-400 rounded-lg font-medium flex items-center justify-center gap-2 cursor-wait">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                {step === AppStep.ANALYZING
                  ? "Diagnosing Issues..."
                  : "Drafting Patch..."}
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded text-red-400 text-xs font-mono">
                Error: {error}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Visualization */}
        <div
          className={`flex flex-col gap-6 ${
            step === AppStep.COMPLETE
              ? "col-span-12"
              : "lg:col-span-8 col-span-12"
          } ${
            step === AppStep.INPUT
              ? "hidden lg:flex lg:opacity-30 pointer-events-none blur-[1px]"
              : ""
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
            <div className="flex-1 flex flex-col min-h-[500px]">
              {step === AppStep.PATCHING ? (
                <div className="h-full flex flex-col items-center justify-center space-y-4 p-12 border border-gray-800 rounded-lg bg-gray-900/50">
                  <Wand2 className="w-12 h-12 text-emerald-500 animate-pulse" />
                  <p className="text-emerald-300 font-mono">
                    Applying surgical patches...
                  </p>
                </div>
              ) : (
                patch && (
                  <>
                    {/* Patch Notes */}
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
                        Patch Notes
                      </h3>
                      <div className="grid gap-2">
                        {patch.patchNotes?.map((note, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 text-sm text-emerald-400/90 font-mono bg-emerald-900/10 p-2 rounded border-l-2 border-emerald-500/50"
                          >
                            <span className="text-emerald-500 font-bold select-none">
                              +
                            </span>{" "}
                            {note}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Header for Review */}
                    <div className="flex items-center justify-between mb-4 bg-gray-900/80 p-4 rounded-lg border border-gray-800">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="font-medium">Patch Proposed</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleReset}
                          className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                          Discard
                        </button>
                        <button
                          onClick={handleAccept}
                          className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-md shadow-lg shadow-emerald-900/20 flex items-center gap-2 transition-all"
                        >
                          <GitCompare className="w-4 h-4" />
                          Accept Patch
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col">
                      <DiffViewer
                        original={promptInput}
                        modified={patch.revisedPrompt}
                      />
                    </div>
                    <div ref={bottomRef} />
                  </>
                )
              )}
            </div>
          )}

          {step === AppStep.INPUT && (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4 border border-gray-800 border-dashed rounded-xl">
              <GitCompare className="w-16 h-16 opacity-20" />
              <p>Results will appear here</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
