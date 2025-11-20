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
              <span className="w-12 flex-shrink-0 text-right pr-4 select-none text-gray-600 text-[10px] font-mono py-1 bg-[#0d1117] border-r border-gray-800/50 opacity-50 h-full flex items-start justify-end leading-relaxed">
                {line.originalIndex}
              </span>
              <span className="whitespace-pre-wrap break-all font-mono text-xs py-1 pl-4 opacity-70 leading-relaxed">
                {line.content || " "}
              </span>
            </div>
            <div className="flex text-gray-400">
              <span className="w-12 flex-shrink-0 text-right pr-4 select-none text-gray-600 text-[10px] font-mono py-1 bg-[#0d1117] border-r border-gray-800/50 opacity-50 h-full flex items-start justify-end leading-relaxed">
                {line.modifiedIndex}
              </span>
              <span className="whitespace-pre-wrap break-all font-mono text-xs py-1 pl-4 opacity-70 leading-relaxed">
                {line.content || " "}
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
              className="grid grid-cols-2 group border-b border-gray-800/30 last:border-0"
            >
              {/* LEFT SIDE (Original/Removed) */}
              <div className={`flex ${rem ? "bg-red-900/10" : ""}`}>
                {rem ? (
                  <>
                    <span className="w-12 flex-shrink-0 text-right pr-4 select-none text-red-500/50 text-[10px] font-mono py-1 bg-red-900/20 border-r border-red-900/20 h-full flex items-start justify-end leading-relaxed">
                      {rem.originalIndex}
                    </span>
                    <span className="whitespace-pre-wrap break-all font-mono text-xs text-red-200/90 py-1 pl-4 leading-relaxed">
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
                    <span className="w-12 flex-shrink-0 text-right pr-4 select-none text-emerald-500/50 text-[10px] font-mono py-1 bg-emerald-900/20 border-r border-emerald-900/20 h-full flex items-start justify-end leading-relaxed">
                      {add.modifiedIndex}
                    </span>
                    <span className="whitespace-pre-wrap break-all font-mono text-xs text-emerald-200/90 py-1 pl-4 leading-relaxed">
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
      }
    }
    return rows;
  };

  const renderUnifiedView = () => {
    return diffLines.map((line, i) => {
      let bgClass = "hover:bg-gray-800/50";
      let textClass = "text-gray-400 opacity-70";
      let lineNumClass =
        "text-gray-600 bg-[#0d1117] border-gray-800/50 opacity-50";
      let gutterClass = "text-gray-600";

      if (line.type === "add") {
        bgClass = "bg-emerald-900/10 hover:bg-emerald-900/20";
        textClass = "text-emerald-200/90 opacity-100";
        lineNumClass =
          "text-emerald-600/50 bg-emerald-900/20 border-emerald-900/30";
        gutterClass = "text-emerald-600/50";
      } else if (line.type === "remove") {
        bgClass = "bg-red-900/10 hover:bg-red-900/20";
        textClass = "text-red-200/90 opacity-100";
        lineNumClass = "text-red-600/50 bg-red-900/20 border-red-900/30";
        gutterClass = "text-red-600/50";
      }

      return (
        <div
          key={i}
          className={`flex ${bgClass} border-b border-gray-800/30 last:border-0 group transition-colors duration-75`}
        >
          {/* Line Numbers */}
          <div className="flex select-none w-24 flex-shrink-0 border-r border-gray-800/50">
            <div
              className={`w-12 text-right pr-3 py-1 text-[10px] font-mono h-full flex items-start justify-end leading-relaxed ${
                line.type === "add" ? "opacity-0" : ""
              } ${gutterClass}`}
            >
              {line.originalIndex}
            </div>
            <div
              className={`w-12 text-right pr-3 py-1 text-[10px] font-mono h-full flex items-start justify-end leading-relaxed ${
                line.type === "remove" ? "opacity-0" : ""
              } ${gutterClass}`}
            >
              {line.modifiedIndex}
            </div>
          </div>
          {/* Content */}
          <div className="flex-1 py-1 pl-4 overflow-hidden">
            <span
              className={`whitespace-pre-wrap break-all font-mono text-xs leading-relaxed ${textClass}`}
            >
              {line.type === "add" && "+ "}
              {line.type === "remove" && "- "}
              {line.type === "equal" && "  "}
              {line.content || " "}
            </span>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] border border-gray-800 rounded-lg overflow-hidden shadow-lg">
      <div className="bg-[#161b22] px-4 py-2 flex justify-between items-center border-b border-gray-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileDiff className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              Diff View
            </span>
          </div>

          {/* Diff Stats Pill */}
          <div className="flex items-center gap-3 px-3 py-1 bg-[#0d1117] rounded-full border border-gray-800/50">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
              <span>+{stats.added}</span>
              <span className="text-gray-600">added</span>
            </div>
            <div className="w-[1px] h-3 bg-gray-800"></div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-red-400">
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
