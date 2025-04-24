import { NextResponse } from 'next/server';
import { blackScholes, binomialTreePrice } from '@/utils/pricing';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { S, K, T: T_days, r, sigma, type, position, steps = 100 } = body;

    // Validate input
    if (!S || !K || !T_days || !r || !sigma || !type) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (type !== 'call' && type !== 'put') {
      return NextResponse.json(
        { error: 'Option type must be either "call" or "put"' },
        { status: 400 }
      );
    }

    // Convert time to expiration from days to years
    const T_years = T_days / 365;

    // Calculate option price and Greeks
    const result = blackScholes(S, K, T_years, r, sigma, type);
    
    // Standardize Greeks: theta per day, vega per 1% vol, rho per 1% rate
    result.theta = result.theta / 365;
    result.vega = result.vega / 100;
    result.rho = result.rho / 100;

    // Adjust Greeks for position (long/short)
    if (position === 'short') {
      result.delta = -result.delta;
      result.gamma = -result.gamma;
      result.theta = -result.theta;
      result.vega = -result.vega;
      result.rho = -result.rho;
    }

    // Binomial tree price
    const binomialPrice = binomialTreePrice(S, K, T_years, r, sigma, type, steps);

    return NextResponse.json({
      ...result,
      binomialPrice,
    });
  } catch (err) {
    console.error('Error calculating option price:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 