import { StructuredExperiment, MissingField, ExtractedEntity } from '@/types/experiment';

interface GroqParsedPayload {
  title?: string;
  instrument?: string;
  assetClass?: StructuredExperiment['assetClass'];
  timeframe?: string | null;
  direction?: StructuredExperiment['direction'];
  entryCondition?: string;
  exitCondition?: string | null;
  holdingPeriod?: string | null;
  filters?: string[] | Record<string, string>;
  benchmark?: string | null;
  targetHypothesis?: string;
  missingFields?: unknown;
}

const GROQ_MODEL_IDENTIFIER = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

const GROQ_SYSTEM_INSTRUCTION = `You are a quantitative trading research assistant.
Your task is to parse a trading question into a structured experiment.
Identify:
1. Instrument (e.g. NIFTY 50, BANKNIFTY, etc.)
2. Timeframe (e.g. Daily, 15 Minutes, etc., or null if not specified)
3. Direction (LONG or SHORT)
4. Entry condition
5. Exit condition (null if not specified)
6. Holding period (null if not specified)
7. Filters (array of conditions like "High volatility", or empty array)
8. Question (the user's core question)
9. Missing fields (array of missing parameter names: "holdingPeriod", "exitCondition", "timeframe", "filters")

Return strictly JSON matching this structure:
{
  "instrument": "NIFTY 50",
  "timeframe": null,
  "direction": "LONG",
  "entryCondition": "NIFTY falls >= 1%",
  "exitCondition": null,
  "holdingPeriod": null,
  "filters": ["High volatility"],
  "benchmark": "NIFTY 50",
  "targetHypothesis": "Does buying NIFTY after a 1% fall work better during high-volatility periods?",
  "missingFields": ["holdingPeriod", "exitCondition", "timeframe"]
}`;

function buildGroqPayloadBody(userQuery: string): string {
  return JSON.stringify({
    model: GROQ_MODEL_IDENTIFIER,
    messages: [
      {
        role: 'system',
        content: GROQ_SYSTEM_INSTRUCTION
      },
      {
        role: 'user',
        content: `Parse this trading query: "${userQuery}"`
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1
  });
}

function normalizeFilterList(rawFilters: string[] | Record<string, string> | undefined): string[] {
  if (!rawFilters) {
    return [];
  }

  if (Array.isArray(rawFilters)) {
    return rawFilters;
  }

  return Object.entries(rawFilters).map(
    ([filterKey, filterValue]) => `${filterKey}: ${filterValue}`
  );
}

function normalizeDirection(rawDirection: string | undefined): StructuredExperiment['direction'] {
  if (!rawDirection) {
    return 'LONG';
  }

  const uppercase = rawDirection.toUpperCase();
  if (uppercase.includes('SHORT') || uppercase.includes('SELL')) {
    return 'SHORT';
  }

  return 'LONG';
}

function buildDefaultMissingFields(
  holdingPeriod: string | null,
  exitCondition: string | null,
  timeframe: string | null
): MissingField[] {
  const missingFieldList: MissingField[] = [];

  if (!holdingPeriod) {
    missingFieldList.push({
      id: 'missing_holding_period',
      field: 'holdingPeriod',
      label: 'Holding Period',
      importance: 'critical',
      explanation: 'Position duration before closing.',
      question: 'How long should the position be held?',
      suggestedOptions: [
        { label: '1 Day (Next Day Close)', value: '1 Day', description: 'Exit at next day close', isDefault: true },
        { label: '3 Days', value: '3 Days', description: 'Hold for 3 sessions' },
        { label: '5 Days', value: '5 Days', description: 'Hold for 5 sessions' },
        { label: 'Intraday', value: 'Intraday', description: 'Square off before market close' }
      ],
      allowCustom: true
    });
  }

  if (!exitCondition) {
    missingFieldList.push({
      id: 'missing_exit_condition',
      field: 'exitCondition',
      label: 'Exit Rule',
      importance: 'critical',
      explanation: 'Stop loss or profit target criteria.',
      question: 'What is the exit condition?',
      suggestedOptions: [
        { label: 'Take Profit: 2% / Stop Loss: 1%', value: 'TP: +2%, SL: -1%', description: 'Fixed risk-to-reward ratio', isDefault: true },
        { label: 'Trailing Stop (1.5x ATR)', value: 'Trailing Stop 1.5x ATR', description: 'Volatility-adjusted trailing stop' },
        { label: 'Exit on first green candle', value: 'First profitable day close', description: 'Exit on positive session close' },
        { label: 'Time exit only', value: 'Time exit only', description: 'Exit purely when holding period expires' }
      ],
      allowCustom: true
    });
  }

  if (!timeframe) {
    missingFieldList.push({
      id: 'missing_timeframe',
      field: 'timeframe',
      label: 'Timeframe',
      importance: 'recommended',
      explanation: 'Candle resolution for signal calculation.',
      question: 'Which timeframe should be evaluated?',
      suggestedOptions: [
        { label: 'Daily', value: 'Daily', description: 'Daily chart candles', isDefault: true },
        { label: '15 Minutes', value: '15 Minutes', description: '15-minute intraday candles' },
        { label: '1 Hour', value: '1 Hour', description: 'Hourly chart candles' }
      ],
      allowCustom: true
    });
  }

  return missingFieldList;
}

function buildEntitiesList(
  instrument: string,
  timeframe: string | null,
  direction: StructuredExperiment['direction'],
  entryCondition: string,
  exitCondition: string | null,
  holdingPeriod: string | null,
  filters: string[],
  targetHypothesis: string
): ExtractedEntity[] {
  return [
    { field: 'instrument', label: 'Instrument', value: instrument, confidence: 1.0, status: 'specified' },
    { field: 'timeframe', label: 'Timeframe', value: timeframe, confidence: timeframe ? 1.0 : 0.0, status: timeframe ? 'specified' : 'missing' },
    { field: 'direction', label: 'Direction', value: direction, confidence: 1.0, status: 'specified' },
    { field: 'entryCondition', label: 'Entry Condition', value: entryCondition, confidence: 1.0, status: 'specified' },
    { field: 'exitCondition', label: 'Exit Condition', value: exitCondition, confidence: exitCondition ? 1.0 : 0.0, status: exitCondition ? 'specified' : 'missing' },
    { field: 'holdingPeriod', label: 'Holding Period', value: holdingPeriod, confidence: holdingPeriod ? 1.0 : 0.0, status: holdingPeriod ? 'specified' : 'missing' },
    { field: 'filters', label: 'Filter', value: filters.length > 0 ? filters : null, confidence: filters.length > 0 ? 1.0 : 0.0, status: filters.length > 0 ? 'specified' : 'inferred' },
    { field: 'targetHypothesis', label: 'Question', value: targetHypothesis, confidence: 1.0, status: 'specified' }
  ];
}

export async function parseQueryWithGroq(
  query: string,
  providedApiKey?: string
): Promise<{
  experiment: StructuredExperiment;
  provider: 'groq-gpt-oss-120b';
}> {
  const activeApiKey = providedApiKey || process.env.GROQ_API_KEY;

  if (!activeApiKey) {
    throw new Error('GROQ_API_KEY is not configured. Please provide an API key in settings or set GROQ_API_KEY in your environment.');
  }

  const endpointUrl = 'https://api.groq.com/openai/v1/chat/completions';
  const requestBody = buildGroqPayloadBody(query);

  const apiResponse = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${activeApiKey}`
    },
    body: requestBody
  });

  if (!apiResponse.ok) {
    const errorBody = await apiResponse.text();
    throw new Error(`Groq API returned error ${apiResponse.status}: ${errorBody}`);
  }

  const responseJson = await apiResponse.json();
  const candidateChoice = responseJson?.choices?.[0]?.message;
  const generatedText = candidateChoice?.content;

  if (!generatedText) {
    throw new Error('Groq returned an empty response.');
  }

  const parsedPayload: GroqParsedPayload = JSON.parse(generatedText);

  const chosenInstrument = parsedPayload.instrument || 'NIFTY 50';
  const chosenTimeframe = parsedPayload.timeframe || null;
  const chosenDirection = normalizeDirection(parsedPayload.direction);
  const chosenEntryCondition = parsedPayload.entryCondition || `${chosenInstrument} falls >= 1%`;
  const chosenExitCondition = parsedPayload.exitCondition || null;
  const chosenHoldingPeriod = parsedPayload.holdingPeriod || null;
  const chosenFilters = normalizeFilterList(parsedPayload.filters);
  const chosenHypothesis = parsedPayload.targetHypothesis || query;

  const entities = buildEntitiesList(
    chosenInstrument,
    chosenTimeframe,
    chosenDirection,
    chosenEntryCondition,
    chosenExitCondition,
    chosenHoldingPeriod,
    chosenFilters,
    chosenHypothesis
  );

  const missingFields = buildDefaultMissingFields(
    chosenHoldingPeriod,
    chosenExitCondition,
    chosenTimeframe
  );

  const randomSuffix = Math.random().toString(36).substring(2, 9);
  const currentTimestamp = new Date().toISOString();

  const finalizedExperiment: StructuredExperiment = {
    id: `exp_${randomSuffix}`,
    createdAt: currentTimestamp,
    updatedAt: currentTimestamp,
    originalQuery: query,
    title: parsedPayload.title || `${chosenInstrument} Strategy Experiment`,
    instrument: chosenInstrument,
    assetClass: parsedPayload.assetClass || 'Index',
    timeframe: chosenTimeframe || 'Not specified',
    direction: chosenDirection,
    entryCondition: chosenEntryCondition,
    exitCondition: chosenExitCondition || 'Not specified',
    holdingPeriod: chosenHoldingPeriod || 'Not specified',
    filters: chosenFilters,
    benchmark: parsedPayload.benchmark || chosenInstrument,
    targetHypothesis: chosenHypothesis,
    entities,
    ambiguityScore: missingFields.length,
    missingFields,
    resolvedClarifications: {},
    isFullySpecified: missingFields.length === 0
  };

  return {
    experiment: finalizedExperiment,
    provider: 'groq-gpt-oss-120b'
  };
}
