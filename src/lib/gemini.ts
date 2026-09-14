import { StructuredExperiment, MissingField, ExtractedEntity } from '@/types/experiment';
import { parseQueryHeuristic } from './parser';

interface GeminiParsedPayload {
  title?: string;
  instrument?: string;
  assetClass?: StructuredExperiment['assetClass'];
  timeframe?: string | null;
  direction?: StructuredExperiment['direction'];
  entryCondition?: string;
  exitCondition?: string | null;
  holdingPeriod?: string | null;
  filters?: string[];
  benchmark?: string;
  targetHypothesis?: string;
  ambiguityScore?: number;
  missingFields?: MissingField[];
}

const GEMINI_SYSTEM_INSTRUCTION = `You are an expert Institutional Quantitative Trading Research Assistant.
Your job is to parse natural language trading ideas from traders into rigorous, structured experiment specifications.

Given a user's question, you must:
1. Identify all specified parameters: Instrument, Timeframe, Direction, Entry Condition, Exit Condition, Holding Period, Filters, and Core Hypothesis.
2. Detect all missing information and ambiguous terms (e.g., if holding period or stop-loss/take-profit are missing, or if "high volatility" or "sharp fall" are not quantified).
3. Formulate professional clarification questions with concrete institutional trader choices.

Return ONLY a valid JSON object with the following structure:
{
  "title": "Title of the experiment",
  "instrument": "NIFTY 50",
  "assetClass": "Index",
  "timeframe": "Daily (1D)",
  "direction": "LONG",
  "entryCondition": "NIFTY falls >= 1% from previous close",
  "exitCondition": null,
  "holdingPeriod": null,
  "filters": ["India VIX > 18.0"],
  "benchmark": "NIFTY 50 Buy & Hold",
  "targetHypothesis": "Quantitative hypothesis statement",
  "ambiguityScore": 65,
  "missingFields": []
}`;

function buildGeminiRequestBody(userQuery: string) {
  return JSON.stringify({
    contents: [{ parts: [{ text: `Parse this trading research query: "${userQuery}"` }] }],
    systemInstruction: { parts: [{ text: GEMINI_SYSTEM_INSTRUCTION }] },
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json'
    }
  });
}

function buildMergedEntitiesList(
  parsedPayload: GeminiParsedPayload,
  baselineExperiment: StructuredExperiment
): ExtractedEntity[] {
  const chosenInstrument = parsedPayload.instrument || baselineExperiment.instrument;
  const chosenTimeframe = parsedPayload.timeframe || null;
  const chosenDirection = parsedPayload.direction || baselineExperiment.direction;
  const chosenEntryCondition = parsedPayload.entryCondition || baselineExperiment.entryCondition;
  const chosenExitCondition = parsedPayload.exitCondition || null;
  const chosenHoldingPeriod = parsedPayload.holdingPeriod || null;
  const chosenFilters = Array.isArray(parsedPayload.filters)
    ? parsedPayload.filters
    : baselineExperiment.filters;
  const chosenHypothesis = parsedPayload.targetHypothesis || baselineExperiment.targetHypothesis;

  return [
    {
      field: 'instrument',
      label: 'Target Instrument',
      value: chosenInstrument,
      confidence: 0.98,
      status: parsedPayload.instrument ? 'specified' : 'inferred',
      notes: 'Underlying traded security'
    },
    {
      field: 'timeframe',
      label: 'Execution Timeframe',
      value: chosenTimeframe,
      confidence: chosenTimeframe ? 0.95 : 0.3,
      status: chosenTimeframe ? 'specified' : 'missing',
      notes: chosenTimeframe
        ? 'Resolution of price series'
        : 'Unspecified: Defaulting to Daily for index research'
    },
    {
      field: 'direction',
      label: 'Trade Direction',
      value: chosenDirection,
      confidence: 0.95,
      status: 'specified'
    },
    {
      field: 'entryCondition',
      label: 'Entry Trigger',
      value: chosenEntryCondition,
      confidence: 0.92,
      status: 'specified'
    },
    {
      field: 'exitCondition',
      label: 'Exit Rule (Risk / Target)',
      value: chosenExitCondition,
      confidence: chosenExitCondition ? 0.9 : 0.2,
      status: chosenExitCondition ? 'specified' : 'missing',
      notes: 'Crucial stop/target boundary'
    },
    {
      field: 'holdingPeriod',
      label: 'Holding Period',
      value: chosenHoldingPeriod,
      confidence: chosenHoldingPeriod ? 0.9 : 0.2,
      status: chosenHoldingPeriod ? 'specified' : 'missing',
      notes: 'Position duration'
    },
    {
      field: 'filters',
      label: 'Market Filters & Regimes',
      value: chosenFilters,
      confidence: 0.88,
      status: chosenFilters.length > 0 ? 'specified' : 'inferred'
    },
    {
      field: 'targetHypothesis',
      label: 'Research Hypothesis',
      value: chosenHypothesis,
      confidence: 0.95,
      status: 'specified'
    }
  ];
}

export async function parseQueryWithGemini(
  query: string,
  providedApiKey?: string
): Promise<{
  experiment: StructuredExperiment;
  provider: 'gemini-2.0-flash' | 'gemini-1.5-flash' | 'smart-heuristic-parser';
}> {
  const activeApiKey = providedApiKey || process.env.GEMINI_API_KEY;
  const isApiKeyMissing = !activeApiKey;

  if (isApiKeyMissing) {
    return {
      experiment: parseQueryHeuristic(query),
      provider: 'smart-heuristic-parser'
    };
  }

  try {
    const endpointUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${activeApiKey}`;
    const requestBody = buildGeminiRequestBody(query);

    const apiResponse = await fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody
    });

    const isResponseUnsuccessful = !apiResponse.ok;
    if (isResponseUnsuccessful) {
      return {
        experiment: parseQueryHeuristic(query),
        provider: 'smart-heuristic-parser'
      };
    }

    const responseJson = await apiResponse.json();
    const candidatePart = responseJson?.candidates?.[0]?.content?.parts?.[0];
    const generatedText = candidatePart?.text;

    const isGeneratedTextEmpty = !generatedText;
    if (isGeneratedTextEmpty) {
      return {
        experiment: parseQueryHeuristic(query),
        provider: 'smart-heuristic-parser'
      };
    }

    const parsedPayload: GeminiParsedPayload = JSON.parse(generatedText);
    const baselineExperiment = parseQueryHeuristic(query);

    const mergedEntities = buildMergedEntitiesList(parsedPayload, baselineExperiment);

    const hasParsedMissingFields =
      Array.isArray(parsedPayload.missingFields) && parsedPayload.missingFields.length > 0;
    const resolvedMissingFields = hasParsedMissingFields
      ? (parsedPayload.missingFields as MissingField[])
      : baselineExperiment.missingFields;

    const resolvedAmbiguityScore =
      typeof parsedPayload.ambiguityScore === 'number'
        ? parsedPayload.ambiguityScore
        : baselineExperiment.ambiguityScore;

    const currentTimestamp = new Date().toISOString();
    const randomSuffix = Math.random().toString(36).substring(2, 9);

    const finalizedExperiment: StructuredExperiment = {
      ...baselineExperiment,
      id: `exp_${randomSuffix}`,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
      originalQuery: query,
      title: parsedPayload.title || baselineExperiment.title,
      instrument: parsedPayload.instrument || baselineExperiment.instrument,
      assetClass: parsedPayload.assetClass || baselineExperiment.assetClass,
      timeframe: parsedPayload.timeframe || baselineExperiment.timeframe,
      direction: parsedPayload.direction || baselineExperiment.direction,
      entryCondition: parsedPayload.entryCondition || baselineExperiment.entryCondition,
      exitCondition: parsedPayload.exitCondition || baselineExperiment.exitCondition,
      holdingPeriod: parsedPayload.holdingPeriod || baselineExperiment.holdingPeriod,
      filters: Array.isArray(parsedPayload.filters)
        ? parsedPayload.filters
        : baselineExperiment.filters,
      benchmark: parsedPayload.benchmark || baselineExperiment.benchmark,
      targetHypothesis: parsedPayload.targetHypothesis || baselineExperiment.targetHypothesis,
      entities: mergedEntities,
      ambiguityScore: resolvedAmbiguityScore,
      missingFields: resolvedMissingFields,
      resolvedClarifications: {},
      isFullySpecified: resolvedMissingFields.length === 0
    };

    return {
      experiment: finalizedExperiment,
      provider: 'gemini-2.0-flash'
    };
  } catch (error) {
    return {
      experiment: parseQueryHeuristic(query),
      provider: 'smart-heuristic-parser'
    };
  }
}
