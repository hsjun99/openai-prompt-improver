import React, { useRef, useEffect } from "react";
import { FileText, GitCompare, Check } from "lucide-react";
import { DiffViewer } from "./DiffViewer";
import { PatchResult } from "../types";

interface PromptEditorProps {
  activeView: "editor" | "diff";
  setActiveView: (view: "editor" | "diff") => void;
  promptInput: string;
  setPromptInput: (value: string) => void;
  patch: PatchResult | null;
  setPatch: (patch: PatchResult) => void;
  diffOriginal: string | null;
  handleReset: () => void;
  handleAccept: () => void;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({
  activeView,
  setActiveView,
  promptInput,
  setPromptInput,
  patch,
  setPatch,
  diffOriginal,
  handleReset,
  handleAccept,
}) => {
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#0c0c0e]">
      {/* Toolbar */}
      <div className="h-12 bg-[#09090b] border-b border-white/10 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white/5 p-0.5 rounded-lg border border-white/5 mr-2">
            <button
              onClick={() => setActiveView("editor")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${
                activeView === "editor"
                  ? "bg-[#1e1e1e] text-white shadow-sm ring-1 ring-white/10"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              System Prompt
            </button>
            {patch && (
              <button
                onClick={() => setActiveView("diff")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${
                  activeView === "diff"
                    ? "bg-[#1e1e1e] text-white shadow-sm ring-1 ring-white/10"
                    : "text-emerald-400 hover:text-emerald-300"
                }`}
              >
                <GitCompare className="w-3.5 h-3.5" />
                Diff Review
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative bg-[#1e1e1e] flex min-h-0">
        {activeView === "diff" && patch ? (
          /* Diff View Mode */
          <div className="flex-1 flex flex-col h-full">
            <div className="flex-1 relative overflow-hidden">
              <DiffViewer
                original={diffOriginal || promptInput}
                modified={patch.revisedPrompt}
                onRevert={(newPrompt) => {
                  if (patch) {
                    setPromptInput(newPrompt);
                    setPatch({
                      ...patch,
                      revisedPrompt: newPrompt,
                    });
                  }
                }}
              />
            </div>

            {/* Diff Actions Footer */}
            <div className="h-16 bg-[#09090b] border-t border-white/10 flex items-center justify-end px-6 gap-3 shrink-0 z-10">
              <span className="text-xs text-gray-500 mr-auto flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                Reviewing suggested changes
              </span>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-md transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2"
              >
                <Check className="w-3.5 h-3.5" />
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Editor Mode */
          <>
            {/* Line Numbers */}
            <div
              ref={lineNumbersRef}
              className="w-12 bg-[#09090b] border-r border-white/5 flex flex-col items-end pt-4 pr-3 text-gray-600 font-mono text-xs leading-6 select-none shrink-0 overflow-hidden"
            >
              {Array.from({
                length: Math.max(promptInput.split("\n").length, 30),
              }).map((_, i) => (
                <div key={i} className="h-6">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Text Area */}
            <div className="flex-1 relative">
              <textarea
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onScroll={(e) => {
                  if (lineNumbersRef.current) {
                    lineNumbersRef.current.scrollTop =
                      e.currentTarget.scrollTop;
                  }
                }}
                className="absolute inset-0 w-full h-full bg-[#1e1e1e] p-4 font-mono text-xs text-gray-300 resize-none focus:outline-none leading-6 whitespace-pre overflow-auto selection:bg-indigo-500/20 scrollbar-thin scrollbar-thumb-gray-700"
                placeholder="// Paste your system prompt here..."
                spellCheck={false}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
