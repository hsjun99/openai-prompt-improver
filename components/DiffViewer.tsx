import React, { useMemo, useState } from "react";
import { DiffLine } from "../types";
import { computeLineDiff } from "../utils/diff";
import {
  FileDiff,
  Copy,
  Check,
  Columns,
  List,
  Undo2,
  CheckCircle2,
} from "lucide-react";

interface DiffViewerProps {
  original: string;
  modified: string;
  onRevert?: (newContent: string) => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  original,
  modified,
  onRevert,
}) => {
  const diffLines = useMemo(
    () => computeLineDiff(original, modified),
    [original, modified]
  );

  // Compute stats
  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    diffLines.forEach((line) => {
      if (line.type === "add") added++;
      if (line.type === "remove") removed++;
    });
    return { added, removed };
  }, [diffLines]);

  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"split" | "unified">("split");

  const handleCopy = () => {
    navigator.clipboard.writeText(modified);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevertChunk = (startIndex: number, endIndex: number) => {
    if (!onRevert) return;

    let newTextParts: string[] = [];

    // Reconstruct the file based on the revert logic
    diffLines.forEach((line, index) => {
      const isTarget = index >= startIndex && index <= endIndex;

      if (isTarget) {
        // Revert logic: Restore original state for this chunk
        // - If it was 'add', we ignore it (undo addition)
        // - If it was 'remove', we include it (restore removal)
        // - If it was 'equal', we include it (no change)
        if (line.type === "remove" || line.type === "equal") {
          newTextParts.push(line.content);
        }
      } else {
        // Keep logic: Maintain current modified state for other chunks
        // - If it was 'add', we include it (keep addition)
        // - If it was 'remove', we ignore it (keep removal)
        // - If it was 'equal', we include it (no change)
        if (line.type === "add" || line.type === "equal") {
          newTextParts.push(line.content);
        }
      }
    });

    // Join with newlines
    // Note: computeLineDiff splits by \n, so we join by \n.
    onRevert(newTextParts.join("\n"));
  };

  const renderChunkActions = (startIndex: number, endIndex: number) => {
    if (!onRevert) return null;

    return (
      <div className="absolute right-2 top-0 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-[#0d1117] border border-gray-700/50 rounded-md shadow-xl p-0.5 transform translate-y-2">
        <button
          onClick={() => handleRevertChunk(startIndex, endIndex)}
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/10 text-[10px] font-medium text-gray-300 hover:text-white transition-colors"
          title="Revert this change (Undo)"
        >
          <Undo2 className="w-3 h-3" />
          <span>Undo</span>
        </button>
      </div>
    );
  };

  const renderSplitView = () => {
    const rows: React.ReactNode[] = [];
    let i = 0;
    while (i < diffLines.length) {
      const line = diffLines[i];

      // Handle Equal lines (exist in both)
      if (line.type === "equal") {
        rows.push(
          <div
            key={i}
            className="grid grid-cols-2 hover:bg-gray-800/50 group border-b border-gray-800/30 last:border-0 transition-colors duration-75"
          >
            <div className="flex text-gray-400">
              <span className="w-12 flex-shrink-0 text-right pr-4 select-none text-gray-600 text-xs font-mono py-1 bg-[#0d1117] border-r border-gray-800/50 opacity-50 h-full flex items-start justify-end leading-relaxed">
                {line.originalIndex}
              </span>
              <span className="whitespace-pre-wrap break-all font-mono text-sm py-1 pl-4 opacity-70 leading-relaxed w-full">
                {line.content || " "}
              </span>
            </div>
            <div className="flex text-gray-400">
              <span className="w-12 flex-shrink-0 text-right pr-4 select-none text-gray-600 text-xs font-mono py-1 bg-[#0d1117] border-r border-gray-800/50 opacity-50 h-full flex items-start justify-end leading-relaxed">
                {line.modifiedIndex}
              </span>
              <span className="whitespace-pre-wrap break-all font-mono text-sm py-1 pl-4 opacity-70 leading-relaxed w-full">
                {line.content || " "}
              </span>
            </div>
          </div>
        );
        i++;
      }
      // Handle Change blocks (Removal vs Addition)
      else {
        const startIndex = i;
        const removals: DiffLine[] = [];
        const additions: DiffLine[] = [];

        // Collect consecutive changes
        while (i < diffLines.length && diffLines[i].type !== "equal") {
          if (diffLines[i].type === "remove") removals.push(diffLines[i]);
          if (diffLines[i].type === "add") additions.push(diffLines[i]);
          i++;
        }
        const endIndex = i - 1;

        // Render removals on left, additions on right (padding if uneven)
        const maxLen = Math.max(removals.length, additions.length);
        const blockRows: React.ReactNode[] = [];

        for (let j = 0; j < maxLen; j++) {
          const rem = removals[j];
          const add = additions[j];

          blockRows.push(
            <div
              key={`${i}-${j}`}
              className="grid grid-cols-2 border-b border-gray-800/30 last:border-0"
            >
              {/* LEFT SIDE (Original/Removed) */}
              <div className={`flex ${rem ? "bg-red-900/10" : ""}`}>
                {rem ? (
                  <>
                    <span className="w-12 flex-shrink-0 text-right pr-4 select-none text-red-500/50 text-xs font-mono py-1 bg-red-900/20 border-r border-red-900/20 h-full flex items-start justify-end leading-relaxed">
                      {rem.originalIndex}
                    </span>
                    <span className="whitespace-pre-wrap break-all font-mono text-sm text-red-200/90 py-1 pl-4 leading-relaxed w-full">
                      {rem.content || " "}
                    </span>
                  </>
                ) : (
                  <span className="w-12 flex-shrink-0 bg-[#0d1117] block border-r border-gray-800/50"></span>
                )}
              </div>

              {/* RIGHT SIDE (Modified/Added) */}
              <div className={`flex ${add ? "bg-emerald-900/10" : ""}`}>
                {add ? (
                  <>
                    <span className="w-12 flex-shrink-0 text-right pr-4 select-none text-emerald-500/50 text-xs font-mono py-1 bg-emerald-900/20 border-r border-emerald-900/20 h-full flex items-start justify-end leading-relaxed">
                      {add.modifiedIndex}
                    </span>
                    <span className="whitespace-pre-wrap break-all font-mono text-sm text-emerald-200/90 py-1 pl-4 leading-relaxed w-full">
                      {add.content || " "}
                    </span>
                  </>
                ) : (
                  <span className="w-12 flex-shrink-0 bg-[#0d1117] block border-r border-gray-800/50"></span>
                )}
              </div>
            </div>
          );
        }

        // Wrap the entire chunk in a relative group to position the actions
        rows.push(
          <div
            key={`chunk-${startIndex}`}
            className="relative group border-b border-gray-800/30"
          >
            {blockRows}
            {renderChunkActions(startIndex, endIndex)}
          </div>
        );
      }
    }
    return rows;
  };

  const renderUnifiedView = () => {
    const rows: React.ReactNode[] = [];
    let i = 0;

    while (i < diffLines.length) {
      const line = diffLines[i];

      if (line.type === "equal") {
        rows.push(
          <div
            key={i}
            className="flex hover:bg-gray-800/50 border-b border-gray-800/30 last:border-0 group transition-colors duration-75"
          >
            <div className="flex select-none w-24 flex-shrink-0 border-r border-gray-800/50">
              <div className="w-12 text-right pr-3 py-1 text-xs font-mono h-full flex items-start justify-end leading-relaxed text-gray-600 opacity-50">
                {line.originalIndex}
              </div>
              <div className="w-12 text-right pr-3 py-1 text-xs font-mono h-full flex items-start justify-end leading-relaxed text-gray-600 opacity-50">
                {line.modifiedIndex}
              </div>
            </div>
            <div className="flex-1 py-1 pl-4 overflow-hidden">
              <span className="whitespace-pre-wrap break-all font-mono text-sm leading-relaxed text-gray-400 opacity-70">
                {"  "}
                {line.content || " "}
              </span>
            </div>
          </div>
        );
        i++;
      } else {
        // Chunk start
        const startIndex = i;
        const chunkNodes: React.ReactNode[] = [];

        while (i < diffLines.length && diffLines[i].type !== "equal") {
          const subLine = diffLines[i];
          let bgClass = "";
          let textClass = "";
          let lineNumClass = "";
          let gutterClass = "";

          if (subLine.type === "add") {
            bgClass = "bg-emerald-900/10 hover:bg-emerald-900/20";
            textClass = "text-emerald-200/90 opacity-100";
            lineNumClass =
              "text-emerald-600/50 bg-emerald-900/20 border-emerald-900/30";
            gutterClass = "text-emerald-600/50";
          } else {
            // remove
            bgClass = "bg-red-900/10 hover:bg-red-900/20";
            textClass = "text-red-200/90 opacity-100";
            lineNumClass = "text-red-600/50 bg-red-900/20 border-red-900/30";
            gutterClass = "text-red-600/50";
          }

          chunkNodes.push(
            <div
              key={i}
              className={`flex ${bgClass} border-b border-gray-800/30 last:border-0 transition-colors duration-75`}
            >
              {/* Line Numbers */}
              <div className="flex select-none w-24 flex-shrink-0 border-r border-gray-800/50">
                <div
                  className={`w-12 text-right pr-3 py-1 text-xs font-mono h-full flex items-start justify-end leading-relaxed ${
                    subLine.type === "add" ? "opacity-0" : ""
                  } ${gutterClass}`}
                >
                  {subLine.originalIndex}
                </div>
                <div
                  className={`w-12 text-right pr-3 py-1 text-xs font-mono h-full flex items-start justify-end leading-relaxed ${
                    subLine.type === "remove" ? "opacity-0" : ""
                  } ${gutterClass}`}
                >
                  {subLine.modifiedIndex}
                </div>
              </div>
              {/* Content */}
              <div className="flex-1 py-1 pl-4 overflow-hidden">
                <span
                  className={`whitespace-pre-wrap break-all font-mono text-sm leading-relaxed ${textClass}`}
                >
                  {subLine.type === "add" && "+ "}
                  {subLine.type === "remove" && "- "}
                  {subLine.content || " "}
                </span>
              </div>
            </div>
          );
          i++;
        }
        const endIndex = i - 1;

        rows.push(
          <div
            key={`chunk-${startIndex}`}
            className="relative group border-b border-gray-800/30"
          >
            {chunkNodes}
            {renderChunkActions(startIndex, endIndex)}
          </div>
        );
      }
    }
    return rows;
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] border border-gray-800 rounded-lg overflow-hidden shadow-lg">
      <div className="bg-[#161b22] px-4 py-2 flex justify-between items-center border-b border-gray-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileDiff className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">
              Diff View
            </span>
          </div>

          {/* Diff Stats Pill */}
          <div className="flex items-center gap-3 px-3 py-1 bg-[#0d1117] rounded-full border border-gray-800/50">
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
              <span>+{stats.added}</span>
              <span className="text-gray-600">added</span>
            </div>
            <div className="w-[1px] h-3 bg-gray-800"></div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-red-400">
              <span>-{stats.removed}</span>
              <span className="text-gray-600">removed</span>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex bg-[#0d1117] rounded-lg p-1 border border-gray-800/50">
            <button
              onClick={() => setViewMode("split")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "split"
                  ? "bg-indigo-500/20 text-indigo-300 shadow-sm"
                  : "text-gray-500 hover:text-gray-300"
              }`}
              title="Split View"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("unified")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "unified"
                  ? "bg-indigo-500/20 text-indigo-300 shadow-sm"
                  : "text-gray-500 hover:text-gray-300"
              }`}
              title="Unified View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all hover:shadow-lg shadow-indigo-900/20"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          {copied ? "Copied" : "Copy Result"}
        </button>
      </div>
      <div className="flex-1 overflow-auto bg-[#0d1117] relative scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
        {viewMode === "split" ? renderSplitView() : renderUnifiedView()}
      </div>
    </div>
  );
};
