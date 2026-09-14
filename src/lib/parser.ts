import {
  StructuredExperiment,
  ExtractedEntity,
  MissingField,
  TradeDirection,
  AssetClass
} from '@/types/experiment';

interface InstrumentMetadata {
  name: string;
  assetClass: AssetClass;
  benchmark: string;
}

const INSTRUMENT_DIRECTORY: Record<string, InstrumentMetadata> = {
  nifty: { name: 'NIFTY 50', assetClass: 'Index', benchmark: 'NIFTY 50' },
  'nifty 50': { name: 'NIFTY 50', assetClass: 'Index', benchmark: 'NIFTY 50' },
  banknifty: { name: 'BANKNIFTY', assetClass: 'Index', benchmark: 'BANKNIFTY' },
  'bank nifty': { name: 'BANKNIFTY', assetClass: 'Index', benchmark: 'BANKNIFTY' },
  finnifty: { name: 'FINNIFTY', assetClass: 'Index', benchmark: 'FINNIFTY' },
  sensex: { name: 'SENSEX', assetClass: 'Index', benchmark: 'SENSEX' },
  reliance: { name: 'RELIANCE', assetClass: 'Equity', benchmark: 'NIFTY 50' },
  tcs: { name: 'TCS', assetClass: 'Equity', benchmark: 'NIFTY IT' },
  spy: { name: 'SPY', assetClass: 'Index', benchmark: 'S&P 500' },
  qqq: { name: 'QQQ', assetClass: 'Index', benchmark: 'NASDAQ 100' },
  btc: { name: 'BTC/USD', assetClass: 'Crypto', benchmark: 'Bitcoin' },
  bitcoin: { name: 'BTC/USD', assetClass: 'Crypto', benchmark: 'Bitcoin' },
  eth: { name: 'ETH/USD', assetClass: 'Crypto', benchmark: 'Ethereum' },
  gold: { name: 'GOLD', assetClass: 'Commodity', benchmark: 'Gold Spot' },
  crudeoil: { name: 'CRUDE OIL', assetClass: 'Commodity', benchmark: 'Crude Oil Spot' }
};

const COMMON_WORDS_TO_IGNORE = ['DOES', 'WHAT', 'WHEN', 'WITH', 'FROM', 'AFTER'];

function extractInstrumentInformation(
  lowercaseQuery: string,
  originalQuery: string
): InstrumentMetadata {
  for (const [instrumentKeyword, metadata] of Object.entries(INSTRUMENT_DIRECTORY)) {
    const isKeywordPresent = lowercaseQuery.includes(instrumentKeyword);
    if (isKeywordPresent) {
      return metadata;
    }
  }

  const uppercaseTickerMatch = originalQuery.match(/\b([A-Z]{3,10})\b/);
  const potentialTicker = uppercaseTickerMatch ? uppercaseTickerMatch[1] : null;
  const isExcludedWord = potentialTicker
    ? COMMON_WORDS_TO_IGNORE.includes(potentialTicker)
    : false;

  if (potentialTicker && !isExcludedWord) {
    return {
      name: potentialTicker,
      assetClass: 'Equity',
      benchmark: 'Benchmark Index'
    };
  }

  return {
    name: 'NIFTY 50',
    assetClass: 'Index',
    benchmark: 'NIFTY 50'
  };
}

function extractTimeframe(lowercaseQuery: string): string | null {
  const isDailyChart =
    lowercaseQuery.includes('daily') ||
    lowercaseQuery.includes('day chart') ||
    lowercaseQuery.includes('eod') ||
    lowercaseQuery.includes('1d');

  if (isDailyChart) {
    return 'Daily';
  }

  const isFifteenMinuteChart =
    lowercaseQuery.includes('15m') ||
    lowercaseQuery.includes('15 min') ||
    lowercaseQuery.includes('15-minute');

  if (isFifteenMinuteChart) {
    return '15 Minutes';
  }

  const isFiveMinuteChart =
    lowercaseQuery.includes('5m') || lowercaseQuery.includes('5 min');

  if (isFiveMinuteChart) {
    return '5 Minutes';
  }

  const isHourlyChart =
    lowercaseQuery.includes('1h') || lowercaseQuery.includes('hourly');

  if (isHourlyChart) {
    return '1 Hour';
  }

  const isWeeklyChart =
    lowercaseQuery.includes('weekly') || lowercaseQuery.includes('1w');

  if (isWeeklyChart) {
    return 'Weekly';
  }

  return null;
}

function extractTradeDirection(lowercaseQuery: string): TradeDirection {
  const hasShortSellingWords =
    lowercaseQuery.includes('short') ||
    lowercaseQuery.includes('sell') ||
    lowercaseQuery.includes('put');

  if (hasShortSellingWords) {
    return 'SHORT';
  }

  return 'LONG';
}

function extractEntryCondition(lowercaseQuery: string, instrumentName: string): string {
  const percentageFirstMatch = lowercaseQuery.match(
    /([0-9]+(?:\.[0-9]+)?%?)\s*(?:fall|drop|dip|down|decline)/i
  );
  if (percentageFirstMatch) {
    const rawNumber = percentageFirstMatch[1];
    const formattedPercentage = rawNumber.includes('%') ? rawNumber : `${rawNumber}%`;
    return `${instrumentName} falls >= ${formattedPercentage}`;
  }

  const percentageSecondMatch = lowercaseQuery.match(
    /(?:fall|drop|dip|down|decline)[s]?\s*(?:of|by|>=|>|about|around)?\s*([0-9]+(?:\.[0-9]+)?%?)/i
  );
  if (percentageSecondMatch) {
    const rawNumber = percentageSecondMatch[1];
    const formattedPercentage = rawNumber.includes('%') ? rawNumber : `${rawNumber}%`;
    return `${instrumentName} falls >= ${formattedPercentage}`;
  }

  const hasSharpDropMention =
    lowercaseQuery.includes('sharp fall') ||
    lowercaseQuery.includes('big drop') ||
    lowercaseQuery.includes('crash');

  if (hasSharpDropMention) {
    return `${instrumentName} sharp fall`;
  }

  const hasRsiOversoldMention =
    lowercaseQuery.includes('rsi') &&
    (lowercaseQuery.includes('oversold') ||
      lowercaseQuery.includes('30') ||
      lowercaseQuery.includes('<'));

  if (hasRsiOversoldMention) {
    return 'RSI(14) < 30';
  }

  const hasBreakoutMention =
    lowercaseQuery.includes('breakout') ||
    lowercaseQuery.includes('swing high') ||
    lowercaseQuery.includes('52-week high');

  if (hasBreakoutMention) {
    return 'Price breaks above 20-period high';
  }

  return `${instrumentName} price pullback`;
}

function extractExitCondition(lowercaseQuery: string): string | null {
  const hasExitDirectives =
    lowercaseQuery.includes('target') ||
    lowercaseQuery.includes('take profit') ||
    lowercaseQuery.includes('stop loss') ||
    lowercaseQuery.includes('trailing');

  if (hasExitDirectives) {
    return 'Defined in query';
  }

  return null;
}

function extractHoldingPeriod(lowercaseQuery: string): string | null {
  const durationMatch = lowercaseQuery.match(
    /(hold|held|holding|for)\s*([0-9]+)\s*(day|days|candles|bars|hours|weeks)/i
  );
  if (durationMatch) {
    const durationCount = durationMatch[2];
    const durationUnit = durationMatch[3];
    return `${durationCount} ${durationUnit}`;
  }

  const isIntradayTrading =
    lowercaseQuery.includes('intraday') ||
    lowercaseQuery.includes('same day') ||
    lowercaseQuery.includes('eod exit');

  if (isIntradayTrading) {
    return 'Intraday';
  }

  return null;
}

function extractMarketFilters(lowercaseQuery: string): string[] {
  const filterList: string[] = [];

  const mentionsVolatility =
    lowercaseQuery.includes('volatility') || lowercaseQuery.includes('vix');

  if (mentionsVolatility) {
    const mentionsHighVolatility = lowercaseQuery.includes('high');
    const mentionsLowVolatility = lowercaseQuery.includes('low');

    if (mentionsHighVolatility) {
      filterList.push('High volatility');
    } else if (mentionsLowVolatility) {
      filterList.push('Low volatility');
    } else {
      filterList.push('Volatility filter');
    }
  }

  const mentionsTrendFilters =
    lowercaseQuery.includes('trend') ||
    lowercaseQuery.includes('above 200') ||
    lowercaseQuery.includes('200 dma') ||
    lowercaseQuery.includes('moving average');

  if (mentionsTrendFilters) {
    filterList.push('Close > 200 EMA');
  }

  return filterList;
}

function createResearchHypothesis(query: string): string {
  return query;
}

function createExtractedEntitiesList(
  instrumentName: string,
  timeframe: string | null,
  direction: TradeDirection,
  entryCondition: string,
  exitCondition: string | null,
  holdingPeriod: string | null,
  filters: string[],
  targetHypothesis: string
): ExtractedEntity[] {
  return [
    {
      field: 'instrument',
      label: 'Instrument',
      value: instrumentName,
      confidence: 1.0,
      status: 'specified'
    },
    {
      field: 'timeframe',
      label: 'Timeframe',
      value: timeframe,
      confidence: timeframe ? 1.0 : 0.0,
      status: timeframe ? 'specified' : 'missing'
    },
    {
      field: 'direction',
      label: 'Direction',
      value: direction,
      confidence: 1.0,
      status: 'specified'
    },
    {
      field: 'entryCondition',
      label: 'Entry Condition',
      value: entryCondition,
      confidence: 1.0,
      status: 'specified'
    },
    {
      field: 'exitCondition',
      label: 'Exit Condition',
      value: exitCondition,
      confidence: exitCondition ? 1.0 : 0.0,
      status: exitCondition ? 'specified' : 'missing'
    },
    {
      field: 'holdingPeriod',
      label: 'Holding Period',
      value: holdingPeriod,
      confidence: holdingPeriod ? 1.0 : 0.0,
      status: holdingPeriod ? 'specified' : 'missing'
    },
    {
      field: 'filters',
      label: 'Filter',
      value: filters.length > 0 ? filters : null,
      confidence: filters.length > 0 ? 1.0 : 0.0,
      status: filters.length > 0 ? 'specified' : 'inferred'
    },
    {
      field: 'targetHypothesis',
      label: 'Question',
      value: targetHypothesis,
      confidence: 1.0,
      status: 'specified'
    }
  ];
}

function createMissingHoldingPeriodField(): MissingField {
  return {
    id: 'missing_holding_period',
    field: 'holdingPeriod',
    label: 'Holding Period',
    importance: 'critical',
    explanation: 'How long the trade stays open before closing.',
    question: 'How long should the position be held?',
    suggestedOptions: [
      {
        label: '1 Day (Next Day Close)',
        value: '1 Day',
        description: 'Exit at the close of next trading day',
        isDefault: true
      },
      {
        label: '3 Days',
        value: '3 Days',
        description: 'Hold for 3 sessions'
      },
      {
        label: '5 Days',
        value: '5 Days',
        description: 'Hold for 5 sessions'
      },
      {
        label: 'Intraday (Exit same day)',
        value: 'Intraday',
        description: 'Close position before market close'
      }
    ],
    allowCustom: true
  };
}

function createMissingExitConditionField(): MissingField {
  return {
    id: 'missing_exit_condition',
    field: 'exitCondition',
    label: 'Exit Rule',
    importance: 'critical',
    explanation: 'Stop loss or profit target criteria.',
    question: 'What is the exit condition?',
    suggestedOptions: [
      {
        label: 'Take Profit: 2% / Stop Loss: 1%',
        value: 'TP: +2%, SL: -1%',
        description: 'Fixed percentage targets',
        isDefault: true
      },
      {
        label: 'Trailing Stop (1.5x ATR)',
        value: 'Trailing Stop 1.5x ATR',
        description: 'Volatility-adjusted trailing stop'
      },
      {
        label: 'Exit at first green candle',
        value: 'First profitable day close',
        description: 'Exit upon positive close'
      },
      {
        label: 'No stop loss (Time exit only)',
        value: 'Time exit only',
        description: 'Exit solely when holding period ends'
      }
    ],
    allowCustom: true
  };
}

function createMissingTimeframeField(): MissingField {
  return {
    id: 'missing_timeframe',
    field: 'timeframe',
    label: 'Timeframe',
    importance: 'recommended',
    explanation: 'Candle resolution to calculate signals on.',
    question: 'Which timeframe should be evaluated?',
    suggestedOptions: [
      {
        label: 'Daily',
        value: 'Daily',
        description: 'Daily candles',
        isDefault: true
      },
      {
        label: '15 Minutes',
        value: '15 Minutes',
        description: 'Intraday 15m candles'
      },
      {
        label: '1 Hour',
        value: '1 Hour',
        description: 'Hourly candles'
      }
    ],
    allowCustom: true
  };
}

function createVolatilityMetricAmbiguityField(): MissingField {
  return {
    id: 'ambiguity_volatility_metric',
    field: 'filters',
    label: 'High Volatility Definition',
    importance: 'recommended',
    explanation: 'Numeric threshold for defining high volatility.',
    question: 'How should high volatility be defined?',
    suggestedOptions: [
      {
        label: 'India VIX > 18',
        value: 'India VIX > 18',
        description: 'VIX level above 18',
        isDefault: true
      },
      {
        label: 'Above 20-Day Average Volatility',
        value: '20-day Realized Vol > Average',
        description: 'Volatility higher than recent average'
      }
    ],
    allowCustom: true
  };
}

function collectMissingFields(
  holdingPeriod: string | null,
  exitCondition: string | null,
  timeframe: string | null,
  lowercaseQuery: string
): MissingField[] {
  const missingFieldList: MissingField[] = [];

  const isHoldingPeriodMissing = !holdingPeriod;
  if (isHoldingPeriodMissing) {
    missingFieldList.push(createMissingHoldingPeriodField());
  }

  const isExitConditionMissing = !exitCondition;
  if (isExitConditionMissing) {
    missingFieldList.push(createMissingExitConditionField());
  }

  const isTimeframeMissing = !timeframe;
  if (isTimeframeMissing) {
    missingFieldList.push(createMissingTimeframeField());
  }

  const hasUnquantifiedVolatility =
    lowercaseQuery.includes('volatility') &&
    !lowercaseQuery.includes('vix >') &&
    !lowercaseQuery.includes('vix <');

  if (hasUnquantifiedVolatility) {
    missingFieldList.push(createVolatilityMetricAmbiguityField());
  }

  return missingFieldList;
}

function calculateMissingScore(missingFields: MissingField[]): number {
  return missingFields.length;
}

export function parseQueryHeuristic(query: string): StructuredExperiment {
  const lowercaseQuery = query.toLowerCase();
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  const experimentId = `exp_${randomSuffix}`;
  const currentTimestamp = new Date().toISOString();

  const instrumentMetadata = extractInstrumentInformation(lowercaseQuery, query);
  const timeframe = extractTimeframe(lowercaseQuery);
  const direction = extractTradeDirection(lowercaseQuery);
  const entryCondition = extractEntryCondition(lowercaseQuery, instrumentMetadata.name);
  const exitCondition = extractExitCondition(lowercaseQuery);
  const holdingPeriod = extractHoldingPeriod(lowercaseQuery);
  const filters = extractMarketFilters(lowercaseQuery);
  const targetHypothesis = createResearchHypothesis(query);

  const entities = createExtractedEntitiesList(
    instrumentMetadata.name,
    timeframe,
    direction,
    entryCondition,
    exitCondition,
    holdingPeriod,
    filters,
    targetHypothesis
  );

  const missingFields = collectMissingFields(
    holdingPeriod,
    exitCondition,
    timeframe,
    lowercaseQuery
  );

  const missingScore = calculateMissingScore(missingFields);
  const experimentTitle = `${instrumentMetadata.name} Strategy Experiment`;
  const isFullySpecified = missingFields.length === 0;

  return {
    id: experimentId,
    createdAt: currentTimestamp,
    updatedAt: currentTimestamp,
    originalQuery: query,
    title: experimentTitle,
    instrument: instrumentMetadata.name,
    assetClass: instrumentMetadata.assetClass,
    timeframe: timeframe || 'Not specified',
    direction,
    entryCondition,
    exitCondition: exitCondition || 'Not specified',
    holdingPeriod: holdingPeriod || 'Not specified',
    filters,
    benchmark: instrumentMetadata.benchmark,
    targetHypothesis,
    entities,
    ambiguityScore: missingScore,
    missingFields,
    resolvedClarifications: {},
    isFullySpecified
  };
}
