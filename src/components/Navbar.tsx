'use client';

import React from 'react';
import { Terminal, Cpu, History, Settings } from 'lucide-react';

interface NavbarProps {
  engine: 'groq-gpt-oss-120b' | 'gemini-2.0-flash' | 'smart-heuristic-parser';
  latencyMs?: number;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  historyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  engine,
  latencyMs,
  onOpenSettings,
  onOpenHistory,
  historyCount
}) => {
  const hasSavedExperiments = historyCount > 0;

  return (
    <header className="border-b border-zinc-800 bg-zinc-950 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-sm bg-white text-zinc-950 flex items-center justify-center font-bold">
            <Terminal className="w-4 h-4" />
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="font-mono font-bold text-sm tracking-wider uppercase text-white">
              Terminal
            </span>
            <span className="text-zinc-600 font-mono text-xs">/</span>
            <span className="font-mono text-xs text-zinc-400">Quant Research</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onOpenSettings}
            className="elevated-button-dark flex items-center space-x-1.5 px-2.5 py-1 rounded-sm text-xs font-mono text-zinc-300"
            title="Configure Engine"
          >
            <Cpu className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-200">GROQ · GPT-OSS-120B</span>
          </button>

          <button
            onClick={onOpenHistory}
            className="elevated-button-dark flex items-center space-x-1.5 px-2.5 py-1 rounded-sm text-xs font-mono text-zinc-300"
          >
            <History className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Saved</span>
            {hasSavedExperiments && (
              <span className="px-1.5 py-0.2 rounded-sm text-[10px] font-mono bg-white text-zinc-950 font-bold">
                {historyCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenSettings}
            className="elevated-button-dark p-1.5 rounded-sm text-zinc-400 hover:text-white"
            aria-label="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
