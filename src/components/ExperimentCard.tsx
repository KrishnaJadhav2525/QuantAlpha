'use client';

import React, { useState } from 'react';
import { StructuredExperiment } from '@/types/experiment';
import {
  Copy,
  Check,
  Download,
  BookmarkPlus
} from 'lucide-react';

interface ExperimentCardProps {
  experiment: StructuredExperiment;
  onSaveToHistory: (experimentToSave: StructuredExperiment) => void;
  isSaved?: boolean;
}

function buildMarkdownSpecification(experiment: StructuredExperiment): string {
  const timeframe = experiment.timeframe || 'Not specified';
  const entry = experiment.entryCondition || 'Not specified';
  const exit = experiment.exitCondition || 'Not specified';
  const holding = experiment.holdingPeriod || 'Not specified';
  const filter =
    experiment.filters.length > 0 ? experiment.filters.join(', ') : 'None';

  return `# STRUCTURED EXPERIMENT
ID: ${experiment.id}
Date: ${experiment.createdAt}
Status: ${experiment.isFullySpecified ? 'COMPLETE' : 'INCOMPLETE'}

## Question
${experiment.targetHypothesis}

## Parameters
- Instrument: ${experiment.instrument || 'Not specified'} (${experiment.assetClass})
- Timeframe: ${timeframe}
- Direction: ${experiment.direction}
- Entry Condition: ${entry}
- Filter: ${filter}
- Exit Condition: ${exit}
- Holding Period: ${holding}
- Benchmark: ${experiment.benchmark}
`;
}

function buildPythonScript(experiment: StructuredExperiment): string {
  const tickerSymbol = (experiment.instrument || '').includes('NIFTY')
    ? '^NSEI'
    : experiment.instrument || 'TICKER';
  const filterText =
    experiment.filters.length > 0 ? experiment.filters.join(', ') : 'None';

  return `"""
Backtest Specification
Instrument: ${experiment.instrument || 'NIFTY 50'}
Timeframe: ${experiment.timeframe || 'Daily'}
Entry: ${experiment.entryCondition || 'Not specified'}
Exit: ${experiment.exitCondition || 'Not specified'}
Holding: ${experiment.holdingPeriod || 'Not specified'}
Filter: ${filterText}
"""
import vectorbt as vbt
import pandas as pd

# 1. Download Historical Data
price = vbt.YFData.download(
    "${tickerSymbol}",
    start="2022-01-01",
    end="2024-12-31"
).get("Close")

# 2. Strategy Logic
returns = price.pct_change()
entry_signals = returns <= -0.01

# 3. Simulate Strategy
portfolio = vbt.Portfolio.from_signals(
    price,
    entries=entry_signals,
    exits=None,
    freq="1D"
)

# 4. View Statistics
print(portfolio.stats())
`;
}

function triggerDownload(fileName: string, contentText: string): void {
  const textBlob = new Blob([contentText], { type: 'text/markdown' });
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
  const [activeTab, setActiveTab] = useState<'ticket' | 'json' | 'python'>('ticket');

  const handleCopy = () => {
    let contentToCopy = '';
    if (activeTab === 'python') {
      contentToCopy = buildPythonScript(experiment);
    } else if (activeTab === 'json') {
      contentToCopy = JSON.stringify(experiment, null, 2);
    } else {
      contentToCopy = buildMarkdownSpecification(experiment);
    }

    navigator.clipboard.writeText(contentToCopy);
    setHasCopiedToClipboard(true);
    setTimeout(() => setHasCopiedToClipboard(false), 1500);
  };

  const handleDownload = () => {
    const markdownContent = buildMarkdownSpecification(experiment);
    const fileName = `${experiment.id}_experiment.md`;
    triggerDownload(fileName, markdownContent);
  };

  const isComplete = experiment.isFullySpecified;
  const filterDisplay =
    experiment.filters && experiment.filters.length > 0
      ? experiment.filters.join(', ')
      : 'None';

  return (
    <div className="bg-white border border-zinc-300 rounded-sm shadow-sm overflow-hidden font-mono">
      {/* Header Strip */}
      <div className="bg-zinc-950 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            Structured Experiment
          </span>
          <span className="text-zinc-600 text-xs">/</span>
          <span
            className={`text-[9px] px-2 py-0.5 rounded-xs border font-bold uppercase ${
              isComplete
                ? 'border-emerald-500 bg-emerald-950 text-emerald-300'
                : 'border-zinc-700 bg-zinc-900 text-zinc-400'
            }`}
          >
            {isComplete ? 'COMPLETE' : 'INCOMPLETE'}
          </span>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex items-center space-x-1.5 self-start sm:self-auto">
          <div className="flex items-center rounded-sm bg-zinc-900 border border-zinc-800 p-0.5 text-xs">
            <button
              onClick={() => setActiveTab('ticket')}
              className={`px-3 py-1 rounded-xs transition-colors ${
                activeTab === 'ticket'
                  ? 'bg-white text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Ticket
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
            title="Download"
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

      {/* Ticket View */}
      {activeTab === 'ticket' && (
        <div className="p-5 space-y-4">
          {/* Question / Core Thesis */}
          <div className="p-3.5 rounded-sm border border-zinc-200 bg-zinc-50">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
              Research Question
            </span>
            <p className="text-sm font-bold text-zinc-950">
              &ldquo;{experiment.targetHypothesis}&rdquo;
            </p>
          </div>

          {/* Clean Parameters Table */}
          <div className="border border-zinc-200 rounded-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100 text-zinc-700 uppercase text-[10px] border-b border-zinc-200 font-bold">
                <tr>
                  <th className="py-2.5 px-3">Parameter</th>
                  <th className="py-2.5 px-3">Value</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-zinc-900">
                <tr className="hover:bg-zinc-50">
                  <td className="py-2.5 px-3 font-semibold text-zinc-700">Instrument</td>
                  <td className="py-2.5 px-3 font-bold text-zinc-950">
                    {experiment.instrument || 'Not specified'}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-1.5 py-0.2 rounded-xs border text-[10px] font-bold ${
                        experiment.instrument
                          ? 'border-zinc-900 bg-zinc-900 text-white'
                          : 'border-zinc-300 bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {experiment.instrument ? 'SPECIFIED' : 'NOT SPECIFIED'}
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-zinc-50">
                  <td className="py-2.5 px-3 font-semibold text-zinc-700">Timeframe</td>
                  <td className="py-2.5 px-3 font-bold text-zinc-950">
                    {experiment.timeframe || 'Not specified'}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-1.5 py-0.2 rounded-xs border text-[10px] font-bold ${
                        experiment.timeframe
                          ? 'border-zinc-900 bg-zinc-900 text-white'
                          : 'border-zinc-300 bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {experiment.timeframe ? 'SPECIFIED' : 'NOT SPECIFIED'}
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-zinc-50">
                  <td className="py-2.5 px-3 font-semibold text-zinc-700">Direction</td>
                  <td className="py-2.5 px-3 font-bold text-zinc-950">
                    {experiment.direction}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-1.5 py-0.2 rounded-xs border text-[10px] font-bold ${
                        experiment.direction !== 'UNSPECIFIED'
                          ? 'border-zinc-900 bg-zinc-900 text-white'
                          : 'border-zinc-300 bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {experiment.direction !== 'UNSPECIFIED' ? 'SPECIFIED' : 'NOT SPECIFIED'}
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-zinc-50">
                  <td className="py-2.5 px-3 font-semibold text-zinc-700">Entry Condition</td>
                  <td className="py-2.5 px-3 font-bold text-zinc-950">
                    {experiment.entryCondition || 'Not specified'}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-1.5 py-0.2 rounded-xs border text-[10px] font-bold ${
                        experiment.entryCondition
                          ? 'border-zinc-900 bg-zinc-900 text-white'
                          : 'border-zinc-300 bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {experiment.entryCondition ? 'SPECIFIED' : 'NOT SPECIFIED'}
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-zinc-50">
                  <td className="py-2.5 px-3 font-semibold text-zinc-700">Filter</td>
                  <td className="py-2.5 px-3 font-bold text-zinc-950">
                    {filterDisplay}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-1.5 py-0.2 rounded-xs border text-[10px] font-bold ${
                        experiment.filters.length > 0
                          ? 'border-zinc-900 bg-zinc-900 text-white'
                          : 'border-zinc-300 bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {experiment.filters.length > 0 ? 'SPECIFIED' : 'NONE'}
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-zinc-50">
                  <td className="py-2.5 px-3 font-semibold text-zinc-700">Exit Condition</td>
                  <td className="py-2.5 px-3 font-bold text-zinc-950">
                    {experiment.exitCondition || 'Not specified'}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-1.5 py-0.2 rounded-xs border text-[10px] font-bold ${
                        experiment.exitCondition && experiment.exitCondition !== 'Not specified'
                          ? 'border-zinc-900 bg-zinc-900 text-white'
                          : 'border-zinc-300 bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {experiment.exitCondition && experiment.exitCondition !== 'Not specified'
                        ? 'SPECIFIED'
                        : 'NOT SPECIFIED'}
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-zinc-50">
                  <td className="py-2.5 px-3 font-semibold text-zinc-700">Holding Period</td>
                  <td className="py-2.5 px-3 font-bold text-zinc-950">
                    {experiment.holdingPeriod || 'Not specified'}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-1.5 py-0.2 rounded-xs border text-[10px] font-bold ${
                        experiment.holdingPeriod && experiment.holdingPeriod !== 'Not specified'
                          ? 'border-zinc-900 bg-zinc-900 text-white'
                          : 'border-zinc-300 bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {experiment.holdingPeriod && experiment.holdingPeriod !== 'Not specified'
                        ? 'SPECIFIED'
                        : 'NOT SPECIFIED'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
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
            {buildPythonScript(experiment)}
          </pre>
        </div>
      )}
    </div>
  );
};
