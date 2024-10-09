import React, { useState, useEffect } from 'react';
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Heatmap = ({ heatmapData, purchaseCallPrice, purchasePutPrice }) => {
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
    const updateStepsBasedOnScreenSize = () => {
        const screenWidth = window.innerWidth;

        // Change the step sizes for smaller screens
        if (screenWidth <= 425) {
            setSpotPriceStep((spotPriceMax - spotPriceMin) / 10); // Larger steps for smaller screens
            setVolatilityStep((volatilityMax - volatilityMin) / 4); // Larger steps for smaller screens
        } else if (screenWidth <= 768) {
            setSpotPriceStep((spotPriceMax - spotPriceMin) / 20); // Default steps for larger screens
            setVolatilityStep((volatilityMax - volatilityMin) / 10); // Default steps for larger screens
        } else {
            setSpotPriceStep((spotPriceMax - spotPriceMin) / 20); // Default steps for larger screens
            setVolatilityStep((volatilityMax - volatilityMin) / 10); // Default steps for larger screens
        }
    };

    // Use useEffect to monitor the window resize event
    useEffect(() => {
        // Set initial steps based on the initial screen size
        updateStepsBasedOnScreenSize();

        // Update steps whenever the window is resized
        window.addEventListener('resize', updateStepsBasedOnScreenSize);

        // Clean up the event listener on component unmount
        return () => {
            window.removeEventListener('resize', updateStepsBasedOnScreenSize);
        };
    }, [spotPriceMin, spotPriceMax, volatilityMin, volatilityMax]);

    const callProfits = [];
    const putProfits = [];

    // Check if purchase prices are valid
    if (!purchaseCallPrice || purchaseCallPrice === 0 || !purchasePutPrice || purchasePutPrice === 0) {
        console.error('Invalid purchase call or put price');
        return null; // Return null to avoid rendering if prices are invalid
    }

    // Generate data points for the heatmap based on user input ranges
    for (let spot = spotPriceMin; spot <= spotPriceMax; spot += spotPriceStep) {
        for (let vol = volatilityMin; vol <= volatilityMax; vol += volatilityStep) {
            // Calculate option prices at each realized spot price and volatility
            const realizedCallPrice = blackScholes(spot, strikePrice, riskFreeRate, vol, maturity, 'call');
            const realizedPutPrice = blackScholes(spot, strikePrice, riskFreeRate, vol, maturity, 'put');

            // Ensure valid calculations
            if (isNaN(realizedCallPrice) || isNaN(realizedPutPrice)) {
                continue; // Skip invalid calculations
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
                backgroundColor: callPnLPercentage >= 0 ? 'rgba(0, 255, 0, 0.6)' : 'rgba(255, 0, 0, 0.6)', // Green for profit, Red for loss
            });

            putProfits.push({
                x: spot,
                y: vol,
                r: 15,
                label: `Spot: ${spot.toFixed(2)}, Vol: ${vol.toFixed(2)}, Put P&L: ${putPnLPercentage.toFixed(2)}%`,
                backgroundColor: putPnLPercentage >= 0 ? 'rgba(0, 255, 0, 0.6)' : 'rgba(255, 0, 0, 0.6)', // Green for profit, Red for loss
            });
        }
    }

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
                radius: (context) => context.raw?.r || 15, // Ensure radius is always valid with a fallback of 15
            },
        },
        plugins: {
            legend: {
                display: false, // Hide the legend
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        return context.raw?.label || ''; // Display formatted P&L, Spot Price, and Volatility on hover
                    },
                },
            },
        },
    };

    return (
        <div className="heatmap-container">
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