'use client';

import React, { useState, useEffect } from 'react';
import { StructuredExperiment } from '@/types/experiment';
import { resolveExperimentClarifications } from '@/lib/clarify';
import { Navbar } from '@/components/Navbar';
import { QueryInput } from '@/components/QueryInput';
import { ExtractionBadges } from '@/components/ExtractionBadges';
import { AmbiguityResolver } from '@/components/AmbiguityResolver';
import { ExperimentCard } from '@/components/ExperimentCard';
import { HistoryDrawer } from '@/components/HistoryDrawer';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { AlertCircle } from 'lucide-react';

const INITIAL_QUERY_TEXT =
  'Does buying NIFTY after a 1% fall work better during high-volatility periods?';

const LOCAL_STORAGE_KEY_GROQ = 'quantalpha_groq_key';
const LOCAL_STORAGE_KEY_SAVED_EXPERIMENTS = 'quantalpha_saved_experiments';

export default function Home() {
  const [activeQueryText, setActiveQueryText] = useState(INITIAL_QUERY_TEXT);
  const [activeExperiment, setActiveExperiment] = useState<StructuredExperiment | null>(null);
  const [isAnalyzingQuery, setIsAnalyzingQuery] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeAiProvider, setActiveAiProvider] = useState<'groq-gpt-oss-120b' | 'gemini-2.0-flash' | 'smart-heuristic-parser'>('groq-gpt-oss-120b');
  const [networkLatencyMilliseconds, setNetworkLatencyMilliseconds] = useState<number>(110);

  const [storedGroqApiKey, setStoredGroqApiKey] = useState('');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [savedExperimentsList, setSavedExperimentsList] = useState<StructuredExperiment[]>([]);

  useEffect(() => {
    const isBrowserEnvironment = typeof window !== 'undefined';
    if (!isBrowserEnvironment) {
      return;
    }

    const savedApiKey = localStorage.getItem(LOCAL_STORAGE_KEY_GROQ) || '';
    const rawStoredExperiments = localStorage.getItem(LOCAL_STORAGE_KEY_SAVED_EXPERIMENTS);

    setStoredGroqApiKey(savedApiKey);

    if (rawStoredExperiments) {
      try {
        const parsedStoredExperiments: StructuredExperiment[] = JSON.parse(rawStoredExperiments);
        setSavedExperimentsList(parsedStoredExperiments);
      } catch (storageParseError) {
        setSavedExperimentsList([]);
      }
    }

    handleAnalyzeQuery(INITIAL_QUERY_TEXT, savedApiKey);
  }, []);

  const handleSaveApiKey = (newApiKeyText: string) => {
    setStoredGroqApiKey(newApiKeyText);
    localStorage.setItem(LOCAL_STORAGE_KEY_GROQ, newApiKeyText);
  };

  const handleAnalyzeQuery = async (searchQueryText: string, customKey?: string) => {
    setIsAnalyzingQuery(true);
    setErrorMessage(null);
    setActiveQueryText(searchQueryText);

    try {
      const apiResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQueryText,
          apiKey: customKey !== undefined ? customKey : (storedGroqApiKey || undefined)
        })
      });

      if (!apiResponse.ok) {
        const errorJson = await apiResponse.json().catch(() => ({}));
        throw new Error(errorJson.error || `Analysis request failed with status ${apiResponse.status}`);
      }

      const responseData = await apiResponse.json();
      setActiveExperiment(responseData.experiment);
      setActiveAiProvider(responseData.aiProvider);
      setNetworkLatencyMilliseconds(responseData.latencyMs);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to analyze query.';
      setErrorMessage(message);
    } finally {
      setIsAnalyzingQuery(false);
    }
  };

  const handleResolveClarification = (fieldKey: string, chosenValue: string) => {
    if (!activeExperiment) {
      return;
    }

    const updatedExperiment = resolveExperimentClarifications(activeExperiment, {
      [fieldKey]: chosenValue
    });
    setActiveExperiment(updatedExperiment);
  };

  const handleApplyAllRecommendedDefaults = () => {
    if (!activeExperiment) {
      return;
    }

    const defaultResolutionsMap: Record<string, string> = {};

    for (const missingFieldItem of activeExperiment.missingFields) {
      const foundDefaultOption = missingFieldItem.suggestedOptions.find(
        (optionItem) => optionItem.isDefault
      );
      const effectiveDefaultOption =
        foundDefaultOption || missingFieldItem.suggestedOptions[0];

      if (effectiveDefaultOption) {
        defaultResolutionsMap[missingFieldItem.field as string] =
          effectiveDefaultOption.value;
      }
    }

    const updatedExperiment = resolveExperimentClarifications(
      activeExperiment,
      defaultResolutionsMap
    );
    setActiveExperiment(updatedExperiment);
  };

  const handleSaveExperimentToHistory = (experimentToSave: StructuredExperiment) => {
    const existingWithoutCurrent = savedExperimentsList.filter(
      (savedItem) => savedItem.id !== experimentToSave.id
    );
    const updatedHistoryList = [experimentToSave, ...existingWithoutCurrent];
    setSavedExperimentsList(updatedHistoryList);
    localStorage.setItem(
      LOCAL_STORAGE_KEY_SAVED_EXPERIMENTS,
      JSON.stringify(updatedHistoryList)
    );
  };

  const handleDeleteExperimentFromHistory = (experimentIdentifier: string) => {
    const updatedHistoryList = savedExperimentsList.filter(
      (savedItem) => savedItem.id !== experimentIdentifier
    );
    setSavedExperimentsList(updatedHistoryList);
    localStorage.setItem(
      LOCAL_STORAGE_KEY_SAVED_EXPERIMENTS,
      JSON.stringify(updatedHistoryList)
    );
  };

  const handleClearAllHistory = () => {
    setSavedExperimentsList([]);
    localStorage.removeItem(LOCAL_STORAGE_KEY_SAVED_EXPERIMENTS);
  };

  const handleSelectExperimentFromHistory = (
    selectedExperiment: StructuredExperiment
  ) => {
    setActiveExperiment(selectedExperiment);
    setActiveQueryText(selectedExperiment.originalQuery);
  };

  const isCurrentExperimentSaved = activeExperiment
    ? savedExperimentsList.some((savedItem) => savedItem.id === activeExperiment.id)
    : false;

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 flex flex-col font-sans selection:bg-black selection:text-white">
      <Navbar
        engine={activeAiProvider}
        latencyMs={networkLatencyMilliseconds}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenHistory={() => setIsHistoryDrawerOpen(true)}
        historyCount={savedExperimentsList.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-zinc-300 pb-4 gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-zinc-950 uppercase">
              Trading Research Terminal
            </h1>
            <p className="text-xs font-mono text-zinc-500 mt-0.5">
              Natural language hypothesis parsing and structured experiment formulation.
            </p>
          </div>
          <div className="text-[11px] font-mono text-zinc-400">
            ENGINE: GROQ / GPT-OSS-120B
          </div>
        </div>

        <section>
          <QueryInput
            onAnalyze={(query) => handleAnalyzeQuery(query)}
            isLoading={isAnalyzingQuery}
            initialQuery={activeQueryText}
          />
        </section>

        {errorMessage && (
          <div className="p-3.5 rounded-sm bg-white border border-zinc-300 shadow-sm flex items-start space-x-3 text-xs font-mono">
            <AlertCircle className="w-4 h-4 text-zinc-900 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-zinc-900 uppercase">Backend API Notice</span>
              <p className="text-zinc-600">{errorMessage}</p>
              <p className="text-[11px] text-zinc-400">
                You can configure your Groq API key in Settings at the top right, or set GROQ_API_KEY in your deployment environment.
              </p>
            </div>
          </div>
        )}

        {activeExperiment && (
          <div className="space-y-6">
            <section>
              <ExtractionBadges
                entities={activeExperiment.entities}
                originalQuery={activeExperiment.originalQuery}
              />
            </section>

            <section>
              <AmbiguityResolver
                missingFields={activeExperiment.missingFields}
                resolvedClarifications={activeExperiment.resolvedClarifications}
                onResolveField={handleResolveClarification}
                onApplyAllDefaults={handleApplyAllRecommendedDefaults}
                ambiguityScore={activeExperiment.ambiguityScore}
              />
            </section>

            <section>
              <ExperimentCard
                experiment={activeExperiment}
                onSaveToHistory={handleSaveExperimentToHistory}
                isSaved={isCurrentExperimentSaved}
              />
            </section>
          </div>
        )}

        <footer className="border-t border-zinc-300 pt-5 text-center text-xs font-mono text-zinc-500">
          <span>QuantAlpha Terminal · Dual-Tone Monochrome Architecture</span>
        </footer>
      </main>

      <ApiKeyModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        apiKey={storedGroqApiKey}
        onSaveApiKey={handleSaveApiKey}
        forceFallback={false}
        onToggleForceFallback={() => {}}
      />

      <HistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        savedExperiments={savedExperimentsList}
        onSelectExperiment={handleSelectExperimentFromHistory}
        onDeleteExperiment={handleDeleteExperimentFromHistory}
        onClearAll={handleClearAllHistory}
      />
    </div>
  );
}
