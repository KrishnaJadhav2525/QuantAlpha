import { NextRequest, NextResponse } from 'next/server';
import { parseQueryWithGroq } from '@/lib/groq';

interface AnalyzeRequestBody {
  query?: string;
  apiKey?: string;
}

export async function POST(incomingRequest: NextRequest) {
  try {
    const requestPayload: AnalyzeRequestBody = await incomingRequest.json();
    const rawTradingQuery = requestPayload.query;

    if (!rawTradingQuery || typeof rawTradingQuery !== 'string' || rawTradingQuery.trim().length === 0) {
      return NextResponse.json(
        { error: 'A trading research query is required.' },
        { status: 400 }
      );
    }

    const trimmedTradingQuery = rawTradingQuery.trim();
    const analysisStartTime = Date.now();

    const groqAnalysisResult = await parseQueryWithGroq(
      trimmedTradingQuery,
      requestPayload.apiKey
    );
    const executionDurationMilliseconds = Date.now() - analysisStartTime;

    return NextResponse.json({
      experiment: groqAnalysisResult.experiment,
      aiProvider: groqAnalysisResult.provider,
      latencyMs: executionDurationMilliseconds
    });
  } catch (caughtError) {
    const errorMessage =
      caughtError instanceof Error
        ? caughtError.message
        : 'Failed to analyze query.';

    const isClientInputError =
      errorMessage.includes('No trading') ||
      errorMessage.includes('Please enter a trading') ||
      errorMessage.includes('required');

    return NextResponse.json(
      { error: errorMessage },
      { status: isClientInputError ? 400 : 500 }
    );
  }
}
