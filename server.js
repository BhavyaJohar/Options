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
    database: process.env.DB_DATABASE
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

// API route to fetch the most recent row from the options_data table
app.get('/api/getLatestOptionsData', (req, res) => {
    const query = `SELECT * FROM options_data ORDER BY id DESC LIMIT 1`; // Fetch the most recent row

    db.query(query, (err, result) => {
        if (err) {
            return res.status(500).send('Error fetching data from database');
        }
        res.json(result[0]); // Return the most recent row
    });
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
