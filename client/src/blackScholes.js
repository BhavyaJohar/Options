import { exp, log, sqrt } from 'mathjs';
import { erf } from 'mathjs'; // If using mathjs for erf

// Helper function for standard normal cumulative distribution function
function cumulativeDistribution(d) {
    return 0.5 * (1 + erf(d / sqrt(2)));
}

// Function to calculate d1
function calculateD1(S, K, r, sigma, T) {
    return (log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrt(T));
}

// Function to calculate d2
function calculateD2(d1, sigma, T) {
    return d1 - sigma * sqrt(T);
}

// Black-Scholes function that handles both call and put option pricing
export function blackScholes(S, K, r, sigma, T, optionType = 'call') {
    // Prevent division by zero or invalid inputs
    if (typeof S !== 'number' || typeof K !== 'number' || 
        typeof r !== 'number' || typeof sigma !== 'number' || 
        typeof T !== 'number') {
        return NaN;
    }

    if (sigma === 0) {
        // For zero volatility, the option is worth its intrinsic value
        if (optionType === 'call') {
            return Math.max(S - K * exp(-r * T), 0);
        } else {
            return Math.max(K * exp(-r * T) - S, 0);
        }
    }

    if (T < 0.0001) { // Less than 1 day
        // For very small T, use intrinsic value
        if (optionType === 'call') {
            return Math.max(S - K, 0);
        } else {
            return Math.max(K - S, 0);
        }
    }

    const d1 = calculateD1(S, K, r, sigma, T);
    const d2 = calculateD2(d1, sigma, T);

    const Nd1 = cumulativeDistribution(d1);
    const Nd2 = cumulativeDistribution(d2);
    const Nd1Negative = cumulativeDistribution(-d1);
    const Nd2Negative = cumulativeDistribution(-d2);

    const presentValueK = K * exp(-r * T);

    let optionPrice;

    if (optionType === 'call') {
        optionPrice = S * Nd1 - presentValueK * Nd2;
    } else if (optionType === 'put') {
        optionPrice = presentValueK * Nd2Negative - S * Nd1Negative;
    } else {
        throw new Error('Invalid option type. Must be "call" or "put".');
    }

    return optionPrice;
}
