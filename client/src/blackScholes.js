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
    if (S <= 0 || K <= 0 || sigma <= 0 || T <= 0) {
        return NaN;
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
