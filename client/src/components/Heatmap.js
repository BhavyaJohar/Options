import React, { useState, useEffect, useCallback } from 'react';
import { Scatter } from 'react-chartjs-2';
import { blackScholes } from '../blackScholes';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Alert, Spinner } from 'react-bootstrap';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Heatmap = ({ heatmapData, purchaseCallPrice, purchasePutPrice }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [generatedData, setGeneratedData] = useState(null);
    const {
        spotPriceMin,
        spotPriceMax,
        volatilityMin,
        volatilityMax,
        strikePrice,
        maturity,
        riskFreeRate,
    } = heatmapData;

    const [spotPriceStep, setSpotPriceStep] = useState((spotPriceMax - spotPriceMin) / 20);
    const [volatilityStep, setVolatilityStep] = useState((volatilityMax - volatilityMin) / 10);

    // Function to adjust steps based on screen size
    const updateStepsBasedOnScreenSize = useCallback(() => {
        const screenWidth = window.innerWidth;

        // Change the step sizes for smaller screens
        if (screenWidth <= 425) {
            setSpotPriceStep((spotPriceMax - spotPriceMin) / 10);
            setVolatilityStep((volatilityMax - volatilityMin) / 4);
        } else if (screenWidth <= 768) {
            setSpotPriceStep((spotPriceMax - spotPriceMin) / 20);
            setVolatilityStep((volatilityMax - volatilityMin) / 10);
        } else {
            setSpotPriceStep((spotPriceMax - spotPriceMin) / 20);
            setVolatilityStep((volatilityMax - volatilityMin) / 10);
        }
    }, [spotPriceMin, spotPriceMax, volatilityMin, volatilityMax]);

    // Validate input parameters
    const validateInputs = useCallback(() => {
        if (spotPriceMin >= spotPriceMax) {
            setError('Spot price minimum must be less than maximum');
            return false;
        }
        if (volatilityMin >= volatilityMax) {
            setError('Volatility minimum must be less than maximum');
            return false;
        }
        if (strikePrice <= 0 || maturity <= 0 || riskFreeRate < 0) {
            setError('Invalid parameters: Strike price, maturity, and risk-free rate must be positive');
            return false;
        }
        return true;
    }, [spotPriceMin, spotPriceMax, volatilityMin, volatilityMax, strikePrice, maturity, riskFreeRate]);

    // Generate heatmap data with loading state
    const generateHeatmapData = useCallback(() => {
        setIsLoading(true);
        setError(null);

        if (!validateInputs()) {
            setIsLoading(false);
            return null;
        }

        const callProfits = [];
        const putProfits = [];

        // Check if purchase prices are valid
        if (!purchaseCallPrice || purchaseCallPrice === 0 || !purchasePutPrice || purchasePutPrice === 0) {
            setError('Invalid purchase prices. Please calculate option prices first.');
            setIsLoading(false);
            return null;
        }

        try {
            // Generate data points for the heatmap based on user input ranges
            for (let spot = spotPriceMin; spot <= spotPriceMax; spot += spotPriceStep) {
                for (let vol = volatilityMin; vol <= volatilityMax; vol += volatilityStep) {
                    // Calculate option prices at each realized spot price and volatility
                    const realizedCallPrice = blackScholes(spot, strikePrice, riskFreeRate, vol, maturity, 'call');
                    const realizedPutPrice = blackScholes(spot, strikePrice, riskFreeRate, vol, maturity, 'put');

                    // Ensure valid calculations
                    if (isNaN(realizedCallPrice) || isNaN(realizedPutPrice)) {
                        continue;
                    }

                    // Calculate P&L percentages, avoid division by zero
                    const callPnLPercentage = purchaseCallPrice !== 0 ? ((realizedCallPrice - purchaseCallPrice) / purchaseCallPrice) * 100 : 0;
                    const putPnLPercentage = purchasePutPrice !== 0 ? ((realizedPutPrice - purchasePutPrice) / purchasePutPrice) * 100 : 0;

                    // Add data points for call and put P&L with proper labels
                    callProfits.push({
                        x: spot,
                        y: vol,
                        r: 15,
                        label: `Spot: ${spot.toFixed(2)}, Vol: ${vol.toFixed(2)}, Call P&L: ${callPnLPercentage.toFixed(2)}%`,
                        backgroundColor: callPnLPercentage >= 0 ? 'rgba(0, 255, 0, 0.6)' : 'rgba(255, 0, 0, 0.6)',
                    });

                    putProfits.push({
                        x: spot,
                        y: vol,
                        r: 15,
                        label: `Spot: ${spot.toFixed(2)}, Vol: ${vol.toFixed(2)}, Put P&L: ${putPnLPercentage.toFixed(2)}%`,
                        backgroundColor: putPnLPercentage >= 0 ? 'rgba(0, 255, 0, 0.6)' : 'rgba(255, 0, 0, 0.6)',
                    });
                }
            }

            return { callProfits, putProfits };
        } catch (err) {
            setError('Error calculating heatmap data. Please check your inputs.');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [spotPriceMin, spotPriceMax, volatilityMin, volatilityMax, strikePrice, maturity, riskFreeRate, purchaseCallPrice, purchasePutPrice, spotPriceStep, volatilityStep, validateInputs]);

    // Use useEffect to monitor the window resize event
    useEffect(() => {
        updateStepsBasedOnScreenSize();
        window.addEventListener('resize', updateStepsBasedOnScreenSize);
        return () => {
            window.removeEventListener('resize', updateStepsBasedOnScreenSize);
        };
    }, [updateStepsBasedOnScreenSize]);

    // Use useEffect to generate heatmap data when dependencies change
    useEffect(() => {
        const data = generateHeatmapData();
        setGeneratedData(data);
    }, [generateHeatmapData]);

    if (!generatedData) {
        return (
            <div className="heatmap-container">
                {error && <Alert variant="danger">{error}</Alert>}
                {isLoading && (
                    <div className="text-center p-4">
                        <Spinner animation="border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </Spinner>
                    </div>
                )}
            </div>
        );
    }

    const { callProfits, putProfits } = generatedData;

    // Data structure for Call and Put heatmaps
    const callData = {
        datasets: [
            {
                label: 'Call P&L Heatmap',
                data: callProfits,
                backgroundColor: callProfits.map(p => p.backgroundColor),
                pointStyle: 'rect',
            },
        ],
    };

    const putData = {
        datasets: [
            {
                label: 'Put P&L Heatmap',
                data: putProfits,
                backgroundColor: putProfits.map(p => p.backgroundColor),
                pointStyle: 'rect',
            },
        ],
    };

    // Configuration for the heatmap display
    const options = {
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Spot Price',
                },
                grid: {
                    drawOnChartArea: false,
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Realized Volatility',
                },
                grid: {
                    drawOnChartArea: false,
                },
            },
        },
        elements: {
            point: {
                radius: (context) => context.raw?.r || 15,
            },
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        return context.raw?.label || '';
                    },
                },
            },
        },
    };

    return (
        <div className="heatmap-container">
            {error && <Alert variant="danger">{error}</Alert>}
            {isLoading && (
                <div className="text-center p-4">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                </div>
            )}
            <div className="heatmap-column">
                <h3>Call Price Heatmap</h3>
                <Scatter data={callData} options={options} />
            </div>
            <div className="heatmap-column">
                <h3>Put Price Heatmap</h3>
                <Scatter data={putData} options={options} />
            </div>
        </div>
    );
};

export default Heatmap;