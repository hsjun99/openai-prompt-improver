import React from 'react';
import { AnalysisResult } from '../types';
import { AlertTriangle, Search } from 'lucide-react';

interface AnalysisViewProps {
  analysis: AnalysisResult | null;
  isAnalyzing: boolean;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis, isAnalyzing }) => {
  if (isAnalyzing) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 animate-pulse p-12 border border-gray-800 rounded-lg bg-gray-900/50">
        <Search className="w-12 h-12 text-indigo-500 animate-bounce" />
        <p className="text-indigo-300 font-mono">Analyzing failure modes...</p>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-4 bg-gray-900/50 rounded-lg border border-gray-800 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-500/20 rounded-lg">
          <Search className="w-5 h-5 text-indigo-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Diagnosis</h3>
      </div>
      
      <div className="prose prose-invert max-w-none">
        <p className="text-gray-400 text-sm italic border-l-2 border-indigo-500 pl-4 py-1">
          {analysis.rawAnalysis}
        </p>
      </div>

      <div className="grid gap-4 mt-6">
        {analysis.failureModes?.map((mode, idx) => (
          <div key={idx} className="bg-red-900/10 border border-red-900/30 rounded-md p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-200 text-sm">{mode.name}</h4>
                <p className="text-gray-400 text-sm mt-1">{mode.description}</p>
                {Array.isArray(mode.drivers) && mode.drivers.length > 0 && (
                   <div className="mt-3 space-y-1">
                     <span className="text-xs uppercase tracking-wider text-red-500/70 font-bold">Drivers found in prompt:</span>
                     <ul className="space-y-2 mt-1">
                       {mode.drivers.map((driver, dIdx) => (
                         <li key={dIdx} className="text-xs font-mono bg-black/20 p-2 rounded border-l-2 border-red-900/50">
                            <div className="text-red-300/90">"{driver.line}"</div>
                            <div className="text-gray-500 mt-1 italic">→ {driver.why}</div>
                         </li>
                       ))}
                     </ul>
                   </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
