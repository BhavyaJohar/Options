require('dotenv').config(); // Load environment variables from .env file

const math = require('mathjs');
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

// Use environment variables for sensitive info
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// MySQL connection using environment variables
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT
});

// Connect to the database
db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Black-Scholes calculation function
const calculateBlackScholes = (S, K, r, sigma, T) => {
    const d1 = (Math.log(S / K) + (r + (Math.pow(sigma, 2) / 2)) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);

    // Cumulative distribution function for a standard normal distribution
    const N = (x) => {
        return (1.0 + math.erf(x / Math.sqrt(2.0))) / 2.0;
    };

    const callPrice = S * N(d1) - K * Math.exp(-r * T) * N(d2);
    const putPrice = K * Math.exp(-r * T) * N(-d2) - S * N(-d1);

    return { callPrice, putPrice };
};

// API route to save user inputs and calculated option prices
app.post('/api/saveOptionsData', (req, res) => {
    const { assetPrice, strikePrice, maturity, volatility, riskFreeRate } = req.body;

    // Run the Black-Scholes calculation
    const { callPrice, putPrice } = calculateBlackScholes(assetPrice, strikePrice, riskFreeRate, volatility, maturity);

    // Insert all the values into the database
    const query = `INSERT INTO options_data (asset_price, strike_price, maturity, volatility, risk_free_rate, call_price, put_price) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.query(query, [assetPrice, strikePrice, maturity, volatility, riskFreeRate, callPrice, putPrice], (err, result) => {
        if (err) {
            return res.status(500).send('Error saving data to database');
        }
        res.send('Data saved successfully');
    });
});

// API route to get all options data (for heatmap)
app.get('/api/getOptionsData', (req, res) => {
    const query = 'SELECT * FROM options_data';

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).send('Error fetching data from database');
        }
        res.json(results);
    });
});

// API route to get latest options data
app.get('/api/getLatestOptionsData', (req, res) => {
    const query = `SELECT * FROM options_data ORDER BY id DESC LIMIT 1`; // Fetch the most recent row
    db.query(query, (err, result) => {
        if (err) {
            return res.status(500).send('Error fetching data from database');
        }
        res.json(result[0]); // Return the most recent row
    });
});

app.post('/api/calculatePnL', (req, res) => {
    const { spotPriceMin, spotPriceMax, volatilityMin, volatilityMax, numSteps } = req.body;

    // Get the most recent option prices from the database
    db.query('SELECT * FROM options_data ORDER BY id DESC LIMIT 1', (err, result) => {
        if (err) {
            return res.status(500).send('Error fetching data from database');
        }

        const latestData = result[0];
        const purchaseCallPrice = latestData.call_price;
        const purchasePutPrice = latestData.put_price;

        const strikePrice = latestData.strike_price;
        const maturity = latestData.maturity;
        const riskFreeRate = latestData.risk_free_rate;

        const callPnL = [];
        const putPnL = [];

        const spotPriceStep = (spotPriceMax - spotPriceMin) / numSteps;
        const volatilityStep = (volatilityMax - volatilityMin) / numSteps;

        // Calculate P&L for various spot prices and volatilities
        for (let spot = spotPriceMin; spot <= spotPriceMax; spot += spotPriceStep) {
            for (let vol = volatilityMin; vol <= volatilityMax; vol += volatilityStep) {
                const { callPrice, putPrice } = calculateBlackScholes(spot, strikePrice, riskFreeRate, vol, maturity);

                // P&L is the difference between the current option price and the purchase price
                const callPnLValue = ((callPrice - purchaseCallPrice) / purchaseCallPrice) * 100;
                const putPnLValue = ((putPrice - purchasePutPrice) / purchasePutPrice) * 100;

                callPnL.push({ spot, vol, pnl: callPnLValue });
                putPnL.push({ spot, vol, pnl: putPnLValue });
            }
        }

        res.json({ callPnL, putPnL });
    });
});

// Start the server
app.listen(PORT, '0.0.0.0',() => {
    console.log(`Server running on http://localhost:${PORT}`);
});
