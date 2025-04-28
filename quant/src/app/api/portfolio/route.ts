// App Router Route: POST /api/portfolio
import { NextResponse } from 'next/server';
import type { StockData } from '@/lib/stockData';
import { getStockData } from '@/lib/stockData';
import { calculatePortfolioMetrics } from '@/lib/portfolioCalculations';
import type { PositionWithData, PortfolioMetrics } from '@/lib/portfolioCalculations';

// Error response format
type ErrorResponse = { error: string };

// Expect request body:
// {
//   positions: Array<{
//     ticker: string;
//     quantity: number;
//     averagePrice: number;
//     positionType: 'long' | 'short';
//   }>,
//   timeframe?: '1d' | '1w' | '1m' | '1y'
// }
// POST /api/portfolio
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.positions || !Array.isArray(body.positions)) {
      return NextResponse.json({ error: 'Missing positions array' }, { status: 400 });
    }
    const { positions, timeframe = '1y' } = body as {
      positions: Omit<PositionWithData, 'currentPrice' | 'historicalData'>[];
      timeframe?: '1d'|'1w'|'1m'|'1y';
    };

    // 1) Fetch historical bars for each stock
    const enrichedPositions: PositionWithData[] = await Promise.all(
      positions.map(async pos => {
        const hist = await getStockData(pos.ticker, timeframe);
        const latest = hist[hist.length - 1].close;
        return {
          ...pos,
          historicalData: hist,
          currentPrice: latest,
        };
      })
    );

    // 2) Fetch benchmark series (e.g., S&P 500)
    const benchmarkData: StockData[] = await getStockData('SPY', timeframe);

    // 3) Compute metrics via CAPM
    const metrics: PortfolioMetrics = calculatePortfolioMetrics(
      enrichedPositions,
      benchmarkData
    );

    return NextResponse.json(metrics);
  } catch (err: unknown) {
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json<ErrorResponse>({ error: errorMessage }, { status: 500 });
  }
}
