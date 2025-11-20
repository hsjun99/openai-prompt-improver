"use server";

import {
  analyzePrompt,
  planPatch,
  patchPrompt,
} from "../services/openaiService";
import { AnalysisResult, PatchPlanResult, PatchResult } from "../types";

export async function analyzePromptAction(
  systemPrompt: string,
  failures: string,
  reasoningEffort: "low" | "medium" | "high"
): Promise<AnalysisResult> {
  return await analyzePrompt(systemPrompt, failures, reasoningEffort);
}

export async function planPatchAction(
  systemPrompt: string,
  analysis: AnalysisResult,
  reasoningEffort: "low" | "medium" | "high"
): Promise<PatchPlanResult> {
  return await planPatch(systemPrompt, analysis, reasoningEffort);
}

export async function patchPromptAction(
  systemPrompt: string,
  analysis: AnalysisResult,
  plan: PatchPlanResult,
  reasoningEffort: "low" | "medium" | "high"
): Promise<PatchResult> {
  return await patchPrompt(systemPrompt, analysis, plan, reasoningEffort);
}
