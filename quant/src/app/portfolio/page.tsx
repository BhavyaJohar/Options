'use client';

import { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import Link from 'next/link';

interface Position {
  id: string;
  ticker: string;
  quantity: number;
  averagePrice: number;
  positionType: 'long' | 'short';
}

interface PortfolioMetrics {
  // total return as a decimal (profit / cost basis)
  totalReturn: number;
  alpha: number;
  beta: number;
  sharpeRatio: number;
}

// API response extends metrics with an array of daily returns for simulation
interface ApiResult extends PortfolioMetrics {
  dailyReturns: number[];
}


interface FormData {
  id: string;
  ticker: string;
  quantity: string;
  averagePrice: string;
  positionType: 'long' | 'short';
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
  }>;
  positions: Position[];
}

const COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

const CustomTooltip = ({ active, payload, positions }: TooltipProps) => {
  if (active && payload && payload.length) {
    // Calculate total portfolio value
    const totalPortfolioValue = positions.reduce((sum: number, position: Position) => 
      sum + (position.quantity * position.averagePrice), 0);
    
    // Get the current position's value
    const currentValue = payload[0].value;
    const percentage = ((currentValue / totalPortfolioValue) * 100).toFixed(1);
    
    return (
      <div className="bg-[#2D3748] p-3 border border-[#4A5568] rounded-lg">
        <p className="text-white font-medium">{payload[0].name}</p>
        <p className="text-white">
          ${currentValue.toFixed(2)} ({percentage}%)
        </p>
      </div>
    );
  }
  return null;
};

interface CachedResults {
  metrics: PortfolioMetrics;
  dailyReturns: number[];
  simResults: { p5: number; p50: number; p95: number } | null;
  timestamp: string;
}

export default function Portfolio() {
  const [formData, setFormData] = useState<FormData>(() => ({
    id: '0',
    ticker: '',
    quantity: '',
    averagePrice: '',
    positionType: 'long',
  }));

  const [positions, setPositions] = useState<Position[]>(() => []);

  const [metrics, setMetrics] = useState<PortfolioMetrics>({
    totalReturn: 0,
    alpha: 0,
    beta: 0,
    sharpeRatio: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Monte Carlo simulation states
  const [dailyReturns, setDailyReturns] = useState<number[]>([]);
  const [finalReturns, setFinalReturns] = useState<number[]>([]);
  const [simResults, setSimResults] = useState<{ p5: number; p50: number; p95: number } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Persist positions to localStorage
  useEffect(() => {
    const stored = localStorage.getItem('portfolio_positions');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Position[];
        setPositions(parsed);
      } catch {
        localStorage.removeItem('portfolio_positions');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('portfolio_positions', JSON.stringify(positions));
  }, [positions]);

  // Load cached results on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('portfolio_analysis_results');
      if (cached) {
        try {
          const { metrics: cachedMetrics, dailyReturns: cachedDailyReturns, simResults: cachedSimResults, timestamp } = JSON.parse(cached) as CachedResults;
          
          // Check if cache is less than 1 hour old
          const cacheAge = new Date().getTime() - new Date(timestamp).getTime();
          const oneHour = 60 * 60 * 1000;
          
          if (cacheAge < oneHour) {
            setMetrics(cachedMetrics);
            setDailyReturns(cachedDailyReturns);
            setSimResults(cachedSimResults);
          } else {
            // Clear expired cache
            localStorage.removeItem('portfolio_analysis_results');
          }
        } catch {
          localStorage.removeItem('portfolio_analysis_results');
        }
      }
    }
  }, []);

  // Run Monte Carlo simulation when daily returns are set
  useEffect(() => {
    if (dailyReturns.length === 0) {
      setSimResults(null);
      setFinalReturns([]);
      return;
    }
    setIsSimulating(true);
    // Calculate mean & std of daily returns
    const n = dailyReturns.length;
    const mean = dailyReturns.reduce((sum, r) => sum + r, 0) / n;
    const variance = dailyReturns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / (n - 1);
    const std = Math.sqrt(variance);
    // Monte Carlo parameters
    const runs = 5000;
    const horizon = 252; // days
    const results: number[] = [];
    // Box-Muller for normal samples
    function randNorm() {
      let u = 0;
      let v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }
    for (let i = 0; i < runs; i++) {
      let value = 1;
      for (let d = 0; d < horizon; d++) {
        const shock = mean + std * randNorm();
        value *= 1 + shock;
      }
      results.push(value - 1);
    }
    // Store distribution of final returns
    setFinalReturns(results);
    results.sort((a, b) => a - b);
    const p5 = results[Math.floor(runs * 0.05)];
    const p50 = results[Math.floor(runs * 0.5)];
    const p95 = results[Math.floor(runs * 0.95)];
    setSimResults({ p5, p50, p95 });
    setIsSimulating(false);
  }, [dailyReturns]);
  // Prepare histogram data of Monte Carlo final returns
  const histData = useMemo(() => {
    if (finalReturns.length === 0) return [];
    const bins = 20;
    const min = Math.min(...finalReturns);
    const max = Math.max(...finalReturns);
    const size = (max - min) / bins;
    const data: { bin: string; count: number }[] = [];
    for (let i = 0; i < bins; i++) {
      const from = min + i * size;
      const count = finalReturns.filter(r => r >= from && r < from + size).length;
      data.push({ bin: `${(from * 100).toFixed(1)}%`, count });
    }
    // label last bin with a "+"
    const lastFrom = min + (bins - 1) * size;
    data[bins - 1].bin = `${(lastFrom * 100).toFixed(1)}%+`;
    return data;
  }, [finalReturns]);

  const inputClasses =
    'w-full px-4 py-3 bg-[#1A1F2C] border border-[#4A5568] rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent transition-all';

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setError(null);
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev };
      const fieldName = name as keyof FormData;
      if (fieldName === 'quantity' || fieldName === 'averagePrice') {
        // Allow any numeric input
        updated[fieldName] = value;
      } else if (fieldName === 'ticker') {
        updated[fieldName] = value.toUpperCase();
      } else if (fieldName === 'positionType') {
        updated[fieldName] = value as 'long' | 'short';
      }
      return updated;
    });
  };

  const addPosition = () => {
    const quantity = Number(formData.quantity);
    const averagePrice = Number(formData.averagePrice);

    // Validate for positive numbers when adding position
    if (!formData.ticker || 
        !quantity || 
        quantity <= 0 || 
        !averagePrice || 
        averagePrice <= 0) {
      setError('Please enter valid position data');
      return;
    }

    setPositions((prev) => [...prev, { 
      ...formData, 
      id: uuidv4(),
      quantity,
      averagePrice
    }]);
    setFormData({
      id: '0',
      ticker: '',
      quantity: '',
      averagePrice: '',
      positionType: 'long',
    });
  };

  const removePosition = (id: string) => {
    setPositions((prev) => prev.filter((p) => p.id !== id));
  };

  const analyzePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();

    if (positions.length === 0) {
      setError('Please add at least one position');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positions }),
      });

      if (response.ok) {
        const data: ApiResult = await response.json();
        const newMetrics = {
          totalReturn: data.totalReturn,
          alpha: data.alpha,
          beta: data.beta,
          sharpeRatio: data.sharpeRatio,
        };
        
        // Update state
        setMetrics(newMetrics);
        setDailyReturns(data.dailyReturns);
        
        // Cache the results
        const cacheData: CachedResults = {
          metrics: newMetrics,
          dailyReturns: data.dailyReturns,
          simResults: simResults,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('portfolio_analysis_results', JSON.stringify(cacheData));
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to analyze portfolio');
        setDailyReturns([]);
        setSimResults(null);
      }
    } catch (err) {
      console.error('Error analyzing portfolio:', err);
      setError('Failed to analyze portfolio');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1F2C] to-[#0F172A] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] bg-clip-text text-transparent">
            Portfolio Analysis
          </h1>
          <p className="text-[#8E9196]">
            Analyze your portfolio positions and performance
          </p>
          <div className="flex justify-center gap-4 mb-4 mt-4">
            <Link
              href="/"
              className="px-4 py-2 bg-[#8B5CF6]/20 text-[#8B5CF6] rounded-lg hover:bg-[#8B5CF6]/30 transition-colors"
            >
              Options Price Calculator
            </Link>
          </div>
        </div>

        <form onSubmit={analyzePortfolio} noValidate className="mb-8">
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            {/* Form Controls on the left */}
            <div className="w-full md:w-1/3">
              <div className="p-6 bg-[#2D3748]/50 backdrop-blur-sm rounded-xl border border-[#4A5568]/30 shadow-lg hover:shadow-xl transition-shadow h-[540px] flex flex-col">
                <h2 className="text-xl font-semibold mb-4">Add Position</h2>
                <div className="space-y-4 flex-grow">
                  <div>
                    <label
                      htmlFor="ticker"
                      className="text-[#8E9196] block mb-2 font-medium"
                    >
                      Ticker
                    </label>
                    <input
                      id="ticker"
                      type="text"
                      name="ticker"
                      value={formData.ticker}
                      onChange={handleInputChange}
                      className={inputClasses}
                      placeholder="AAPL"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="quantity"
                      className="text-[#8E9196] block mb-2 font-medium"
                    >
                      Quantity
                    </label>
                    <input
                      id="quantity"
                      type="number"
                      name="quantity"
                      min="0.01"
                      step="0.01"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      className={inputClasses}
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="averagePrice"
                      className="text-[#8E9196] block mb-2 font-medium"
                    >
                      Average Price
                    </label>
                    <input
                      id="averagePrice"
                      type="number"
                      name="averagePrice"
                      min="0.01"
                      step="0.01"
                      value={formData.averagePrice}
                      onChange={handleInputChange}
                      className={inputClasses}
                      placeholder="150.00"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="positionType"
                      className="text-[#8E9196] block mb-2 font-medium"
                    >
                      Position Type
                    </label>
                    <select
                      id="positionType"
                      name="positionType"
                      value={formData.positionType}
                      onChange={handleInputChange}
                      className={inputClasses}
                    >
                      <option value="long">Long</option>
                      <option value="short">Short</option>
                    </select>
                  </div>
                </div>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={addPosition}
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-[#8B5CF6]/20 text-[#8B5CF6] rounded-lg hover:bg-[#8B5CF6]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Position
                  </button>
                </div>
              </div>
            </div>

            {/* Positions Summary in the middle */}
            <div className="w-full md:w-1/3">
              <div className="p-6 bg-[#2D3748]/50 backdrop-blur-sm rounded-xl border border-[#4A5568]/30 shadow-lg h-[540px]">
                <h2 className="text-xl font-semibold mb-4">Positions Summary</h2>
                <div className="space-y-4 h-[500px] overflow-y-auto pr-2">
                  {positions.map((position) => (
                    <div key={position.id} className="p-4 bg-[#1A1F2C] rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-medium">{position.ticker}</p>
                        <p className="text-sm text-[#8E9196]">
                          {position.quantity} shares @ ${position.averagePrice}
                        </p>
                        <p className="text-sm text-[#8E9196]">
                          Type: {position.positionType}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePosition(position.id)}
                        className="p-2 text-red-500 hover:text-red-400 transition-colors"
                        aria-label="Delete position"
                        title="Delete position"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Portfolio Visualization on the right */}
            <div className="w-full md:w-1/3">
              <div className="p-6 bg-[#2D3748]/50 backdrop-blur-sm rounded-xl border border-[#4A5568]/30 shadow-lg h-[540px]">
                <h2 className="text-xl font-semibold mb-4">Portfolio Distribution</h2>
                <div className="h-[400px] flex items-center justify-center">
                  {positions.length > 0 ? (
                    <div className="w-full h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={positions.map(position => ({
                              name: position.ticker,
                              value: position.quantity * position.averagePrice,
                              type: position.positionType
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={150}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {positions.map((entry, index) => (
                              <Cell key={`cell-${entry.id}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip positions={positions} />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-[#8E9196] text-center">Add positions to see portfolio distribution</p>
                  )}
                </div>
                {positions.length > 0 && (
                  <div className="mt-4">
                    <div className="flex flex-wrap justify-center gap-4">
                      {positions.map((position, index) => (
                        <div key={position.id} className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-white text-sm">
                            {position.ticker}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Analyze Portfolio Button */}
          <div className="mt-8">
            <button
              type="submit"
              disabled={isLoading || positions.length === 0}
              className="w-full px-4 py-3 bg-[#8B5CF6] text-white rounded-lg hover:bg-[#8B5CF6]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Analyzing...' : 'Analyze Portfolio'}
            </button>
            {error && (
              <p className="text-red-500 text-center mt-4" aria-live="polite">
                {error}
              </p>
            )}
          </div>
        </form>

        {/* Metrics Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-[#2D3748]/50 backdrop-blur-sm rounded-xl border border-[#4A5568]/30 shadow-lg">
            <h3 className="text-[#8E9196] font-medium mb-2">Total Return</h3>
            <p className="text-2xl font-bold text-[#8B5CF6]">
              {isLoading
                ? '...'
                : `${(metrics.totalReturn * 100).toFixed(2)}%`}
            </p>
            <p className="text-sm text-[#8E9196] mt-1">
              Weighted average return of all positions over the selected period (percentage).
            </p>
          </div>
          <div className="p-6 bg-[#2D3748]/50 backdrop-blur-sm rounded-xl border border-[#4A5568]/30 shadow-lg">
            <h3 className="text-[#8E9196] font-medium mb-2">Alpha</h3>
            <p className="text-2xl font-bold text-[#8B5CF6]">
              {isLoading
                ? '...'
                : `${(metrics.alpha * 100).toFixed(2)}%`}
            </p>
            <p className="text-sm text-[#8E9196] mt-1">
              Annualized excess return vs. benchmark (CAPM alpha, percentage per year).
            </p>
          </div>
          <div className="p-6 bg-[#2D3748]/50 backdrop-blur-sm rounded-xl border border-[#4A5568]/30 shadow-lg">
            <h3 className="text-[#8E9196] font-medium mb-2">Beta</h3>
            <p className="text-2xl font-bold text-[#8B5CF6]">
              {isLoading ? '...' : metrics.beta.toFixed(2)}
            </p>
            <p className="text-sm text-[#8E9196] mt-1">
              CAPM beta: sensitivity of portfolio returns to benchmark movements (unitless).
            </p>
          </div>
          <div className="p-6 bg-[#2D3748]/50 backdrop-blur-sm rounded-xl border border-[#4A5568]/30 shadow-lg">
            <h3 className="text-[#8E9196] font-medium mb-2">Sharpe Ratio</h3>
            <p className="text-2xl font-bold text-[#8B5CF6]">
              {isLoading ? '...' : metrics.sharpeRatio.toFixed(2)}
            </p>
            <p className="text-sm text-[#8E9196] mt-1">
              Annualized Sharpe ratio: excess return per unit of volatility (unitless).
            </p>
          </div>
        </div>
        {/* Monte Carlo Simulation Summary */}
        <div className="mt-8 p-6 bg-[#2D3748]/50 backdrop-blur-sm rounded-xl border border-[#4A5568]/30 shadow-lg">
          <h3 className="text-[#8E9196] font-medium mb-2">Monte Carlo Simulation (1-year projection)</h3>
          {isSimulating ? (
            <p className="text-[#8E9196]">Running simulations...</p>
          ) : simResults ? (
            <div className="space-y-4">
              <div className="text-white text-sm space-y-1">
                <p>5th percentile return: {(simResults.p5 * 100).toFixed(2)}%</p>
                <p>Median return: {(simResults.p50 * 100).toFixed(2)}%</p>
                <p>95th percentile return: {(simResults.p95 * 100).toFixed(2)}%</p>
              </div>
              <div style={{ width: '100%', height: 150 }}>
                <ResponsiveContainer>
                  <BarChart data={histData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis dataKey="bin" tick={{ fontSize: 8 }} angle={-45} textAnchor="end" interval={0} />
                    <YAxis />
                    <Tooltip wrapperStyle={{ color: '#fff' }} />
                    <Bar dataKey="count" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <p className="text-[#8E9196]">Analyze portfolio to view simulation results.</p>
          )}
        </div>

        <footer className="mt-12 text-center text-[#8E9196]">
          <p className="mb-2">Created by <a href="https://bhavyarjohar.com/" target="_blank" rel="noopener noreferrer" className="hover:text-[#8B5CF6] transition-colors">Bhavya Johar</a></p>
          <div className="flex justify-center gap-4">
            <a
              href="https://github.com/BhavyaJohar/Options"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#8B5CF6] transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/bhavya-johar-5571b4170/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#8B5CF6] transition-colors"
            >
              LinkedIn
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
