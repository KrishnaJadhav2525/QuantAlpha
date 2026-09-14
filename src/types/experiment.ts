export type AssetClass = 'Index' | 'Equity' | 'Commodity' | 'Crypto' | 'Forex';
export type TradeDirection = 'LONG' | 'SHORT' | 'BOTH' | 'UNSPECIFIED';
export type FieldStatus = 'specified' | 'inferred' | 'missing';
export type ImportanceLevel = 'critical' | 'recommended' | 'optional';

export interface ExtractedEntity {
  field:
    | 'instrument'
    | 'timeframe'
    | 'direction'
    | 'entryCondition'
    | 'exitCondition'
    | 'holdingPeriod'
    | 'filters'
    | 'targetHypothesis';
  label: string;
  value: string | string[] | null;
  confidence: number;
  rawExcerpt?: string;
  status: FieldStatus;
  notes?: string;
}

export interface SuggestedOption {
  label: string;
  value: string;
  description: string;
  isDefault?: boolean;
}

export interface MissingField {
  id: string;
  field: keyof StructuredExperimentCore;
  label: string;
  importance: ImportanceLevel;
  explanation: string;
  question: string;
  suggestedOptions: SuggestedOption[];
  allowCustom: boolean;
}

export interface StructuredExperimentCore {
  instrument: string | null;
  assetClass: AssetClass;
  timeframe: string | null;
  direction: TradeDirection;
  entryCondition: string | null;
  exitCondition: string | null;
  holdingPeriod: string | null;
  filters: string[];
  benchmark: string;
  targetHypothesis: string;
}

export interface StructuredExperiment extends StructuredExperimentCore {
  id: string;
  createdAt: string;
  updatedAt: string;
  originalQuery: string;
  title: string;
  entities: ExtractedEntity[];
  ambiguityScore: number;
  missingFields: MissingField[];
  resolvedClarifications: Record<string, string>;
  isFullySpecified: boolean;
}

export interface AnalyzeQueryResponse {
  experiment: StructuredExperiment;
  aiProvider: 'groq-gpt-oss-120b' | 'gemini-2.0-flash' | 'smart-heuristic-parser';
  latencyMs: number;
}
