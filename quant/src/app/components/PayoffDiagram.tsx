import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer
} from 'recharts';
import type { TooltipProps } from 'recharts';

interface PayoffData {
  price: number;
  payoff: number;
  profitLoss: number;
}

interface PayoffDiagramProps {
  data: PayoffData[];
  currentPrice: number | null;
  strikePrice: number;
  optionPrice: number | null;
  optionType: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#2D3748] p-4 rounded-lg border border-[#4A5568] shadow-lg">
        <p className="text-[#8E9196]">Stock Price: ${label.toFixed(2)}</p>
        <p className="text-[#8E9196]">P/L: ${payload?.[0]?.value?.toFixed(2) ?? '0.00'}</p>
      </div>
    );
  }
  return null;
};

export default function PayoffDiagram({
  data,
  currentPrice,
  strikePrice,
  optionPrice,
  optionType
}: PayoffDiagramProps) {
  const isCall = optionType === 'call';

  // Calculate break-even price
  const breakEvenPrice = isCall
    ? strikePrice + (optionPrice || 0)
    : strikePrice - (optionPrice || 0);

  // Calculate max profit/loss
  const maxProfit = isCall
    ? Number.POSITIVE_INFINITY
    : strikePrice - (optionPrice || 0);

  const maxLoss = optionPrice || 0;

  // Split data into positive and negative P/L
  const coloredData = data.map(d => ({
    price: d.price,
    profitLoss: d.profitLoss,
    posPL: d.profitLoss > 0 ? d.profitLoss : 0,
    negPL: d.profitLoss < 0 ? d.profitLoss : 0,
  }));

  return (
    <div className="p-6 bg-[#2D3748]/50 backdrop-blur-sm rounded-xl border border-[#4A5568]/30 shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-[#8E9196]">Payoff Diagram</h2>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={coloredData} margin={{ bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
            <XAxis
              dataKey="price"
              stroke="#8E9196"
              label={{
                value: 'Stock Price',
                position: 'insideBottom',
                fill: '#8E9196',
                offset: -20
              }}
            />
            <YAxis
              stroke="#8E9196"
              label={{
                value: 'Payoff',
                angle: -90,
                position: 'insideLeft',
                fill: '#8E9196'
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Negative region: red */}
            <Area
              type="monotone"
              dataKey="negPL"
              stroke="none"
              fill="#EF4444"
              fillOpacity={0.2}
            />
            <Area
              type="monotone"
              dataKey="negPL"
              stroke="#EF4444"
              strokeWidth={2}
              fill="none"
              dot={false}
            />

            {/* Positive region: green */}
            <Area
              type="monotone"
              dataKey="posPL"
              stroke="none"
              fill="#10B981"
              fillOpacity={0.2}
            />
            <Area
              type="monotone"
              dataKey="posPL"
              stroke="#10B981"
              strokeWidth={2}
              fill="none"
              dot={false}
              activeDot={{ r: 8 }}
            />
            
            {/* Current Price Line */}
            {currentPrice && (
              <ReferenceLine
                x={currentPrice}
                stroke="#EC4899"
                strokeDasharray="3 3"
                label={{
                  value: 'Current',
                  position: 'top',
                  fill: '#EC4899'
                }}
              />
            )}
            
            {/* Strike Price Line */}
            <ReferenceLine
              x={strikePrice}
              stroke="#8E9196"
              strokeDasharray="3 3"
              label={{
                value: 'Strike',
                position: 'top',
                fill: '#8E9196'
              }}
            />
            
            {/* Break-even Line */}
            <ReferenceLine
              x={breakEvenPrice}
              stroke="#F59E0B"
              strokeDasharray="3 3"
              label={{
                value: 'Break-even',
                position: 'top',
                fill: '#F59E0B'
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div className="p-4 bg-[#2D3748]/50 rounded-lg">
          <p className="text-[#8E9196] text-sm">Break-even Price</p>
          <p className="text-xl font-bold text-[#F59E0B]">${breakEvenPrice.toFixed(2)}</p>
        </div>
        <div className="p-4 bg-[#2D3748]/50 rounded-lg">
          <p className="text-[#8E9196] text-sm">Max Profit</p>
          <p className="text-xl font-bold text-[#10B981]">
            {maxProfit === Number.POSITIVE_INFINITY ? (
              <span className="text-3xl">∞</span>
            ) : (
              `$${maxProfit.toFixed(2)}`
            )}
          </p>
        </div>
        <div className="p-4 bg-[#2D3748]/50 rounded-lg">
          <p className="text-[#8E9196] text-sm">Max Loss</p>
          <p className="text-xl font-bold text-[#EF4444]">${maxLoss.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}