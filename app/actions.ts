"use server";

import {
  analyzePrompt,
  planPatch,
  patchPrompt,
} from "../services/openaiService";
import { AnalysisResult, PatchPlanResult, PatchResult } from "../types";

export async function analyzePromptAction(
  systemPrompt: string,
  failures: string
): Promise<AnalysisResult> {
  return await analyzePrompt(systemPrompt, failures);
}

export async function planPatchAction(
  systemPrompt: string,
  analysis: AnalysisResult
): Promise<PatchPlanResult> {
  return await planPatch(systemPrompt, analysis);
}

export async function patchPromptAction(
  systemPrompt: string,
  analysis: AnalysisResult,
  plan: PatchPlanResult
): Promise<PatchResult> {
  return await patchPrompt(systemPrompt, analysis, plan);
}
