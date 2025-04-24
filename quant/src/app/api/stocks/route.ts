import { NextResponse } from 'next/server';

interface PolygonStockResponse {
  ticker: string;
  queryCount: number;
  resultsCount: number;
  adjusted: boolean;
  results: Array<{
    v: number;  // volume
    vw: number; // volume weighted average price
    o: number;  // open
    c: number;  // close
    h: number;  // high
    l: number;  // low
    t: number;  // timestamp
    n: number;  // number of trades
  }>;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');

    if (!ticker) {
      return NextResponse.json(
        { error: 'Missing ticker parameter' },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_POLYGON_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing Polygon API key' },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/${ticker.toUpperCase()}/prev?adjusted=true&apiKey=${apiKey}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: `Ticker ${ticker} not found` },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch stock price' },
        { status: response.status }
      );
    }

    const data = await response.json() as PolygonStockResponse;
    
    if (!data.results || data.results.length === 0) {
      return NextResponse.json(
        { error: `No price data available for ${ticker}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      price: data.results[0].c,
      ticker: data.ticker,
      timestamp: new Date(data.results[0].t).toISOString()
    });
  } catch (err) {
    console.error('Error fetching stock price:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 