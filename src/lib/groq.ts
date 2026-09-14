import { StructuredExperiment, MissingField, ExtractedEntity, TradeDirection } from '@/types/experiment';

interface GroqResponsePayload {
  isTradingQuery: boolean;
  message?: string;
  title?: string;
  instrument?: string | null;
  assetClass?: StructuredExperiment['assetClass'] | null;
  timeframe?: string | null;
  direction?: 'LONG' | 'SHORT' | null;
  entryCondition?: string | null;
  exitCondition?: string | null;
  holdingPeriod?: string | null;
  filters?: string[] | null;
  benchmark?: string | null;
  targetHypothesis?: string;
  missingParameters?: string[];
}

const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

const SYSTEM_PROMPT = `You are an institutional quantitative trading research parser.
Analyze the user's sentence and extract the trading hypothesis parameters.

RULES:
1. VALIDATION:
   If the input is NOT a trading strategy, market question, or financial hypothesis (e.g. casual conversation like "hi", "who are you", random words):
   Return strictly JSON:
   {
     "isTradingQuery": false,
     "message": "Please enter a trading hypothesis or market question (for example: 'Does buying NIFTY after a 1% fall work better during high-volatility periods?' or 'Sell TSLA if it breaks below 200 on 15m chart')."
   }

2. PURE EXTRACTION (NO ASSUMPTIONS):
   Extract ONLY the parameters that are explicitly mentioned or clearly implied in the user's sentence.
   - If no instrument is in the sentence, "instrument" must be null.
   - If no entry condition is in the sentence, "entryCondition" must be null.
   - If no timeframe is in the sentence, "timeframe" must be null.
   - If no exit rule is in the sentence, "exitCondition" must be null.
   - If no holding duration is in the sentence, "holdingPeriod" must be null.
   - If direction (buy/long vs sell/short) is not in the sentence, "direction" must be null.
   - "missingParameters" must list every parameter that is missing from the query and needed for a complete backtest (choose from: ["instrument", "entryCondition", "timeframe", "exitCondition", "holdingPeriod"]).

Return strictly JSON matching this schema:
{
  "isTradingQuery": true,
  "instrument": string | null,
  "assetClass": "Index" | "Equity" | "Commodity" | "Crypto" | "Forex" | null,
  "timeframe": string | null,
  "direction": "LONG" | "SHORT" | null,
  "entryCondition": string | null,
  "exitCondition": string | null,
  "holdingPeriod": string | null,
  "filters": string[],
  "benchmark": string | null,
  "targetHypothesis": string,
  "missingParameters": string[]
}`;

function buildMissingFieldDefinitions(missingParameterNames: string[]): MissingField[] {
  const definitions: Record<string, MissingField> = {
    instrument: {
      id: 'missing_instrument',
      field: 'instrument',
      label: 'Target Instrument',
      importance: 'critical',
      explanation: 'No asset or ticker was detected in the prompt.',
      question: 'Which instrument or asset do you want to test?',
      suggestedOptions: [
        { label: 'NIFTY 50', value: 'NIFTY 50', description: 'NSE Benchmark Index', isDefault: true },
        { label: 'BANKNIFTY', value: 'BANKNIFTY', description: 'NSE Banking Index' },
        { label: 'S&P 500 (SPY)', value: 'SPY', description: 'US Benchmark ETF' },
        { label: 'Bitcoin (BTC)', value: 'BTC/USD', description: 'Cryptocurrency' }
      ],
      allowCustom: true
    },
    entryCondition: {
      id: 'missing_entry_condition',
      field: 'entryCondition',
      label: 'Entry Trigger',
      importance: 'critical',
      explanation: 'No entry signal or price trigger was detected.',
      question: 'What is the entry trigger condition?',
      suggestedOptions: [
        { label: 'Price drops >= 1%', value: 'Price falls >= 1%', description: 'Pullback trigger', isDefault: true },
        { label: 'Price drops >= 2%', value: 'Price falls >= 2%', description: 'Deeper dip trigger' },
        { label: 'RSI(14) < 30', value: 'RSI(14) < 30', description: 'Oversold indicator trigger' }
      ],
      allowCustom: true
    },
    timeframe: {
      id: 'missing_timeframe',
      field: 'timeframe',
      label: 'Timeframe',
      importance: 'recommended',
      explanation: 'Candle resolution for calculating the signal.',
      question: 'Which chart timeframe should be evaluated?',
      suggestedOptions: [
        { label: 'Daily', value: 'Daily', description: 'Daily chart candles', isDefault: true },
        { label: '15 Minutes', value: '15 Minutes', description: '15m intraday resolution' },
        { label: '1 Hour', value: '1 Hour', description: 'Hourly resolution' }
      ],
      allowCustom: true
    },
    exitCondition: {
      id: 'missing_exit_condition',
      field: 'exitCondition',
      label: 'Exit Rule',
      importance: 'critical',
      explanation: 'Profit targets or stop-loss boundaries.',
      question: 'What is the exit condition?',
      suggestedOptions: [
        { label: 'Take Profit: 2% / Stop Loss: 1%', value: 'TP: +2%, SL: -1%', description: 'Fixed risk-to-reward ratio', isDefault: true },
        { label: 'Trailing Stop (1.5x ATR)', value: 'Trailing Stop 1.5x ATR', description: 'Volatility-adjusted trailing stop' },
        { label: 'Exit on first green candle', value: 'First profitable day close', description: 'Exit on positive session close' },
        { label: 'Time exit only', value: 'Time exit only', description: 'Exit solely when holding period expires' }
      ],
      allowCustom: true
    },
    holdingPeriod: {
      id: 'missing_holding_period',
      field: 'holdingPeriod',
      label: 'Holding Period',
      importance: 'critical',
      explanation: 'Position duration before closing the trade.',
      question: 'How long should the position be held?',
      suggestedOptions: [
        { label: '1 Day (Next Day Close)', value: '1 Day', description: 'Exit at next day close', isDefault: true },
        { label: '3 Days', value: '3 Days', description: 'Hold for 3 sessions' },
        { label: '5 Days', value: '5 Days', description: 'Hold for 5 sessions' },
        { label: 'Intraday', value: 'Intraday', description: 'Square off before market close' }
      ],
      allowCustom: true
    }
  };

  const resolvedList: MissingField[] = [];
  for (const param of missingParameterNames) {
    const matched = definitions[param];
    if (matched) {
      resolvedList.push(matched);
    }
  }

  return resolvedList;
}

export async function parseQueryWithGroq(
  query: string,
  providedApiKey?: string
): Promise<{
  experiment: StructuredExperiment;
  provider: 'groq-gpt-oss-120b';
}> {
  const userText = query.trim();
  const activeApiKey = providedApiKey || process.env.GROQ_API_KEY;

  if (!activeApiKey) {
    throw new Error('GROQ_API_KEY is not configured. Please provide an API key in settings or configure GROQ_API_KEY in your deployment.');
  }

  const endpointUrl = 'https://api.groq.com/openai/v1/chat/completions';
  const apiResponse = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${activeApiKey}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userText }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.0
    })
  });

  if (!apiResponse.ok) {
    const errorBody = await apiResponse.text();
    throw new Error(`Groq API error (${apiResponse.status}): ${errorBody}`);
  }

  const responseJson = await apiResponse.json();
  const content = responseJson?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Groq returned an empty response.');
  }

  const result: GroqResponsePayload = JSON.parse(content);

  if (result.isTradingQuery === false) {
    throw new Error(result.message || 'No trading strategy or market condition detected. Please enter a trading research hypothesis.');
  }

  const extractedInstrument = result.instrument || null;
  const extractedTimeframe = result.timeframe || null;
  const extractedDirection: TradeDirection = result.direction || 'UNSPECIFIED';
  const extractedEntry = result.entryCondition || null;
  const extractedExit = result.exitCondition || null;
  const extractedHolding = result.holdingPeriod || null;
  const extractedFilters = Array.isArray(result.filters) ? result.filters : [];
  const extractedHypothesis = result.targetHypothesis || userText;

  const missingParamNames = Array.isArray(result.missingParameters) ? result.missingParameters : [];
  const missingFields = buildMissingFieldDefinitions(missingParamNames);

  const entities: ExtractedEntity[] = [
    {
      field: 'instrument',
      label: 'Instrument',
      value: extractedInstrument,
      confidence: extractedInstrument ? 1.0 : 0.0,
      status: extractedInstrument ? 'specified' : 'missing'
    },
    {
      field: 'timeframe',
      label: 'Timeframe',
      value: extractedTimeframe,
      confidence: extractedTimeframe ? 1.0 : 0.0,
      status: extractedTimeframe ? 'specified' : 'missing'
    },
    {
      field: 'direction',
      label: 'Direction',
      value: extractedDirection !== 'UNSPECIFIED' ? extractedDirection : null,
      confidence: extractedDirection !== 'UNSPECIFIED' ? 1.0 : 0.0,
      status: extractedDirection !== 'UNSPECIFIED' ? 'specified' : 'missing'
    },
    {
      field: 'entryCondition',
      label: 'Entry Condition',
      value: extractedEntry,
      confidence: extractedEntry ? 1.0 : 0.0,
      status: extractedEntry ? 'specified' : 'missing'
    },
    {
      field: 'exitCondition',
      label: 'Exit Condition',
      value: extractedExit,
      confidence: extractedExit ? 1.0 : 0.0,
      status: extractedExit ? 'specified' : 'missing'
    },
    {
      field: 'holdingPeriod',
      label: 'Holding Period',
      value: extractedHolding,
      confidence: extractedHolding ? 1.0 : 0.0,
      status: extractedHolding ? 'specified' : 'missing'
    },
    {
      field: 'filters',
      label: 'Filter',
      value: extractedFilters.length > 0 ? extractedFilters : null,
      confidence: extractedFilters.length > 0 ? 1.0 : 0.0,
      status: extractedFilters.length > 0 ? 'specified' : 'inferred'
    },
    {
      field: 'targetHypothesis',
      label: 'Question',
      value: extractedHypothesis,
      confidence: 1.0,
      status: 'specified'
    }
  ];

  const randomSuffix = Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();

  const title = extractedInstrument
    ? `${extractedInstrument} Strategy Experiment`
    : 'Custom Strategy Experiment';

  const experiment: StructuredExperiment = {
    id: `exp_${randomSuffix}`,
    createdAt: now,
    updatedAt: now,
    originalQuery: userText,
    title: result.title || title,
    instrument: extractedInstrument,
    assetClass: result.assetClass || 'Index',
    timeframe: extractedTimeframe,
    direction: extractedDirection,
    entryCondition: extractedEntry,
    exitCondition: extractedExit,
    holdingPeriod: extractedHolding,
    filters: extractedFilters,
    benchmark: result.benchmark || (extractedInstrument || 'Market Benchmark'),
    targetHypothesis: extractedHypothesis,
    entities,
    ambiguityScore: missingFields.length,
    missingFields,
    resolvedClarifications: {},
    isFullySpecified: missingFields.length === 0
  };

  return {
    experiment,
    provider: 'groq-gpt-oss-120b'
  };
}
