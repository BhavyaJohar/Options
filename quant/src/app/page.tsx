'use client';

import { useState, useEffect } from 'react';
import PayoffDiagram from './components/PayoffDiagram';

export default function Home() {
  const [formData, setFormData] = useState({
    ticker: '',
    strikePrice: '',
    optionType: 'call',
    expiration: '',
    volatility: '0.3',
    riskFreeRate: '0.04'
  });

  const [bsPrice, setBsPrice] = useState<string | null>(null);
  const [binomialPrice, setBinomialPrice] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [greeks, setGreeks] = useState<{
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
  } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<
    HTMLInputElement | HTMLSelectElement
  >) => {
    const { name, value } = e.target;
    if (name === 'ticker') {
      setFormData((prev) => ({ ...prev, [name]: value.toUpperCase() }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Fetch current stock price when ticker changes
  useEffect(() => {
    const fetchStockPrice = async () => {
      if (!formData.ticker) {
        setCurrentPrice(null);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/stocks?ticker=${formData.ticker}`);
        const data = await response.json();
        
        if (response.ok) {
          setCurrentPrice(data.price);
          setError(null);
        } else {
          setError(data.error || 'Failed to fetch stock price');
          setCurrentPrice(null);
        }
      } catch {
        setError('Failed to fetch stock price');
        setCurrentPrice(null);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchStockPrice, 500);
    return () => clearTimeout(debounceTimer);
  }, [formData.ticker]);

  useEffect(() => {
    const { strikePrice, optionType, expiration, volatility, riskFreeRate } = formData;
    if (!strikePrice || !expiration || !volatility || !riskFreeRate || !currentPrice) return;
    
    const payload = {
      S: currentPrice,
      K: Number.parseFloat(strikePrice),
      T: Number.parseInt(expiration, 10),
      r: Number.parseFloat(riskFreeRate),
      sigma: Number.parseFloat(volatility),
      type: optionType,
      position: 'long',
      steps: 100
    };
    fetch('/api/price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then((res) => res.json())
      .then((data) => {
        setBsPrice(Number(data.price).toFixed(2));
        setBinomialPrice(Number(data.binomialPrice).toFixed(2));
        setGreeks({
          delta: Number(data.delta.toFixed(4)),
          gamma: Number(data.gamma.toFixed(4)),
          theta: Number(data.theta.toFixed(4)),
          vega: Number(data.vega.toFixed(4)),
          rho: Number(data.rho.toFixed(4))
        });
      })
      .catch(() => {
        setBsPrice(null);
        setBinomialPrice(null);
        setGreeks(null);
      });
  }, [formData, currentPrice]);

  const calculatePayoff = () => {
    const strike = Number.parseFloat(formData.strikePrice) || 0;
    const isCall = formData.optionType === 'call';
    const optionPrice = bsPrice ? Number.parseFloat(bsPrice) : 0;
    
    const data: Array<{ price: number; payoff: number; profitLoss: number }> = [];
    
    // Calculate a wider range around the strike price
    const minPrice = Math.max(0, strike - 100);
    const maxPrice = strike + 100;
    const step = (maxPrice - minPrice) / 50;
    
    for (let price = minPrice; price <= maxPrice; price += step) {
      // Calculate payoff based on option type
      const payoff = isCall 
        ? Math.max(0, price - strike)  // Call payoff increases as price goes up
        : Math.max(0, strike - price); // Put payoff increases as price goes down
      
      // Calculate profit/loss including the option premium
      const profitLoss = payoff - optionPrice;
      
      data.push({ 
        price: Number(price.toFixed(2)), 
        payoff: Number(payoff.toFixed(2)),
        profitLoss: Number(profitLoss.toFixed(2))
      });
    }
    
    return data;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1F2C] to-[#0F172A] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] bg-clip-text text-transparent">
            Options Price Calculator
          </h1>
          <p className="text-[#8E9196]">Visualize and analyze your options positions</p>
        </div>

        {/* Input Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Ticker */}
          <div className="p-6 bg-[#2D3748]/50 backdrop-blur-sm rounded-xl border border-[#4A5568]/30 shadow-lg hover:shadow-xl transition-shadow">
            <label htmlFor="ticker" className="text-[#8E9196] block mb-2 font-medium">Ticker</label>
            <div className="relative">
              <input
                id="ticker"
                type="text"
                name="ticker"
                value={formData.ticker}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-[#1A1F2C] border border-[#4A5568] rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent transition-all"
                placeholder="AAPL"
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#8B5CF6]" />
                </div>
              )}
            </div>
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
            {currentPrice && (
              <p className="text-[#8E9196] text-sm mt-2">
                Current Price: ${currentPrice.toFixed(2)}
              </p>
            )}
          </div>

          {/* Strike Price */}
          <div className="p-6 bg-[#2D3748]/50 backdrop-blur-sm rounded-xl border border-[#4A5568]/30 shadow-lg hover:shadow-xl transition-shadow">
            <label htmlFor="strikePrice" className="text-[#8E9196] block mb-2 font-medium">Strike Price</label>
            <input
              id="strikePrice"
              type="number"
              name="strikePrice"
              value={formData.strikePrice}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-[#1A1F2C] border border-[#4A5568] rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent transition-all"
              placeholder="100"
            />
          </div>

          {/* Option Type */}
          <div className="p-6 bg-[#2D3748]/50 backdrop-blur-sm rounded-xl border border-[#4A5568]/30 shadow-lg hover:shadow-xl transition-shadow">
            <label htmlFor="optionType" className="text-[#8E9196] block mb-2 font-medium">Option Type</label>
            <select
              id="optionType"
              name="optionType"
              value={formData.optionType}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-[#1A1F2C] border border-[#4A5568] rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent transition-all"
            >
              <option value="call">Call</option>
              <option value="put">Put</option>
            </select>
          </div>

          {/* Expiration */}
          <div className="p-6 bg-[#2D3748]/50 backdrop-blur-sm rounded-xl border border-[#4A5568]/30 shadow-lg hover:shadow-xl transition-shadow">
            <label htmlFor="expiration" className="text-[#8E9196] block mb-2 font-medium">Days to Expiration</label>
            <input
              id="expiration"
              type="number"
              name="expiration"
              value={formData.expiration}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-[#1A1F2C] border border-[#4A5568] rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent transition-all"
              placeholder="30"
            />
          </div>

          {/* Volatility */}
          <div className="p-6 bg-[#2D3748]/50 backdrop-blur-sm rounded-xl border border-[#4A5568]/30 shadow-lg hover:shadow-xl transition-shadow">
            <label htmlFor="volatility" className="text-[#8E9196] block mb-2 font-medium">Volatility (σ)</label>
            <input
              id="volatility"
              type="number"
              name="volatility"
              value={formData.volatility}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-[#1A1F2C] border border-[#4A5568] rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent transition-all"
              placeholder="0.30"
              step="0.01"
              min="0"
              max="1"
            />
          </div>

          {/* Risk-Free Rate */}
          <div className="p-6 bg-[#2D3748]/50 backdrop-blur-sm rounded-xl border border-[#4A5568]/30 shadow-lg hover:shadow-xl transition-shadow">
            <label htmlFor="riskFreeRate" className="text-[#8E9196] block mb-2 font-medium">Risk-Free Rate (r)</label>
            <input
              id="riskFreeRate"
              type="number"
              name="riskFreeRate"
              value={formData.riskFreeRate}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-[#1A1F2C] border border-[#4A5568] rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent transition-all"
              placeholder="0.04"
              step="0.01"
              min="0"
              max="0.2"
            />
          </div>
        </div>

        {/* Greeks Display */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="p-6 bg-[#2D3748]/50 backdrop-blur-sm rounded-xl border border-[#4A5568]/30 shadow-lg">
            <h3 className="text-[#8E9196] font-medium mb-2">Delta</h3>
            <p className="text-2xl font-bold text-[#8B5CF6]">
              {greeks?.delta !== undefined ? greeks.delta : '0.00'}
            </p>
            <p className="text-sm text-[#8E9196] mt-1">Rate of change of option price with respect to underlying price</p>
          </div>
          <div className="p-6 bg-[#2D3748]/50 backdrop-blur-sm rounded-xl border border-[#4A5568]/30 shadow-lg">
            <h3 className="text-[#8E9196] font-medium mb-2">Gamma</h3>
            <p className="text-2xl font-bold text-[#8B5CF6]">
              {greeks?.gamma !== undefined ? greeks.gamma : '0.00'}
            </p>
            <p className="text-sm text-[#8E9196] mt-1">Rate of change of delta with respect to underlying price</p>
          </div>
          <div className="p-6 bg-[#2D3748]/50 backdrop-blur-sm rounded-xl border border-[#4A5568]/30 shadow-lg">
            <h3 className="text-[#8E9196] font-medium mb-2">Theta</h3>
            <p className="text-2xl font-bold text-[#8B5CF6]">
              {greeks?.theta !== undefined ? greeks.theta : '0.00'}
            </p>
            <p className="text-sm text-[#8E9196] mt-1">Rate of change of option price with respect to time (per day)</p>
          </div>
          <div className="p-6 bg-[#2D3748]/50 backdrop-blur-sm rounded-xl border border-[#4A5568]/30 shadow-lg">
            <h3 className="text-[#8E9196] font-medium mb-2">Vega</h3>
            <p className="text-2xl font-bold text-[#8B5CF6]">
              {greeks?.vega !== undefined ? greeks.vega : '0.00'}
            </p>
            <p className="text-sm text-[#8E9196] mt-1">Rate of change of option price with respect to volatility (per 1%)</p>
          </div>
          <div className="p-6 bg-[#2D3748]/50 backdrop-blur-sm rounded-xl border border-[#4A5568]/30 shadow-lg">
            <h3 className="text-[#8E9196] font-medium mb-2">Rho</h3>
            <p className="text-2xl font-bold text-[#8B5CF6]">
              {greeks?.rho !== undefined ? greeks.rho : '0.00'}
            </p>
            <p className="text-sm text-[#8E9196] mt-1">Rate of change of option price with respect to interest rate (per 1%)</p>
          </div>
        </div>

        {/* Pricing Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 bg-[#2D3748]/50 backdrop-blur-sm rounded-xl border border-[#4A5568]/30 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-[#8E9196]">Black-Scholes Price</h2>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-[#8B5CF6]">
                ${bsPrice !== null ? bsPrice : '0.00'}
              </p>
              <p className="text-sm text-[#8E9196]">per contract</p>
            </div>
            <div className="mt-4">
              <p className="text-sm text-[#8E9196]">Assumptions:</p>
              <ul className="text-sm text-[#8E9196] list-disc list-inside mt-2">
                <li>European-style options</li>
                <li>No dividends</li>
                <li>Constant volatility</li>
                <li>Risk-free interest rate</li>
              </ul>
            </div>
          </div>
          <div className="p-6 bg-[#2D3748]/50 backdrop-blur-sm rounded-xl border border-[#4A5568]/30 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-[#8E9196]">Binomial Tree Price</h2>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-[#8B5CF6]">
                ${binomialPrice !== null ? binomialPrice : '0.00'}
              </p>
              <p className="text-sm text-[#8E9196]">per contract</p>
            </div>
            <div className="mt-4">
              <p className="text-sm text-[#8E9196]">Features:</p>
              <ul className="text-sm text-[#8E9196] list-disc list-inside mt-2">
                <li>American-style options</li>
                <li>Dividend payments</li>
                <li>Time-varying volatility</li>
                <li>Early exercise</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Payoff Diagram */}
        <PayoffDiagram
          data={calculatePayoff()}
          currentPrice={currentPrice}
          strikePrice={Number.parseFloat(formData.strikePrice) || 0}
          optionPrice={bsPrice ? Number.parseFloat(bsPrice) : null}
          optionType={formData.optionType}
        />
      </div>
    </div>
  );
}