'use client';

import React, { useState } from 'react';
import { MissingField } from '@/types/experiment';
import { Check, Edit3, ArrowRight } from 'lucide-react';

interface AmbiguityResolverProps {
  missingFields: MissingField[];
  resolvedClarifications: Record<string, string>;
  onResolveField: (fieldKey: string, chosenValue: string) => void;
  onApplyAllDefaults: () => void;
  ambiguityScore: number;
}

export const AmbiguityResolver: React.FC<AmbiguityResolverProps> = ({
  missingFields,
  resolvedClarifications,
  onResolveField,
  onApplyAllDefaults,
  ambiguityScore
}) => {
  const [customInputValues, setCustomInputValues] = useState<Record<string, string>>({});
  const [expandedCustomFieldIdentifier, setExpandedCustomFieldIdentifier] = useState<string | null>(null);

  const missingFieldsCount = missingFields.length;
  const isFullySpecified = missingFieldsCount === 0;

  const handleCustomInputSubmit = (fieldIdentifier: string, fieldKeyName: string) => {
    const rawInputValue = customInputValues[fieldIdentifier];
    const trimmedInputValue = rawInputValue ? rawInputValue.trim() : '';
    const hasValidCustomValue = trimmedInputValue.length > 0;

    if (hasValidCustomValue) {
      onResolveField(fieldKeyName, trimmedInputValue);
      setExpandedCustomFieldIdentifier(null);
    }
  };

  const handleCustomInputChange = (fieldIdentifier: string, newText: string) => {
    setCustomInputValues({
      ...customInputValues,
      [fieldIdentifier]: newText
    });
  };

  return (
    <div className="bg-white border border-zinc-300 rounded-sm p-4 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <div className="flex items-center space-x-2.5">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-950">
            Clarification Required
          </span>
          <span className="px-2 py-0.5 rounded-sm bg-zinc-100 border border-zinc-300 text-zinc-700 text-[10px] font-mono font-medium">
            {isFullySpecified ? 'All Parameters Specified' : `${missingFieldsCount} Missing`}
          </span>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          {!isFullySpecified && (
            <button
              onClick={onApplyAllDefaults}
              className="elevated-button-primary px-3 py-1 rounded-sm text-xs font-mono font-semibold"
            >
              Apply Defaults
            </button>
          )}
        </div>
      </div>

      {isFullySpecified ? (
        <div className="p-3.5 rounded-sm border border-zinc-200 bg-zinc-50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-5 h-5 rounded-sm bg-zinc-900 flex items-center justify-center text-white">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-mono text-zinc-800 font-medium">
              All missing parameters have been resolved.
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-sm border border-zinc-900 bg-zinc-900 text-white">
            Locked
          </span>
        </div>
      ) : (
        <div className="space-y-3">
          {missingFields.map((missingFieldItem) => {
            const isCustomInputOpen =
              expandedCustomFieldIdentifier === missingFieldItem.id;

            return (
              <div
                key={missingFieldItem.id}
                className="p-3.5 rounded-sm border border-zinc-200 bg-zinc-50/70 space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold uppercase text-zinc-950">
                        {missingFieldItem.label}
                      </span>
                      <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded-sm border border-zinc-300 bg-zinc-100 text-zinc-700 uppercase">
                        {missingFieldItem.importance}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-zinc-800 font-semibold mt-1">
                      {missingFieldItem.question}
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-zinc-500 sm:text-right max-w-xs">
                    {missingFieldItem.explanation}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                  {missingFieldItem.suggestedOptions.map(
                    (suggestedOptionItem, optionIndex) => (
                      <button
                        key={optionIndex}
                        type="button"
                        onClick={() =>
                          onResolveField(
                            missingFieldItem.field as string,
                            suggestedOptionItem.value
                          )
                        }
                        className="elevated-button-default text-left p-3 rounded-sm group relative hover:!bg-zinc-950 hover:!text-white hover:!border-zinc-950"
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-mono font-bold text-zinc-900 group-hover:text-white flex items-center space-x-1.5">
                            <span>{suggestedOptionItem.label}</span>
                            {suggestedOptionItem.isDefault && (
                              <span className="text-[9px] px-1 py-0.2 rounded-sm border border-zinc-300 bg-zinc-100 text-zinc-600 group-hover:bg-zinc-800 group-hover:text-zinc-200 group-hover:border-zinc-700 font-mono">
                                Default
                              </span>
                            )}
                          </span>
                          <ArrowRight className="w-3 h-3 text-zinc-400 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
                        </div>

                        <div className="text-[11px] text-zinc-500 group-hover:text-zinc-300 font-mono line-clamp-1">
                          {suggestedOptionItem.description}
                        </div>
                      </button>
                    )
                  )}
                </div>

                {missingFieldItem.allowCustom && (
                  <div>
                    {!isCustomInputOpen ? (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCustomFieldIdentifier(missingFieldItem.id)
                        }
                        className="text-[11px] font-mono text-zinc-500 hover:text-zinc-900 flex items-center space-x-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Custom value</span>
                      </button>
                    ) : (
                      <div className="flex items-center space-x-2 pt-1">
                        <input
                          type="text"
                          placeholder="Enter custom parameter..."
                          value={customInputValues[missingFieldItem.id] || ''}
                          onChange={(changeEvent) =>
                            handleCustomInputChange(
                              missingFieldItem.id,
                              changeEvent.target.value
                            )
                          }
                          className="flex-1 py-1.5 px-3 rounded-sm bg-white border border-zinc-300 text-xs font-mono text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-black"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleCustomInputSubmit(
                              missingFieldItem.id,
                              missingFieldItem.field as string
                            )
                          }
                          className="elevated-button-primary px-3.5 py-1.5 rounded-sm text-xs font-mono font-semibold"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpandedCustomFieldIdentifier(null)}
                          className="elevated-button-default px-2.5 py-1.5 rounded-sm text-xs font-mono text-zinc-600 hover:text-black"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
