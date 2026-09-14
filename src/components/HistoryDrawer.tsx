'use client';

import React from 'react';
import { StructuredExperiment } from '@/types/experiment';
import { X, Trash2, ArrowRight } from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedExperiments: StructuredExperiment[];
  onSelectExperiment: (selectedExperiment: StructuredExperiment) => void;
  onDeleteExperiment: (experimentIdentifier: string) => void;
  onClearAll: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  savedExperiments,
  onSelectExperiment,
  onDeleteExperiment,
  onClearAll
}) => {
  if (!isOpen) {
    return null;
  }

  const hasNoSavedExperiments = savedExperiments.length === 0;
  const hasSavedExperiments = savedExperiments.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-zinc-300 shadow-2xl flex flex-col text-zinc-900">
          <div className="p-4 bg-zinc-950 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                Saved Experiments
              </span>
              <span className="text-zinc-400 font-mono text-xs">
                ({savedExperiments.length})
              </span>
            </div>

            <button
              onClick={onClose}
              className="elevated-button-dark p-1 rounded-sm text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-zinc-50">
            {hasNoSavedExperiments ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-4 border border-dashed border-zinc-300 rounded-sm text-zinc-500 font-mono text-xs space-y-1">
                <span>No saved experiments.</span>
                <span className="text-[11px] text-zinc-400">
                  Analyze a query and click Save to store it here.
                </span>
              </div>
            ) : (
              savedExperiments.map((savedExperimentItem) => {
                const isExperimentFullySpecified =
                  savedExperimentItem.isFullySpecified;
                const formattedCreationDate = new Date(
                  savedExperimentItem.createdAt
                ).toLocaleDateString();

                return (
                  <div
                    key={savedExperimentItem.id}
                    className="p-3 rounded-sm border border-zinc-200 bg-white hover:border-zinc-400 shadow-xs transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-1.5 text-[10px] font-mono text-zinc-500 mb-0.5">
                          <span className="text-zinc-950 font-bold">
                            {savedExperimentItem.instrument}
                          </span>
                          <span>·</span>
                          <span>{savedExperimentItem.direction}</span>
                          <span>·</span>
                          <span>{formattedCreationDate}</span>
                        </div>
                        <h4 className="text-xs font-bold text-zinc-950 font-mono line-clamp-1">
                          {savedExperimentItem.title}
                        </h4>
                      </div>

                      <button
                        onClick={(clickEvent) => {
                          clickEvent.stopPropagation();
                          onDeleteExperiment(savedExperimentItem.id);
                        }}
                        className="text-zinc-400 hover:text-zinc-950 p-1"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[11px] text-zinc-600 font-mono line-clamp-1">
                      &ldquo;{savedExperimentItem.originalQuery}&rdquo;
                    </p>

                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] font-mono">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-sm border ${
                          isExperimentFullySpecified
                            ? 'border-zinc-900 bg-zinc-900 text-white'
                            : 'border-zinc-300 bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {isExperimentFullySpecified ? 'READY' : 'INCOMPLETE'}
                      </span>

                      <button
                        onClick={() => {
                          onSelectExperiment(savedExperimentItem);
                          onClose();
                        }}
                        className="text-zinc-950 hover:underline font-bold flex items-center space-x-1"
                      >
                        <span>Load</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {hasSavedExperiments && (
            <div className="p-3 border-t border-zinc-200 bg-white flex items-center justify-between">
              <button
                onClick={onClearAll}
                className="elevated-button-default px-2.5 py-1 rounded-sm text-xs font-mono text-zinc-600 hover:text-black flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
              <button
                onClick={onClose}
                className="elevated-button-primary px-3.5 py-1 rounded-sm text-xs font-mono"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
