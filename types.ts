export interface AnalysisResult {
  failureModes: FailureMode[];
  rawAnalysis: string;
}

export interface FailureMode {
  name: string;
  description: string;
  drivers: Driver[];
}

export interface Driver {
  line: string;
  why: string;
}

export interface PatchPlanResult {
  patchNotes: string[];
}

export interface PatchResult {
  revisedPrompt: string;
  patchNotes: string[];
}

export enum AppStep {
  INPUT = "INPUT",
  ANALYZING = "ANALYZING",
  REVIEW = "REVIEW",
  PATCHING = "PATCHING",
  COMPLETE = "COMPLETE",
  ERROR = "ERROR",
}

export interface DiffLine {
  type: "equal" | "add" | "remove";
  content: string;
  originalIndex?: number;
  modifiedIndex?: number;
}
