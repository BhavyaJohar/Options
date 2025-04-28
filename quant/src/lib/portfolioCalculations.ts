export interface PositionWithData {
  ticker: string;
  quantity: number;
  averagePrice: number;
  positionType: 'long' | 'short';
  currentPrice: number;
  historicalData: StockData[];
}

export interface PortfolioMetrics {
  // total return as a decimal (profit / cost basis)
  totalReturn: number;
  alpha: number;
  beta: number;
  sharpeRatio: number;
  // array of daily portfolio returns (fractional), in the same order as common dates
  dailyReturns: number[];
}

interface StockData {
  date: string;
  close: number;
}

export function calculatePortfolioMetrics(
  positions: PositionWithData[],
  benchmarkHistoricalData: StockData[]
): PortfolioMetrics {
  // 1) Compute cost basis and weights at purchase
  const costs = positions.map(p => p.quantity * p.averagePrice);
  const totalCost = costs.reduce((a, b) => a + b, 0);
  const weights = costs.map(c => c / totalCost);

  // 2) Build date‐aligned price maps
  const benchmarkMap = new Map(benchmarkHistoricalData.map(d => [d.date, d.close]));
  const positionMaps = positions.map(p =>
    new Map(p.historicalData.map(d => [d.date, d.close]))
  );

  const commonDates = [...benchmarkMap.keys()]
    .filter(date => positionMaps.every(m => m.has(date)))
    .sort();

  // 3) Compute daily *individual* returns, then portfolio return = ∑ wᵢ·rᵢ
  const dailyRp: number[] = [];
  const dailyRm: number[] = [];
  for (let i = 1; i < commonDates.length; i++) {
    const prev = commonDates[i - 1];
    const curr = commonDates[i];

    // market return
    const prevMarketPrice = benchmarkMap.get(prev);
    const currMarketPrice = benchmarkMap.get(curr);
    if (prevMarketPrice === undefined || currMarketPrice === undefined) continue;
    const rm = (currMarketPrice - prevMarketPrice) / prevMarketPrice;
    dailyRm.push(rm);

    // portfolio return as weighted sum, flipping for shorts
    let rp = 0;
    for (let j = 0; j < positions.length; j++) {
      const m = positionMaps[j];
      const prevPrice = m.get(prev);
      const currPrice = m.get(curr);
      if (prevPrice === undefined || currPrice === undefined) continue;
      const r = (currPrice - prevPrice) / prevPrice;
      const sign = positions[j].positionType === 'short' ? -1 : 1;
      rp += weights[j] * sign * r;
    }
    dailyRp.push(rp);
  }

  // 4) Total Return = ∑ wᵢ·(position return), adjusted for position type
  const totalReturn = positions
    .map((p, i) => {
      const raw = (p.currentPrice - p.averagePrice) / p.averagePrice;
      const sign = p.positionType === 'short' ? -1 : 1;
      return weights[i] * sign * raw;
    })
    .reduce((a, b) => a + b, 0);

  // 5) CAPM on **excess** returns
  const riskFreeRate = 0.03;                // 3% annual
  const drf = riskFreeRate / 252;           // simple daily rf
  const excessRp = dailyRp.map(r => r - drf);
  const excessRm = dailyRm.map(r => r - drf);

  const n = excessRp.length;
  const avgExRp = excessRp.reduce((a, b) => a + b, 0) / n;
  const avgExRm = excessRm.reduce((a, b) => a + b, 0) / n;

  // sample covariance & variance (ddof=1)
  let cov = 0 
  let varM = 0;
  for (let i = 0; i < n; i++) {
    cov  += (excessRp[i] - avgExRp) * (excessRm[i] - avgExRm);
    varM += (excessRm[i] - avgExRm) ** 2;
  }
  cov  /= (n - 1);
  varM /= (n - 1);
  const beta = varM === 0 ? 0 : cov / varM;
  const alpha = (avgExRp - beta * avgExRm) * 252;  // annualized

  // 6) Sharpe = E[exRp] / σ(exRp) * √252, with sample σ
  const sumSq = excessRp.reduce((acc, r) => acc + (r - avgExRp) ** 2, 0);
  const stdExRp = Math.sqrt(sumSq / (n - 1));
  const sharpeRatio = stdExRp === 0 ? 0 : (avgExRp / stdExRp) * Math.sqrt(252);

  return { totalReturn, alpha, beta, sharpeRatio, dailyReturns: dailyRp };
}
