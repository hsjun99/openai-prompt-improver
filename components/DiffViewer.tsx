import React, { useMemo, useState } from "react";
import { DiffLine } from "../types";
import { computeLineDiff } from "../utils/diff";
import { FileDiff, Copy, Check, Columns, List } from "lucide-react";

interface DiffViewerProps {
  original: string;
  modified: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  original,
  modified,
}) => {
  const diffLines = useMemo(
    () => computeLineDiff(original, modified),
    [original, modified]
  );
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"split" | "unified">("split");

  const handleCopy = () => {
    navigator.clipboard.writeText(modified);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            className="grid grid-cols-2 hover:bg-gray-800 group border-b border-gray-800/50 last:border-0"
          >
            <div className="flex text-gray-400">
              <span className="w-10 flex-shrink-0 text-right pr-3 select-none text-gray-600 text-xs py-0.5 bg-gray-900/50 border-r border-gray-800">
                {line.originalIndex}
              </span>
              <span className="whitespace-pre-wrap break-all font-mono text-xs py-0.5 pl-2">
                {line.content}
              </span>
            </div>
            <div className="flex text-gray-400">
              <span className="w-10 flex-shrink-0 text-right pr-3 select-none text-gray-600 text-xs py-0.5 bg-gray-900/50 border-r border-gray-800">
                {line.modifiedIndex}
              </span>
              <span className="whitespace-pre-wrap break-all font-mono text-xs py-0.5 pl-2">
                {line.content}
              </span>
            </div>
          </div>
        );
        i++;
      }
      // Handle Change blocks (Removal vs Addition)
      else {
        const removals: DiffLine[] = [];
        const additions: DiffLine[] = [];

        // Collect consecutive changes
        while (i < diffLines.length && diffLines[i].type !== "equal") {
          if (diffLines[i].type === "remove") removals.push(diffLines[i]);
          if (diffLines[i].type === "add") additions.push(diffLines[i]);
          i++;
        }

        // Render removals on left, additions on right (padding if uneven)
        const maxLen = Math.max(removals.length, additions.length);

        for (let j = 0; j < maxLen; j++) {
          const rem = removals[j];
          const add = additions[j];

          rows.push(
            <div
              key={`${i}-${j}`}
              className="grid grid-cols-2 group border-b border-gray-800/50 last:border-0"
            >
              {/* LEFT SIDE (Original/Removed) */}
              <div className={`flex ${rem ? "bg-red-900/10" : ""}`}>
                {rem ? (
                  <>
                    <span className="w-10 flex-shrink-0 text-right pr-3 select-none text-red-600/50 text-xs py-0.5 bg-red-900/20 border-r border-red-900/30">
                      {rem.originalIndex}
                    </span>
                    <span className="whitespace-pre-wrap break-all font-mono text-xs text-red-300 py-0.5 pl-2">
                      {rem.content}
                    </span>
                  </>
                ) : (
                  <span className="w-10 flex-shrink-0 bg-gray-900/30 block border-r border-gray-800"></span>
                )}
              </div>

              {/* RIGHT SIDE (Modified/Added) */}
              <div className={`flex ${add ? "bg-emerald-900/10" : ""}`}>
                {add ? (
                  <>
                    <span className="w-10 flex-shrink-0 text-right pr-3 select-none text-emerald-600/50 text-xs py-0.5 bg-emerald-900/20 border-r border-emerald-900/30">
                      {add.modifiedIndex}
                    </span>
                    <span className="whitespace-pre-wrap break-all font-mono text-xs text-emerald-300 py-0.5 pl-2">
                      {add.content}
                    </span>
                  </>
                ) : (
                  <span className="w-10 flex-shrink-0 bg-gray-900/30 block border-r border-gray-800"></span>
                )}
              </div>
            </div>
          );
        }
      }
    }
    return rows;
  };

  const renderUnifiedView = () => {
    return diffLines.map((line, i) => {
      let bgClass = "hover:bg-gray-800";
      let textClass = "text-gray-400";
      let lineNumClass = "text-gray-600 bg-gray-900/50 border-gray-800";
      let gutterClass = "text-gray-600";

      if (line.type === "add") {
        bgClass = "bg-emerald-900/10 hover:bg-emerald-900/20";
        textClass = "text-emerald-300";
        lineNumClass =
          "text-emerald-600/50 bg-emerald-900/20 border-emerald-900/30";
        gutterClass = "text-emerald-600/50";
      } else if (line.type === "remove") {
        bgClass = "bg-red-900/10 hover:bg-red-900/20";
        textClass = "text-red-300";
        lineNumClass = "text-red-600/50 bg-red-900/20 border-red-900/30";
        gutterClass = "text-red-600/50";
      }

      return (
        <div
          key={i}
          className={`flex ${bgClass} border-b border-gray-800/50 last:border-0 group`}
        >
          {/* Line Numbers */}
          <div className="flex select-none w-20 flex-shrink-0 border-r border-gray-800">
            <div
              className={`w-10 text-right pr-2 py-0.5 text-xs ${
                line.type === "add" ? "opacity-0" : ""
              } ${gutterClass}`}
            >
              {line.originalIndex}
            </div>
            <div
              className={`w-10 text-right pr-2 py-0.5 text-xs ${
                line.type === "remove" ? "opacity-0" : ""
              } ${gutterClass}`}
            >
              {line.modifiedIndex}
            </div>
          </div>
          {/* Content */}
          <div className="flex-1 py-0.5 pl-2 overflow-hidden">
            <span
              className={`whitespace-pre-wrap break-all font-mono text-xs ${textClass}`}
            >
              {line.type === "add" && "+ "}
              {line.type === "remove" && "- "}
              {line.type === "equal" && "  "}
              {line.content}
            </span>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 border border-gray-800 rounded-lg overflow-hidden shadow-2xl">
      <div className="bg-gray-800 px-4 py-2 flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileDiff className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-medium text-gray-300 uppercase tracking-wider">
              Diff View
            </span>
          </div>

          {/* View Toggle */}
          <div className="flex bg-gray-900 rounded p-0.5">
            <button
              onClick={() => setViewMode("split")}
              className={`p-1 rounded ${
                viewMode === "split"
                  ? "bg-gray-700 text-white shadow"
                  : "text-gray-500 hover:text-gray-300"
              }`}
              title="Split View"
            >
              <Columns className="w-3 h-3" />
            </button>
            <button
              onClick={() => setViewMode("unified")}
              className={`p-1 rounded ${
                viewMode === "unified"
                  ? "bg-gray-700 text-white shadow"
                  : "text-gray-500 hover:text-gray-300"
              }`}
              title="Unified View"
            >
              <List className="w-3 h-3" />
            </button>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs transition-colors"
        >
          {copied ? (
            <Check className="w-3 h-3" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          {copied ? "Copied" : "Copy Improved"}
        </button>
      </div>
      <div className="flex-1 overflow-auto bg-[#0d1117] relative">
        {viewMode === "split" ? renderSplitView() : renderUnifiedView()}
      </div>
    </div>
  );
};
