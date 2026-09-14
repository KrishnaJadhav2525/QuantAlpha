'use client';

import React, { useState } from 'react';
import { Search, CornerDownLeft, Loader2 } from 'lucide-react';

interface QueryInputProps {
  onAnalyze: (query: string) => void;
  isLoading: boolean;
  initialQuery?: string;
}

export const QueryInput: React.FC<QueryInputProps> = ({
  onAnalyze,
  isLoading,
  initialQuery = ''
}) => {
  const [currentQueryText, setCurrentQueryText] = useState(initialQuery);

  const hasEnteredQuery = currentQueryText.trim().length > 0;
  const isSubmissionDisabled = !hasEnteredQuery || isLoading;

  const handleFormSubmit = (formSubmitEvent: React.FormEvent) => {
    formSubmitEvent.preventDefault();
    const trimmedText = currentQueryText.trim();
    const canSubmit = trimmedText.length > 0 && !isLoading;

    if (canSubmit) {
      onAnalyze(trimmedText);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleFormSubmit} className="relative">
        <div className="relative flex items-center rounded-sm bg-white border-2 border-zinc-900 focus-within:border-black transition-colors shadow-sm">
          <div className="pl-3.5 pr-2 text-zinc-400 flex items-center pointer-events-none">
            <Search className="w-4 h-4" />
          </div>

          <input
            type="text"
            value={currentQueryText}
            onChange={(inputChangeEvent) =>
              setCurrentQueryText(inputChangeEvent.target.value)
            }
            disabled={isLoading}
            placeholder="Enter market hypothesis or strategy question..."
            className="w-full py-3.5 px-2 bg-transparent text-zinc-900 placeholder:text-zinc-400 text-sm font-mono focus:outline-none disabled:opacity-60"
          />

          <div className="pr-2 flex items-center space-x-2">
            <button
              type="submit"
              disabled={isSubmissionDisabled}
              className="elevated-button-primary px-4 py-2 rounded-sm text-xs font-mono font-semibold flex items-center space-x-1.5 disabled:opacity-40 disabled:pointer-events-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing</span>
                </>
              ) : (
                <>
                  <span>Analyze</span>
                  <CornerDownLeft className="w-3 h-3 opacity-60" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
