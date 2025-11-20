declare module "@openai/agents" {
  /**
   * Applies a V4A / unified diff to a string.
   * This is a minimal type shim so TypeScript can understand our usage in services/openaiService.ts.
   */
  export function applyDiff(
    original: string,
    diff: string,
    mode?: "default" | "create"
  ): string;
}
