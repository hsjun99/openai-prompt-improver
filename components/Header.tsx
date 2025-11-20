import React from "react";
import { Terminal } from "lucide-react";

export const Header: React.FC = () => {
  return (
    <header className="h-10 bg-[#09090b] border-b border-white/10 flex items-center justify-between px-4 shrink-0 select-none z-50">
      <div className="flex items-center gap-3">
        <div className="flex gap-2 group">
          <div className="w-3 h-3 rounded-full bg-red-500/20 group-hover:bg-red-500 transition-colors border border-red-500/30"></div>
          <div className="w-3 h-3 rounded-full bg-amber-500/20 group-hover:bg-amber-500 transition-colors border border-amber-500/30"></div>
          <div className="w-3 h-3 rounded-full bg-emerald-500/20 group-hover:bg-emerald-500 transition-colors border border-emerald-500/30"></div>
        </div>
        <div className="h-4 w-[1px] bg-white/10 mx-2"></div>
        <span className="text-xs font-medium text-gray-400 flex items-center gap-2 font-mono">
          <Terminal className="w-3 h-3" /> metaprompt-studio
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-500 px-2 py-1 bg-white/5 rounded border border-white/10">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
          gpt-5.1
        </div>
      </div>
    </header>
  );
};
