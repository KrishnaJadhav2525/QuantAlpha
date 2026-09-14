'use client';

import React, { useState } from 'react';
import { StructuredExperiment } from '@/types/experiment';
import {
  Copy,
  Check,
  Download,
  BookmarkPlus,
  ArrowRight,
  Layers,
  FileText,
  Sliders,
  ShieldCheck,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

interface ExperimentCardProps {
  experiment: StructuredExperiment;
  onSaveToHistory: (experimentToSave: StructuredExperiment) => void;
  isSaved?: boolean;
}

function buildMarkdownProtocol(experiment: StructuredExperiment): string {
  const timeframe = experiment.timeframe || 'Not specified';
  const entry = experiment.entryCondition || 'Not specified';
  const exit = experiment.exitCondition || 'Not specified';
  const holding = experiment.holdingPeriod || 'Not specified';
  const filter =
    experiment.filters.length > 0 ? experiment.filters.join(', ') : 'None (All market regimes)';

  return `# QUANTITATIVE EXPERIMENT PROTOCOL
ID: ${experiment.id}
Date: ${experiment.createdAt}
Status: ${experiment.isFullySpecified ? 'READY FOR TESTING' : 'PARAMETERS INCOMPLETE'}

## 1. Research Hypothesis & Objective
- Question: "${experiment.targetHypothesis}"
- Strategy Family: Mean Reversion / Pullback Strategy
- Target Asset: ${experiment.instrument} (${experiment.assetClass})
- Null Hypothesis (H0): Post-pullback returns in ${experiment.instrument} do not exceed unconditional market returns.
- Alternative Hypothesis (H1): Buying pullbacks during ${filter} produces a statistically significant positive forward return.

## 2. Sequential Execution Lifecycle
1. Regime Filter: ${filter}
2. Signal Trigger: ${entry} (Resolution: ${timeframe})
3. Position Order: ${experiment.direction} ${experiment.instrument} at trigger bar close
4. Risk & Exit Boundary: Hold for ${holding}, subject to exit rule: ${exit}

## 3. Experimental Test & Control Design
| Dimension | Test Group | Control Group (Baseline) |
| :--- | :--- | :--- |
| Market Condition | Days with ${filter} | All historical trading days |
| Entry Condition | Close drops ${entry} | Random or unconditional entry |
| Evaluation Horizon | ${holding} forward window | Equivalent duration benchmark |
| Benchmark Index | ${experiment.benchmark} | ${experiment.benchmark} Buy & Hold |
| Success Criteria | Alpha > 0 net of friction | Baseline market drift |
`;
}

function buildPythonVectorBTScript(experiment: StructuredExperiment): string {
  const tickerSymbol = (experiment.instrument || '').includes('NIFTY')
    ? '^NSEI'
    : experiment.instrument || 'TICKER';
  const filterText =
    experiment.filters.length > 0 ? experiment.filters.join(', ') : 'None';

  return `"""
Quantitative Experiment Backtest Specification
Generated for: ${experiment.instrument || 'NIFTY 50'}
Timeframe: ${experiment.timeframe || 'Daily'}
Hypothesis: ${experiment.targetHypothesis}
Filter: ${filterText}
"""
import vectorbt as vbt
import pandas as pd
import numpy as np

# 1. Historical OHLCV Data Ingestion
price_series = vbt.YFData.download(
    "${tickerSymbol}",
    start="2022-01-01",
    end="2024-12-31"
).get("Close")

# 2. Compute Entry Signals (Pullback condition)
daily_returns = price_series.pct_change()
entry_signals = daily_returns <= -0.01

# 3. Simulate Portfolio Performance
portfolio = vbt.Portfolio.from_signals(
    price_series,
    entries=entry_signals,
    exits=None,
    freq="1D"
)

# 4. Statistical Edge Evaluation
print("=== EXPERIMENT SUMMARY ===")
print(portfolio.stats())
`;
}

function triggerDownload(fileName: string, textContent: string): void {
  const textBlob = new Blob([textContent], { type: 'text/markdown' });
  const objectUrl = URL.createObjectURL(textBlob);
  const anchorElement = document.createElement('a');
  anchorElement.href = objectUrl;
  anchorElement.download = fileName;
  anchorElement.click();
  URL.revokeObjectURL(objectUrl);
}

export const ExperimentCard: React.FC<ExperimentCardProps> = ({
  experiment,
  onSaveToHistory,
  isSaved = false
}) => {
  const [hasCopiedToClipboard, setHasCopiedToClipboard] = useState(false);
  const [activeTab, setActiveTab] = useState<'protocol' | 'json' | 'python'>('protocol');

  const handleCopy = () => {
    let contentToCopy = '';
    if (activeTab === 'python') {
      contentToCopy = buildPythonVectorBTScript(experiment);
    } else if (activeTab === 'json') {
      contentToCopy = JSON.stringify(experiment, null, 2);
    } else {
      contentToCopy = buildMarkdownProtocol(experiment);
    }

    navigator.clipboard.writeText(contentToCopy);
    setHasCopiedToClipboard(true);
    setTimeout(() => setHasCopiedToClipboard(false), 1500);
  };

  const handleDownload = () => {
    const markdownContent = buildMarkdownProtocol(experiment);
    const fileName = `${experiment.id}_experiment_protocol.md`;
    triggerDownload(fileName, markdownContent);
  };

  const isReady = experiment.isFullySpecified;
  const hasFilter = experiment.filters && experiment.filters.length > 0;
  const filterDisplay = hasFilter ? experiment.filters.join(', ') : 'All market regimes';

  const isExitDefined =
    experiment.exitCondition &&
    experiment.exitCondition !== 'Not specified' &&
    !experiment.exitCondition.toLowerCase().includes('clarification required');

  const isHoldingDefined =
    experiment.holdingPeriod &&
    experiment.holdingPeriod !== 'Not specified' &&
    !experiment.holdingPeriod.toLowerCase().includes('clarification required');

  const isTimeframeDefined =
    experiment.timeframe &&
    experiment.timeframe !== 'Not specified';

  return (
    <div className="bg-white border-2 border-zinc-950 rounded-sm shadow-sm overflow-hidden font-mono">
      {/* Top Header Strip */}
      <div className="bg-zinc-950 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 bg-white text-zinc-950 rounded-xs">
              EXPERIMENT PROTOCOL #{experiment.id}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-xs border font-bold uppercase ${
                isReady
                  ? 'border-emerald-500 bg-emerald-950/80 text-emerald-300'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-400'
              }`}
            >
              {isReady ? 'READY FOR TESTING' : 'PARAMETERS INCOMPLETE'}
            </span>
          </div>
          <h2 className="text-sm sm:text-base font-bold text-zinc-100 uppercase tracking-tight">
            {experiment.title}
          </h2>
        </div>

        {/* View Switcher & Action Controls */}
        <div className="flex items-center space-x-1.5 self-start sm:self-auto">
          <div className="flex items-center rounded-sm bg-zinc-900 border border-zinc-800 p-0.5 text-xs">
            <button
              onClick={() => setActiveTab('protocol')}
              className={`px-3 py-1 rounded-xs transition-colors ${
                activeTab === 'protocol'
                  ? 'bg-white text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Protocol
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1 rounded-xs transition-colors ${
                activeTab === 'json'
                  ? 'bg-white text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              JSON
            </button>
            <button
              onClick={() => setActiveTab('python')}
              className={`px-3 py-1 rounded-xs transition-colors ${
                activeTab === 'python'
                  ? 'bg-white text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Python
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="elevated-button-dark p-1.5 rounded-xs text-zinc-300 hover:text-white"
            title="Copy"
          >
            {hasCopiedToClipboard ? (
              <Check className="w-3.5 h-3.5 text-white" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            onClick={handleDownload}
            className="elevated-button-dark p-1.5 rounded-xs text-zinc-300 hover:text-white"
            title="Download Markdown Protocol"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onSaveToHistory(experiment)}
            disabled={isSaved}
            className="elevated-button-dark px-2.5 py-1 rounded-xs text-xs text-zinc-200 hover:text-white flex items-center space-x-1 disabled:opacity-40"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Protocol Main View */}
      {activeTab === 'protocol' && (
        <div className="p-5 space-y-6">
          {/* Section A: Research Hypothesis & Scientific Objective */}
          <div className="border border-zinc-300 bg-zinc-50 p-4 rounded-sm space-y-2.5">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <span className="flex items-center space-x-1.5 text-xs font-bold text-zinc-950 uppercase tracking-wider">
                <FileText className="w-4 h-4 text-zinc-800" />
                <span>Section A · Research Hypothesis & Scientific Objective</span>
              </span>
              <span className="text-[10px] font-semibold text-zinc-500 uppercase px-1.5 py-0.5 bg-zinc-200/70 rounded-xs">
                Strategy Family: Mean Reversion
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-zinc-500 uppercase">
                Core Research Question
              </span>
              <p className="text-sm font-bold text-zinc-950">
                &ldquo;{experiment.targetHypothesis}&rdquo;
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs text-zinc-700">
              <div className="p-2.5 bg-white border border-zinc-200 rounded-xs space-y-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase block">
                  Null Hypothesis (H0)
                </span>
                <p>
                  Returns of <span className="font-semibold text-zinc-950">{experiment.instrument}</span> following a drop are random noise; high-volatility periods offer no statistically meaningful bounce edge.
                </p>
              </div>

              <div className="p-2.5 bg-white border border-zinc-200 rounded-xs space-y-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase block">
                  Alternative Hypothesis (H1)
                </span>
                <p>
                  Liquidity pullbacks during <span className="font-semibold text-zinc-950">{filterDisplay}</span> create oversold mean-reversion with positive forward expectancy over the specified horizon.
                </p>
              </div>
            </div>
          </div>

          {/* Section B: Sequential Execution Lifecycle Flow */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-1.5 text-xs font-bold text-zinc-950 uppercase tracking-wider">
                <Layers className="w-4 h-4 text-zinc-800" />
                <span>Section B · Sequential Strategy Lifecycle Flow</span>
              </span>
              <span className="text-[11px] text-zinc-500">
                4-Stage Automated Execution Chain
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
              {/* Stage 1: Regime Filter */}
              <div className="border border-zinc-300 bg-white p-3.5 rounded-sm space-y-1.5 shadow-xs relative">
                <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase">
                  <span>1 · Market Filter</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400 hidden md:block" />
                </div>
                <div className="text-xs font-bold text-zinc-950">
                  Regime Gate
                </div>
                <div className="text-xs text-zinc-800 font-medium">
                  {filterDisplay}
                </div>
                <div className="text-[10px] text-zinc-500 pt-1 border-t border-zinc-100">
                  Pre-condition required before signal scan
                </div>
              </div>

              {/* Stage 2: Signal Trigger */}
              <div className="border border-zinc-300 bg-white p-3.5 rounded-sm space-y-1.5 shadow-xs relative">
                <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase">
                  <span>2 · Signal Trigger</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400 hidden md:block" />
                </div>
                <div className="text-xs font-bold text-zinc-950">
                  Entry Rule
                </div>
                <div className="text-xs text-zinc-800 font-medium">
                  {experiment.entryCondition || 'Unspecified'}
                </div>
                <div className="text-[10px] text-zinc-500 pt-1 border-t border-zinc-100">
                  Resolution: {isTimeframeDefined ? experiment.timeframe : 'Pending timeframe'}
                </div>
              </div>

              {/* Stage 3: Position Order */}
              <div className="border border-zinc-300 bg-white p-3.5 rounded-sm space-y-1.5 shadow-xs relative">
                <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase">
                  <span>3 · Execution</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400 hidden md:block" />
                </div>
                <div className="text-xs font-bold text-zinc-950">
                  Order Filled
                </div>
                <div className="text-xs text-zinc-800 font-medium">
                  {experiment.direction} {experiment.instrument}
                </div>
                <div className="text-[10px] text-zinc-500 pt-1 border-t border-zinc-100">
                  Benchmark: {experiment.benchmark}
                </div>
              </div>

              {/* Stage 4: Risk & Exit Envelope */}
              <div
                className={`border p-3.5 rounded-sm space-y-1.5 shadow-xs ${
                  isReady
                    ? 'border-zinc-300 bg-white'
                    : 'border-zinc-400 bg-zinc-50 border-dashed'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase">
                  <span>4 · Closure</span>
                  {isReady ? (
                    <Check className="w-3.5 h-3.5 text-zinc-950" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-zinc-500" />
                  )}
                </div>
                <div className="text-xs font-bold text-zinc-950">
                  Exit & Risk Boundary
                </div>
                <div className="text-xs text-zinc-800 font-medium">
                  Horizon: {isHoldingDefined ? experiment.holdingPeriod : 'Pending'}
                </div>
                <div className="text-[10px] text-zinc-500 pt-1 border-t border-zinc-100 truncate">
                  Exit: {isExitDefined ? experiment.exitCondition : 'Pending stop rules'}
                </div>
              </div>
            </div>
          </div>

          {/* Section C: Experimental Test & Control Design Matrix */}
          <div className="space-y-2.5">
            <span className="flex items-center space-x-1.5 text-xs font-bold text-zinc-950 uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-zinc-800" />
              <span>Section C · Experimental Test & Control Design Matrix</span>
            </span>

            <div className="border border-zinc-200 rounded-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100 text-zinc-700 uppercase text-[10px] border-b border-zinc-200 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Experimental Dimension</th>
                    <th className="py-2.5 px-3">Test Group (Hypothesis)</th>
                    <th className="py-2.5 px-3">Control Group (Baseline)</th>
                    <th className="py-2.5 px-3">Measurement Standard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-zinc-800">
                  <tr className="hover:bg-zinc-50/70">
                    <td className="py-2.5 px-3 font-bold text-zinc-950">Market Environment</td>
                    <td className="py-2.5 px-3 font-medium">{filterDisplay}</td>
                    <td className="py-2.5 px-3 text-zinc-600">All historical market days</td>
                    <td className="py-2.5 px-3 text-zinc-500">Regime isolation filter</td>
                  </tr>
                  <tr className="hover:bg-zinc-50/70">
                    <td className="py-2.5 px-3 font-bold text-zinc-950">Trigger Condition</td>
                    <td className="py-2.5 px-3 font-medium">{experiment.entryCondition}</td>
                    <td className="py-2.5 px-3 text-zinc-600">Unconditional daily sessions</td>
                    <td className="py-2.5 px-3 text-zinc-500">Signal identification</td>
                  </tr>
                  <tr className="hover:bg-zinc-50/70">
                    <td className="py-2.5 px-3 font-bold text-zinc-950">Evaluation Horizon</td>
                    <td className="py-2.5 px-3 font-medium">{experiment.holdingPeriod}</td>
                    <td className="py-2.5 px-3 text-zinc-600">Buy & Hold equivalent window</td>
                    <td className="py-2.5 px-3 text-zinc-500">Forward return delta</td>
                  </tr>
                  <tr className="hover:bg-zinc-50/70">
                    <td className="py-2.5 px-3 font-bold text-zinc-950">Risk Constraints</td>
                    <td className="py-2.5 px-3 font-medium">{experiment.exitCondition}</td>
                    <td className="py-2.5 px-3 text-zinc-600">Zero stop protection</td>
                    <td className="py-2.5 px-3 text-zinc-500">Max drawdown mitigation</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* JSON View */}
      {activeTab === 'json' && (
        <div className="p-4 bg-zinc-950 text-zinc-200 overflow-x-auto">
          <pre className="text-xs leading-relaxed">
            {JSON.stringify(experiment, null, 2)}
          </pre>
        </div>
      )}

      {/* Python View */}
      {activeTab === 'python' && (
        <div className="p-4 bg-zinc-950 text-zinc-200 overflow-x-auto">
          <pre className="text-xs leading-relaxed">
            {buildPythonVectorBTScript(experiment)}
          </pre>
        </div>
      )}
    </div>
  );
};
