# Options Price Calculator

A Next.js‑based options pricing and visualization tool that combines real‑time market data with theoretical models (Black‑Scholes and Binomial Tree) to help you explore and analyze option strategies.

---

## Features

- **Options Chain Lookup**  
  Fetch live option chains from Polygon.io by ticker symbol.

- **Black‑Scholes Pricing & Greeks**  
  Calculate theoretical call/put prices and the full suite of Greeks (Delta, Gamma, Theta, Vega, Rho).

- **Binomial Tree Pricing**  
  Price options (including American‑style) via a Cox‑Ross‑Rubinstein binomial tree.

- **Interactive Payoff Diagrams**  
  Static expiration payoff curves with red/green shading for negative/positive P&L, plus reference lines for strike, current, and break‑even prices.

- **Custom “Bento” UI**  
  A modern, responsive grid layout to build positions manually:  
  - Ticker  
  - Strike Price  
  - Option Type (Call/Put)  
  - Position (Long/Short)  
  - Days to Expiration  
  - Premium

---

## Project Structure

```
quant/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── options/route.ts    # GET /api/options → fetch option chain
│   │   │   └── price/route.ts      # POST /api/price  → compute price & Greeks (BS + Binomial)
│   │   └── page.tsx                # Main UI: form + payoff chart + pricing results
│   └── components/
│       └── PayoffDiagram.tsx       # Reusable payoff chart component
├── .env                            # NEXT_PUBLIC_POLYGON_API_KEY
└── package.json                    # Dependencies & scripts
```

---

## Installation

1. **Clone the repo**  
   ```bash
   git clone https://github.com/your‑org/options‑price‑calculator.git
   cd options‑price‑calculator/quant
   ```

2. **Install dependencies**  
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment**  
   Create a `.env` file at the project root with your Polygon API key:
   ```env
   NEXT_PUBLIC_POLYGON_API_KEY=your_polygon_api_key_here
   ```

---

## Usage

- **Start development server**  
  ```bash
  npm run dev
  # or
  yarn dev
  ```
  The app will be available at `http://localhost:3000`.

- **Build for production**  
  ```bash
  npm run build
  npm start
  # or
  yarn build
  yarn start
  ```

---

## API Endpoints

### `/api/options` (GET)

Fetches the options chain for a given stock ticker.

- **Query Parameters**:  
  - `ticker` (string) — Stock symbol (e.g. `AAPL`)

- **Response**:  
  ```json
  {
    "results": [
      {
        "strike": 100,
        "expirationDate": "2025-05-17",
        "bid": 2.5,
        "ask": 2.6,
        …
      },
      …
    ]
  }
  ```

### `/api/price` (POST)

Computes theoretical option price and Greeks via both Black‑Scholes and a Binomial Tree.

- **Request Body**:
  ```json
  {
    "S": 150.0,         // Current underlying price
    "K": 155.0,         // Strike price
    "T": 30,            // Days to expiration
    "r": 0.05,          // Risk‑free rate (annual decimal)
    "sigma": 0.3,       // Volatility (decimal)
    "type": "call",     // "call" or "put"
    "position": "long", // "long" or "short"
    "premium": 2.5,     // Premium paid/received
    "steps": 100        // Binomial tree steps (optional, default 100)
  }
  ```

- **Response**:
  ```json
  {
    "price": 3.12,         // Black‑Scholes price
    "delta": 0.62,
    "gamma": 0.025,
    "theta": -0.045,       // per day
    "vega": 0.12,          // per 1% vol
    "rho": 0.018,          // per 1% rate
    "binomialPrice": 3.15, // Binomial Tree price
    "pnlCurve": [ … ]      // Array of { price, pnl, delta, gamma }
  }
  ```

---

## Styling & UI

- Tailwind CSS for utility‑first styling  
- Dark theme with vibrant accent colors  
- Responsive “bento‐box” layout for form controls  
- Recharts for dynamic, interactive charts

---

## Contributing

1. Fork the repository  
2. Create a new branch: `git checkout -b feat/my-feature`  
3. Commit your changes & push: `git push origin feat/my-feature`  
4. Open a Pull Request

---
