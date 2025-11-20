import "server-only";

import OpenAI from "openai";
import { applyDiff } from "@openai/agents";
import { AnalysisResult, PatchPlanResult, PatchResult } from "../types";
import { computeLineDiff } from "../utils/diff";

let openai: OpenAI | null = null;

type ResponseResult = Awaited<ReturnType<OpenAI["responses"]["create"]>>;
type ModelResponse = Extract<ResponseResult, { output: unknown }>;

const getClient = (): OpenAI => {
  if (openai) return openai;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OpenAI API Key is missing. Please set OPENAI_API_KEY in your environment variables."
    );
  }

  openai = new OpenAI({
    apiKey,
  });

  return openai;
};

// Using the latest reasoning-capable model
const MODEL_NAME = "gpt-5.1";

const extractResponseText = (response: ModelResponse): string => {
  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }

  const textParts: string[] = [];

  for (const item of response.output ?? []) {
    if ("content" in item && Array.isArray(item.content)) {
      for (const part of item.content) {
        if (part?.type === "output_text" && typeof part.text === "string") {
          textParts.push(part.text);
        }
      }
    }
  }

  return textParts.join("\n").trim();
};

export const analyzePrompt = async (
  systemPrompt: string,
  failures: string
): Promise<AnalysisResult> => {
  const client = getClient();

  // Metaprompting Step 1: Diagnose
  // Using the EXACT structure requested by the user.
  const prompt = `
    You are a prompt engineer tasked with debugging a system prompt for an AI agent.

    You are given:

    1) The current system prompt:

    <system_prompt>
    ${systemPrompt}
    </system_prompt>

    2) A small set of logged failures. Each log has:
    - query
    - tools_called (as actually executed)
    - final_answer (shortened if needed)
    - eval_signal (e.g., thumbs_down, low rating, human grader, or user comment)

    <failure_traces>
    ${
      failures ||
      "No specific failure logs provided. Analyze for general contradictions, ambiguity, and best practices."
    }
    </failure_traces>

    Your tasks:

    1) Identify the distinct failure mode you see (e.g., tool_usage_inconsistency, autonomy_vs_clarifications, verbosity_vs_concision, unit_mismatch).

    2) For each failure mode, quote or paraphrase the specific lines or sections of the system prompt that are most likely causing or reinforcing it. Include any contradictions (e.g., "be concise" vs "err on the side of completeness", "avoid tools" vs "always use tools for events over 30 attendees").

    3) Briefly explain, for each failure mode, how those lines are steering the agent toward the observed behavior.

    Return your answer in a structured but readable format:

    failure_modes:
    - name: ...
      description: ...
      prompt_drivers:
        - exact_or_paraphrased_line: ...
          why_it_matters: ...
  `;

  const response = await client.responses.create({
    model: MODEL_NAME,
    reasoning: { effort: "low" },
    stream: false,
    input: [
      {
        role: "system",
        content: "You are a helpful assistant that outputs JSON.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "analysis_result",
        strict: true,
        schema: {
          type: "object",
          properties: {
            failureModes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Name of the failure mode",
                  },
                  description: {
                    type: "string",
                    description:
                      "Explanation of the failure mode and how the prompt causes it",
                  },
                  drivers: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        line: {
                          type: "string",
                          description: "Exact or paraphrased line from prompt",
                        },
                        why: {
                          type: "string",
                          description: "Why it matters",
                        },
                      },
                      required: ["line", "why"],
                      additionalProperties: false,
                    },
                    description:
                      "Specific quotes or paraphrased lines from the prompt that drive this behavior",
                  },
                },
                required: ["name", "description", "drivers"],
                additionalProperties: false,
              },
            },
            rawAnalysis: {
              type: "string",
              description: "A high-level summary or overview of the analysis",
            },
          },
          required: ["failureModes", "rawAnalysis"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = extractResponseText(response);
  if (!content) throw new Error("No response from OpenAI");

  try {
    const parsed = JSON.parse(content);
    return {
      failureModes: parsed.failureModes,
      rawAnalysis: parsed.rawAnalysis,
    };
  } catch (error) {
    console.error("Failed to parse OpenAI response:", error);
    return { failureModes: [], rawAnalysis: "Error parsing analysis result." };
  }
};

export const planPatch = async (
  originalPrompt: string,
  analysis: AnalysisResult
): Promise<PatchPlanResult> => {
  const client = getClient();

  const prompt = `
    You previously analyzed this system prompt and its failure modes.

    System prompt:

    <system_prompt>
    ${originalPrompt}
    </system_prompt>

    Failure-mode analysis:

    ${JSON.stringify(analysis.failureModes, null, 2)}

    Summary:
    ${analysis.rawAnalysis}

    Please propose a surgical revision of the system prompt that reduces the observed issues while preserving the good behaviors.

    Constraints:

    - Do not redesign the agent from scratch.
    - Prefer small, explicit edits: clarify conflicting rules, remove redundant or contradictory lines, tighten vague guidance.
    - Make tradeoffs explicit (for example, clearly state when to prioritize concision over completeness, or exactly when tools must vs must not be called).
    - Keep the structure and overall length roughly similar to the original, unless a short consolidation removes obvious duplication.

    Very important:
    - Do NOT rewrite or print the full revised system prompt.
    - Return only high-signal patch notes that describe what should change and why.

    Output:

    Return your answer in JSON with the following shape:

    {
      "patchNotes": [
        "Concise bullet-style notes explaining the key changes and why you made them."
      ]
    }
  `;

  const response = await client.responses.create({
    model: MODEL_NAME,
    reasoning: { effort: "low" },
    stream: false,
    input: [
      {
        role: "system",
        content: "You are a helpful assistant that outputs JSON only.",
      },
      { role: "user", content: prompt },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "patch_plan_result",
        strict: true,
        schema: {
          type: "object",
          properties: {
            patchNotes: { type: "array", items: { type: "string" } },
          },
          required: ["patchNotes"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = extractResponseText(response);
  if (!content) throw new Error("No response from OpenAI");

  try {
    const parsed = JSON.parse(content);
    return { patchNotes: parsed.patchNotes };
  } catch (error) {
    console.error("Failed to parse patch plan result:", error);
    return { patchNotes: ["Error: Failed to generate patch notes."] };
  }
};

export const patchPrompt = async (
  originalPrompt: string,
  analysis: AnalysisResult,
  patchPlan: PatchPlanResult
): Promise<PatchResult> => {
  const MAX_PATCH_ATTEMPTS = 5;
  const client = getClient();
  console.log("patchPrompt: patch notes", patchPlan.patchNotes);

  // Metaprompting Step 3: IMPLEMENT PATCH via the official apply_patch tool using unified diff.
  // We apply operation.diff onto the current system_prompt.txt via a context-aware patch.

  const filesBlob = `
<BEGIN_FILES>
===== system_prompt.txt
${originalPrompt}
<END_FILES>
`;

  const prompt = `
You are a coding assistant that updates files exclusively through the apply_patch tool using the **V4A patch format**.

Repository snapshot:
${filesBlob}

Failure-mode analysis (read-only context):
${JSON.stringify(analysis.failureModes, null, 2)}

Patch notes (authoritative plan you MUST follow):
${JSON.stringify(patchPlan.patchNotes, null, 2)}

V4A formatting rules (non-negotiable):
1. Wrap every change in "*** Begin Patch" and "*** End Patch".
2. Use "*** Update File: system_prompt.txt" for edits, "*** Add File" for new files, and "*** Delete File" for removals.
3. For updates, include one or more "@@ ... @@" hunks with leading " ", "+", or "-" markers per line.
4. Provide only the minimal span required for each patch note—unchanged text must remain byte-for-byte identical.
5. Never emit natural language outside of apply_patch calls and never restate the entire file unless a patch note requires a full rewrite.
`;

  let response = await client.responses.create({
    model: MODEL_NAME,
    reasoning: { effort: "low" },
    stream: false,
    tools: [{ type: "apply_patch" }],
    input: prompt,
  });
  console.log("patchPrompt: response id", response.id);

  let currentPrompt = originalPrompt;
  let latestApplyOutputs: Array<{
    callId?: string;
    status: "completed" | "failed";
    message: string;
  }> = [];
  let patchingCompleted = false;

  for (let attempt = 0; attempt < MAX_PATCH_ATTEMPTS; attempt++) {
    const patchCalls = (response.output ?? []).filter(
      (item: any) => item.type === "apply_patch_call"
    );
    console.log(
      "patchPrompt: received apply_patch calls",
      patchCalls.length,
      patchCalls.map((c: any) => ({
        callId: c.call_id,
        type: c.operation?.type,
        path: c.operation?.path,
        diffLength:
          typeof c.operation?.diff === "string"
            ? c.operation.diff.length
            : undefined,
      }))
    );

    if (!patchCalls.length) {
      console.error(
        "No apply_patch_call found in patchPrompt response:",
        response
      );
      break;
    }

    latestApplyOutputs = [];

    type V4AAction = "add" | "update" | "delete" | "unknown";

    const stripV4APatch = (
      rawDiff: string
    ): { body: string; action: V4AAction } => {
      const normalized = rawDiff.replace(/\r\n/g, "\n");
      const beginMarker = "*** Begin Patch";
      const endMarker = "*** End Patch";

      let body = normalized;
      const beginIndex = normalized.indexOf(beginMarker);
      if (beginIndex >= 0) {
        body = normalized.slice(beginIndex + beginMarker.length);
      }

      const endIndex = body.indexOf(endMarker);
      if (endIndex >= 0) {
        body = body.slice(0, endIndex);
      }

      let action: V4AAction = "unknown";
      const headerMatch = body.match(
        /\*\*\* (Update|Add|Create|Delete) File:[^\n]*/
      );
      if (headerMatch) {
        const header = headerMatch[0];
        if (header.includes("Update")) action = "update";
        else if (header.includes("Delete")) action = "delete";
        else action = "add";
        const headerEnd = (headerMatch.index ?? 0) + header.length;
        body = body.slice(headerEnd);
      }

      return { body: body.replace(/^\s+/, ""), action };
    };

    const applyV4APatch = (
      base: string,
      diff: string,
      intent: "create" | "update"
    ): { result: string | null; note?: string } => {
      const prepared = stripV4APatch(diff);
      if (!prepared.body.trim()) {
        return { result: null, note: "Empty diff body" };
      }

      if (intent === "create" && prepared.action === "delete") {
        return { result: null, note: "Diff requests delete operation" };
      }

      try {
        const mode = intent === "create" ? "create" : "default";
        const output = applyDiff(base, prepared.body, mode);
        return { result: output };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to apply diff";
        console.error("patchPrompt: applyDiff threw", message);
        return { result: null, note: message };
      }
    };

    const validatePath = (opPath: string | undefined): boolean => {
      if (typeof opPath !== "string" || !opPath.trim()) return false;
      if (opPath.includes("..")) return false;
      // For now we only allow the target system_prompt.txt.
      return opPath === "system_prompt.txt";
    };

    for (const call of patchCalls) {
      const op = (call as any).operation;
      const callId = (call as any).call_id;

      if (!op || !validatePath(op.path)) {
        const msg = `Invalid or disallowed path in apply_patch operation: ${op?.path}`;
        console.error(msg);
        latestApplyOutputs.push({ callId, status: "failed", message: msg });
        continue;
      }

      if (op.type === "delete_file") {
        // Not supported for system_prompt.txt in this flow.
        const msg = "delete_file is not supported for system_prompt.txt";
        console.error(msg);
        latestApplyOutputs.push({ callId, status: "failed", message: msg });
        continue;
      }

      if (op.type === "create_file") {
        // Treat create as applying diff against empty content.
        const diff = op.diff;
        if (typeof diff !== "string" || !diff.trim()) {
          const msg = "create_file missing diff content";
          console.error(msg);
          latestApplyOutputs.push({ callId, status: "failed", message: msg });
          continue;
        }
        const { result, note } = applyV4APatch("", diff, "create");
        if (result === null) {
          const msg = `Failed to apply create_file diff${
            note ? `: ${note}` : ""
          }`;
          console.error(msg);
          latestApplyOutputs.push({ callId, status: "failed", message: msg });
          continue;
        }
        currentPrompt = result;
        latestApplyOutputs.push({
          callId,
          status: "completed",
          message: "Created system_prompt.txt from diff",
        });
        continue;
      }

      if (op.type === "update_file") {
        const diff = op.diff;
        if (typeof diff !== "string" || !diff.trim()) {
          const msg = "update_file missing diff content";
          console.error(msg);
          latestApplyOutputs.push({ callId, status: "failed", message: msg });
          continue;
        }

        console.log(
          "patchPrompt: applying V4A diff",
          `len=${diff.length}`,
          diff.slice(0, 200) + (diff.length > 200 ? "..." : "")
        );

        const { result, note } = applyV4APatch(currentPrompt, diff, "update");
        if (result === null) {
          const msg = `Failed to apply update_file diff${
            note ? `: ${note}` : ""
          }`;
          console.error(msg);
          latestApplyOutputs.push({ callId, status: "failed", message: msg });
          continue;
        }

        const diffLines = computeLineDiff(currentPrompt, result);
        const addCount = diffLines.filter((d) => d.type === "add").length;
        const removeCount = diffLines.filter((d) => d.type === "remove").length;
        console.log("patchPrompt: post-apply diff stats", {
          originalLength: currentPrompt.length,
          revisedLength: result.length,
          addCount,
          removeCount,
        });

        currentPrompt = result;
        latestApplyOutputs.push({
          callId,
          status: "completed",
          message: `Applied update_file diff (+${addCount}/-${removeCount})`,
        });
        continue;
      }

      const msg = `Unsupported apply_patch operation type: ${op.type}`;
      console.error(msg);
      latestApplyOutputs.push({ callId, status: "failed", message: msg });
    }

    const failedOutputs = latestApplyOutputs.filter(
      (output) => output.status === "failed"
    );

    if (failedOutputs.length) {
      const callOutputs = latestApplyOutputs
        .filter((output) => output.callId)
        .map((output) => ({
          type: "apply_patch_call_output" as const,
          call_id: output.callId!,
          status: output.status,
          output: output.message,
        }));

      if (!callOutputs.length) {
        break;
      }

      response = await client.responses.create({
        model: MODEL_NAME,
        reasoning: { effort: "low" },
        stream: false,
        previous_response_id: response.id,
        tools: [{ type: "apply_patch" }],
        input: callOutputs,
      });

      continue;
    }

    patchingCompleted = true;
    break;
  }

  if (!patchingCompleted) {
    return {
      revisedPrompt: currentPrompt,
      patchNotes: [
        "Error: apply_patch retries exhausted before completing the patch plan.",
      ],
    };
  }

  if (
    !latestApplyOutputs.length ||
    !latestApplyOutputs.some((o) => o.status === "completed")
  ) {
    return {
      revisedPrompt: originalPrompt,
      patchNotes: [
        "Error: All apply_patch operations failed. See server logs for details.",
      ],
    };
  }

  if (currentPrompt.trim() === originalPrompt.trim()) {
    console.warn("patchPrompt: applyPatch produced no change");
    return {
      revisedPrompt: originalPrompt,
      patchNotes: [
        "Error: Model produced no effective change when applying the patch notes.",
      ],
    };
  }

  // Step 2 patch notes + Step 3 apply_patch combined in the return value.
  return {
    revisedPrompt: currentPrompt,
    patchNotes: patchPlan.patchNotes,
  };
};
