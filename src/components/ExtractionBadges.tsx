'use client';

import React from 'react';
import { ExtractedEntity } from '@/types/experiment';
import { Check, AlertCircle } from 'lucide-react';

interface ExtractionBadgesProps {
  entities: ExtractedEntity[];
  originalQuery: string;
}

export const ExtractionBadges: React.FC<ExtractionBadgesProps> = ({
  entities,
  originalQuery
}) => {
  const specifiedEntities = entities.filter(
    (entity) => entity.status === 'specified' && entity.value
  );
  const missingEntities = entities.filter(
    (entity) => entity.status === 'missing' || !entity.value
  );

  return (
    <div className="bg-white border border-zinc-300 rounded-sm p-3.5 shadow-sm font-mono space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-zinc-200 pb-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
            Extracted Variables
          </span>
          <span className="text-[10px] text-zinc-500">
            ({specifiedEntities.length} identified, {missingEntities.length} missing)
          </span>
        </div>
        <div className="text-[11px] text-zinc-400 truncate max-w-sm">
          Prompt: &ldquo;{originalQuery}&rdquo;
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        {entities.map((entity, index) => {
          const isMissing = entity.status === 'missing' || !entity.value;
          const displayValue = Array.isArray(entity.value)
            ? entity.value.join(', ')
            : entity.value || 'Unspecified';

          return (
            <div
              key={index}
              className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xs border text-xs ${
                isMissing
                  ? 'border-zinc-300 bg-zinc-100 text-zinc-500'
                  : 'border-zinc-900 bg-zinc-900 text-white'
              }`}
            >
              <span className="text-[10px] uppercase font-bold opacity-75">
                {entity.label}:
              </span>
              <span className="font-semibold">
                {displayValue}
              </span>
              {isMissing ? (
                <AlertCircle className="w-3 h-3 text-zinc-400" />
              ) : (
                <Check className="w-3 h-3 text-white" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
