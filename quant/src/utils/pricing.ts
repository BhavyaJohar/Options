// Standard normal cumulative distribution function
function cdf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.sqrt(2.0);

  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return 0.5 * (1.0 + sign * y);
}

// Standard normal probability density function
function pdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

// Binomial (Cox-Ross-Rubinstein) tree option pricing
export function binomialTreePrice(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  type: 'call' | 'put',
  steps: number
): number {
  const dt = T / steps;
  const u = Math.exp(sigma * Math.sqrt(dt));
  const d = 1 / u;
  const p = (Math.exp(r * dt) - d) / (u - d);

  // Price at terminal nodes
  const prices = Array(steps + 1)
    .fill(0)
    .map((_, i) => S * (u ** (steps - i)) * (d ** i));
  // Option value at terminal nodes
  let values = prices.map((price) =>
    type === 'call' ? Math.max(0, price - K) : Math.max(0, K - price)
  );

  // Step backwards
  for (let step = steps - 1; step >= 0; step--) {
    values = values.slice(0, step + 1).map((v, i) =>
      Math.exp(-r * dt) * (p * values[i] + (1 - p) * values[i + 1])
    );
  }
  return values[0];
}

export function blackScholes(
  S: number, // Current stock price
  K: number, // Strike price
  T: number, // Time to expiration in years
  r: number, // Risk-free interest rate
  sigma: number, // Volatility
  type: 'call' | 'put'
): {
  price: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
} {
  const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  let price: number;
  let delta: number;
  let theta: number;
  let rho: number;

  if (type === 'call') {
    price = S * cdf(d1) - K * Math.exp(-r * T) * cdf(d2);
    delta = cdf(d1);
    theta = (-S * pdf(d1) * sigma) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * cdf(d2);
    rho = K * T * Math.exp(-r * T) * cdf(d2);
  } else {
    price = K * Math.exp(-r * T) * cdf(-d2) - S * cdf(-d1);
    delta = cdf(d1) - 1;
    theta = (-S * pdf(d1) * sigma) / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * cdf(-d2);
    rho = -K * T * Math.exp(-r * T) * cdf(-d2);
  }

  const gamma = pdf(d1) / (S * sigma * Math.sqrt(T));
  const vega = S * Math.sqrt(T) * pdf(d1);

  return {
    price,
    delta,
    gamma,
    theta,
    vega,
    rho,
  };
} 