"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Header } from "../components/Header";
import { PromptEditor } from "../components/PromptEditor";
import { AIPanel } from "../components/AIPanel";
import { usePromptStudio } from "../hooks/usePromptStudio";

export default function Page() {
  const {
    promptInput,
    setPromptInput,
    failureInput,
    setFailureInput,
    currentScenario,
    step,
    analysis,
    patchPlan,
    patch,
    setPatch,
    appliedIndices,
    processingIndex,
    error,
    diffOriginal,
    activeView,
    setActiveView,
    isPatchExpanded,
    setIsPatchExpanded,
    modelReasoning,
    setModelReasoning,
    handleRun,
    handleApplySinglePatch,
    handleReset,
    handleAccept,
  } = usePromptStudio();

  // Resizable Panel State
  const [rightPanelWidth, setRightPanelWidth] = useState(400);
  const [isDragging, setIsDragging] = useState(false);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth > 300 && newWidth < 800) {
          setRightPanelWidth(newWidth);
        }
      }
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      className={`h-screen bg-[#09090b] text-gray-300 selection:bg-indigo-500/30 flex flex-col font-sans overflow-hidden ${
        isDragging ? "cursor-col-resize select-none" : ""
      }`}
    >
      <Header />

      <div className="flex-1 flex min-h-0 relative">
        {/* Main Area (Left) - Editor OR Diff View */}
        <PromptEditor
          activeView={activeView}
          setActiveView={setActiveView}
          promptInput={promptInput}
          setPromptInput={setPromptInput}
          patch={patch}
          setPatch={(newPatch) => setPatch(newPatch || patch!)}
          diffOriginal={diffOriginal}
          handleReset={handleReset}
          handleAccept={handleAccept}
        />

        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          className={`w-[1px] hover:w-[4px] group cursor-col-resize bg-white/10 hover:bg-indigo-500 transition-all z-50 flex flex-col justify-center items-center relative ${
            isDragging ? "!w-[4px] !bg-indigo-500" : ""
          }`}
        >
          <div className="absolute inset-y-0 -left-2 -right-2 z-10 bg-transparent"></div>
        </div>

        {/* AI Pane (Right) */}
        <AIPanel
          width={rightPanelWidth}
          step={step}
          analysis={analysis}
          patchPlan={patchPlan}
          currentScenario={currentScenario}
          failureInput={failureInput}
          setFailureInput={setFailureInput}
          promptInput={promptInput}
          isPatchExpanded={isPatchExpanded}
          setIsPatchExpanded={setIsPatchExpanded}
          appliedIndices={appliedIndices}
          processingIndex={processingIndex}
          error={error}
          modelReasoning={modelReasoning}
          setModelReasoning={setModelReasoning}
          handleRun={handleRun}
          handleAccept={handleAccept}
          handleApplySinglePatch={handleApplySinglePatch}
        />
      </div>
    </div>
  );
}
