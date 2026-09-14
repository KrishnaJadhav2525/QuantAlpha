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

const COMMON_WORDS_TO_IGNORE = ['DOES', 'WHAT', 'WHEN', 'WITH', 'FROM', 'AFTER', 'THAT', 'THIS', 'HAVE'];

function extractInstrumentInformation(
  lowercaseQuery: string,
  originalQuery: string
): InstrumentMetadata | null {
  for (const [instrumentKeyword, metadata] of Object.entries(INSTRUMENT_DIRECTORY)) {
    if (lowercaseQuery.includes(instrumentKeyword)) {
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
      benchmark: 'Market Benchmark'
    };
  }

  return null;
}

function extractTimeframe(lowercaseQuery: string): string | null {
  if (lowercaseQuery.includes('daily') || lowercaseQuery.includes('day chart') || lowercaseQuery.includes('eod') || lowercaseQuery.includes('1d')) {
    return 'Daily';
  }
  if (lowercaseQuery.includes('15m') || lowercaseQuery.includes('15 min') || lowercaseQuery.includes('15-minute')) {
    return '15 Minutes';
  }
  if (lowercaseQuery.includes('5m') || lowercaseQuery.includes('5 min')) {
    return '5 Minutes';
  }
  if (lowercaseQuery.includes('1h') || lowercaseQuery.includes('hourly')) {
    return '1 Hour';
  }
  if (lowercaseQuery.includes('weekly') || lowercaseQuery.includes('1w')) {
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

  const hasLongBuyingWords =
    lowercaseQuery.includes('buy') ||
    lowercaseQuery.includes('long') ||
    lowercaseQuery.includes('call');

  if (hasLongBuyingWords) {
    return 'LONG';
  }

  return 'UNSPECIFIED';
}

function extractEntryCondition(lowercaseQuery: string): string | null {
  const percentageFirstMatch = lowercaseQuery.match(
    /([0-9]+(?:\.[0-9]+)?%?)\s*(?:fall|drop|dip|down|decline|crash|pullback)/i
  );
  if (percentageFirstMatch) {
    const rawNumber = percentageFirstMatch[1];
    const formattedPercentage = rawNumber.includes('%') ? rawNumber : `${rawNumber}%`;
    return `Price falls >= ${formattedPercentage}`;
  }

  const percentageSecondMatch = lowercaseQuery.match(
    /(?:fall|drop|dip|down|decline|crash|pullback)[s]?\s*(?:of|by|>=|>|about|around)?\s*([0-9]+(?:\.[0-9]+)?%?)/i
  );
  if (percentageSecondMatch) {
    const rawNumber = percentageSecondMatch[1];
    const formattedPercentage = rawNumber.includes('%') ? rawNumber : `${rawNumber}%`;
    return `Price falls >= ${formattedPercentage}`;
  }

  if (lowercaseQuery.includes('sharp fall') || lowercaseQuery.includes('big drop') || lowercaseQuery.includes('crash')) {
    return 'Sharp price drop';
  }

  if (lowercaseQuery.includes('rsi') && (lowercaseQuery.includes('oversold') || lowercaseQuery.includes('30') || lowercaseQuery.includes('<'))) {
    return 'RSI(14) < 30';
  }

  if (lowercaseQuery.includes('breakout') || lowercaseQuery.includes('swing high') || lowercaseQuery.includes('52-week high')) {
    return 'Price breaks above 20-period high';
  }

  return null;
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

  if (lowercaseQuery.includes('intraday') || lowercaseQuery.includes('same day') || lowercaseQuery.includes('eod exit')) {
    return 'Intraday';
  }

  return null;
}

function extractMarketFilters(lowercaseQuery: string): string[] {
  const filterList: string[] = [];

  const mentionsVolatility =
    lowercaseQuery.includes('volatility') || lowercaseQuery.includes('vix');

  if (mentionsVolatility) {
    if (lowercaseQuery.includes('high')) {
      filterList.push('High volatility');
    } else if (lowercaseQuery.includes('low')) {
      filterList.push('Low volatility');
    } else {
      filterList.push('Volatility filter');
    }
  }

  if (lowercaseQuery.includes('trend') || lowercaseQuery.includes('above 200') || lowercaseQuery.includes('200 dma') || lowercaseQuery.includes('moving average')) {
    filterList.push('Close > 200 EMA');
  }

  return filterList;
}

function buildMissingFields(
  instrument: string | null,
  entryCondition: string | null,
  holdingPeriod: string | null,
  exitCondition: string | null,
  timeframe: string | null
): MissingField[] {
  const missingFieldList: MissingField[] = [];

  if (!instrument) {
    missingFieldList.push({
      id: 'missing_instrument',
      field: 'instrument',
      label: 'Target Instrument',
      importance: 'critical',
      explanation: 'Which market or asset you want to test.',
      question: 'Which instrument or index do you want to test?',
      suggestedOptions: [
        { label: 'NIFTY 50', value: 'NIFTY 50', description: 'NSE Benchmark Index', isDefault: true },
        { label: 'BANKNIFTY', value: 'BANKNIFTY', description: 'NSE Banking Sector Index' },
        { label: 'S&P 500 (SPY)', value: 'SPY', description: 'US Benchmark ETF' },
        { label: 'RELIANCE', value: 'RELIANCE', description: 'Large-cap Indian Equity' }
      ],
      allowCustom: true
    });
  }

  if (!entryCondition) {
    missingFieldList.push({
      id: 'missing_entry_condition',
      field: 'entryCondition',
      label: 'Entry Trigger',
      importance: 'critical',
      explanation: 'The specific price event that triggers a trade.',
      question: 'What is the entry trigger condition?',
      suggestedOptions: [
        { label: 'Price drops >= 1% from prior close', value: 'Price falls >= 1%', description: 'Standard pullback trigger', isDefault: true },
        { label: 'Price drops >= 2% from prior close', value: 'Price falls >= 2%', description: 'Larger dip trigger' },
        { label: 'RSI(14) crosses below 30', value: 'RSI(14) < 30', description: 'Oversold indicator trigger' }
      ],
      allowCustom: true
    });
  }

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

function buildEntities(
  instrument: string | null,
  timeframe: string | null,
  direction: TradeDirection,
  entryCondition: string | null,
  exitCondition: string | null,
  holdingPeriod: string | null,
  filters: string[],
  targetHypothesis: string
): ExtractedEntity[] {
  return [
    {
      field: 'instrument',
      label: 'Instrument',
      value: instrument,
      confidence: instrument ? 1.0 : 0.0,
      status: instrument ? 'specified' : 'missing'
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
      value: direction !== 'UNSPECIFIED' ? direction : null,
      confidence: direction !== 'UNSPECIFIED' ? 1.0 : 0.0,
      status: direction !== 'UNSPECIFIED' ? 'specified' : 'missing'
    },
    {
      field: 'entryCondition',
      label: 'Entry Condition',
      value: entryCondition,
      confidence: entryCondition ? 1.0 : 0.0,
      status: entryCondition ? 'specified' : 'missing'
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

export function parseQueryHeuristic(query: string): StructuredExperiment {
  const trimmed = query.trim();
  const lowercaseQuery = trimmed.toLowerCase();

  const casualPhrases = ['hi', 'hello', 'hey', 'test', 'asdf', 'who are you', 'how are you'];
  if (casualPhrases.includes(lowercaseQuery) || trimmed.length < 4) {
    throw new Error('No trading asset or strategy condition detected in this query. Please enter a market question (e.g., "Does buying NIFTY after a 1% fall work better during high-volatility periods?").');
  }

  const instrumentMeta = extractInstrumentInformation(lowercaseQuery, trimmed);
  const instrument = instrumentMeta ? instrumentMeta.name : null;
  const assetClass = instrumentMeta ? instrumentMeta.assetClass : 'Index';
  const benchmark = instrumentMeta ? instrumentMeta.benchmark : 'Benchmark Index';

  const timeframe = extractTimeframe(lowercaseQuery);
  const direction = extractTradeDirection(lowercaseQuery);
  const entryCondition = extractEntryCondition(lowercaseQuery);
  const exitCondition = extractExitCondition(lowercaseQuery);
  const holdingPeriod = extractHoldingPeriod(lowercaseQuery);
  const filters = extractMarketFilters(lowercaseQuery);

  const missingFields = buildMissingFields(
    instrument,
    entryCondition,
    holdingPeriod,
    exitCondition,
    timeframe
  );

  const entities = buildEntities(
    instrument,
    timeframe,
    direction,
    entryCondition,
    exitCondition,
    holdingPeriod,
    filters,
    trimmed
  );

  const randomSuffix = Math.random().toString(36).substring(2, 9);
  const currentTimestamp = new Date().toISOString();
  const title = instrument ? `${instrument} Strategy Experiment` : 'Custom Strategy Experiment';

  return {
    id: `exp_${randomSuffix}`,
    createdAt: currentTimestamp,
    updatedAt: currentTimestamp,
    originalQuery: trimmed,
    title,
    instrument,
    assetClass,
    timeframe,
    direction,
    entryCondition,
    exitCondition,
    holdingPeriod,
    filters,
    benchmark,
    targetHypothesis: trimmed,
    entities,
    ambiguityScore: missingFields.length,
    missingFields,
    resolvedClarifications: {},
    isFullySpecified: missingFields.length === 0
  };
}
