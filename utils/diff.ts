import { DiffLine } from "../types";
import * as Diff from "diff";

/**
 * Computes line-by-line diff for visualization.
 * We can now use the 'diff' package for this too, or keep our custom one.
 * The 'diff' package is robust. Let's switch to it to ensure consistency with applyPatch.
 */
export const computeLineDiff = (text1: string, text2: string): DiffLine[] => {
  const diffResult = Diff.diffLines(text1, text2, { newlineIsToken: false });

  const diffLines: DiffLine[] = [];
  let originalIndex = 1;
  let modifiedIndex = 1;

  diffResult.forEach((part) => {
    // part.value can be multiple lines
    // We want to split them to keep our DiffViewer happy (line by line)
    // But part.value might not end in newline
    const lines = part.value.split("\n");
    // If the last element is empty (because of trailing newline), remove it, unless it's the only one
    if (lines.length > 1 && lines[lines.length - 1] === "") {
      lines.pop();
    }

    lines.forEach((line) => {
      if (part.added) {
        diffLines.push({
          type: "add",
          content: line,
          modifiedIndex: modifiedIndex++,
        });
      } else if (part.removed) {
        diffLines.push({
          type: "remove",
          content: line,
          originalIndex: originalIndex++,
        });
      } else {
        diffLines.push({
          type: "equal",
          content: line,
          originalIndex: originalIndex++,
          modifiedIndex: modifiedIndex++,
        });
      }
    });
  });

  return diffLines;
};
