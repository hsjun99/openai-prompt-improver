import { useState, useCallback, useEffect } from "react";
import {
  AppStep,
  AnalysisResult,
  PatchPlanResult,
  PatchResult,
} from "../types";
import {
  analyzePromptAction,
  planPatchAction,
  patchPromptAction,
} from "../app/actions";

export const usePromptStudio = () => {
  // Main state
  const [promptInput, setPromptInput] = useState(
    `You are a helpful AI assistant.`
  );
  const [failureInput, setFailureInput] = useState("");
  const [currentScenario, setCurrentScenario] = useState<string | null>(null);
  const [step, setStep] = useState<AppStep>(AppStep.INPUT);

  // Analysis & Patching Data
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [patchPlan, setPatchPlan] = useState<PatchPlanResult | null>(null);
  const [patch, setPatch] = useState<PatchResult | null>(null);

  // Patch application tracking
  const [appliedIndices, setAppliedIndices] = useState<Set<number>>(new Set());
  const [processingIndex, setProcessingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [diffOriginal, setDiffOriginal] = useState<string | null>(null);

  // UI State
  const [activeView, setActiveView] = useState<"editor" | "diff">("editor");
  const [isPatchExpanded, setIsPatchExpanded] = useState(true);
  const [modelReasoning, setModelReasoning] = useState<
    "low" | "medium" | "high"
  >("low");

  // Actions
  useEffect(() => {
    if (patch) {
      setActiveView("diff");
    }
  }, [patch]);

  const handleRun = async () => {
    if (!promptInput.trim()) return;

    setCurrentScenario(failureInput);
    setFailureInput("");
    setError(null);
    setStep(AppStep.ANALYZING);
    setAnalysis(null);
    setPatchPlan(null);
    setPatch(null);
    setAppliedIndices(new Set());
    setDiffOriginal(promptInput);
    setActiveView("editor");

    try {
      const inputToProcess = failureInput;

      // Step 1: Analyze
      const analysisResult = await analyzePromptAction(
        promptInput,
        inputToProcess,
        modelReasoning
      );
      setAnalysis(analysisResult);

      // Step 2: Plan
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

      const patchResult = await patchPromptAction(
        promptInput,
        analysis,
        { patchNotes: [note] },
        modelReasoning
      );

      setPromptInput(patchResult.revisedPrompt);
      setPatch(patchResult);

      setAppliedIndices((prev) => {
        const next = new Set(prev);
        next.add(index);
        return next;
      });

      // Auto-switch to diff view is handled by the useEffect hook
      // observing the 'patch' state change.
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
    setCurrentScenario(null);
    setFailureInput("");
    setActiveView("editor");
  };

  const handleAccept = () => {
    setStep(AppStep.INPUT);
    setAnalysis(null);
    setPatchPlan(null);
    setPatch(null);
    setDiffOriginal(null);
    setError(null);
    setCurrentScenario(null);
    setFailureInput("");
    setActiveView("editor");
  };

  return {
    promptInput,
    setPromptInput,
    failureInput,
    setFailureInput,
    currentScenario,
    step,
    analysis,
    patchPlan,
    patch,
    setPatch,
    appliedIndices,
    processingIndex,
    error,
    diffOriginal,
    activeView,
    setActiveView,
    isPatchExpanded,
    setIsPatchExpanded,
    modelReasoning,
    setModelReasoning,
    handleRun,
    handleApplySinglePatch,
    handleReset,
    handleAccept,
  };
};
