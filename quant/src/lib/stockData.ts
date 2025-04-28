import { subDays, formatISO } from 'date-fns';

export interface StockData {
  date: string;
  close: number;
}

interface PolygonStockResponse {
  results: Array<{
    c: number;   // close price
    t: number;   // timestamp in ms
  }>;
}

type Timeframe = '1d' | '1w' | '1m' | '1y';

const TIMEFRAME_CONFIG: Record<
  Timeframe,
  { multiplier: number; timespan: 'day' | 'week' | 'month'; lookbackDays: number }
> = {
  '1d': { multiplier: 1, timespan: 'day', lookbackDays: 1 },
  '1w': { multiplier: 1, timespan: 'day', lookbackDays: 7 },
  '1m': { multiplier: 1, timespan: 'day', lookbackDays: 30 },
  '1y': { multiplier: 1, timespan: 'day', lookbackDays: 365 },
};

/**
 * Fetches aggregated price bars from Polygon for a given ticker and timeframe.
 */
async function fetchStockData(
  ticker: string,
  timeframe: Timeframe
): Promise<PolygonStockResponse> {
  const apiKey = process.env.NEXT_PUBLIC_POLYGON_API_KEY;
  if (!apiKey) {
    throw new Error('Missing Polygon API key in environment');
  }

  const upper = ticker.toUpperCase();
  const cfg = TIMEFRAME_CONFIG[timeframe] || TIMEFRAME_CONFIG['1y'];

  const to    = formatISO(new Date(), { representation: 'date' });
  const from  = formatISO(subDays(new Date(), cfg.lookbackDays), { representation: 'date' });

  const url = new URL(
    `https://api.polygon.io/v2/aggs/ticker/${upper}/range/${cfg.multiplier}/${cfg.timespan}/${from}/${to}`
  );
  url.searchParams.set('adjusted', 'true');
  url.searchParams.set('sort', 'asc');
  // Limit to requested number of bars
  url.searchParams.set('limit', String(cfg.lookbackDays));
  url.searchParams.set('apiKey', apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Polygon API error (${res.status}): ${res.statusText}`);
  }

  const data = (await res.json()) as PolygonStockResponse;
  if (!data.results || data.results.length === 0) {
    throw new Error(`No data for ${upper} over ${timeframe}`);
  }

  return data;
}

/**
 * Returns mapped StockData[] for given ticker and timeframe.
 */
export async function getStockData(
  ticker: string,
  timeframe: Timeframe = '1y'
): Promise<StockData[]> {
  const payload = await fetchStockData(ticker, timeframe);

  return payload.results.map(bar => ({
    date: new Date(bar.t).toISOString(),
    close: bar.c,
  }));
}
